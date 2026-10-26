import JSZip from 'jszip';

export async function parseEpubWithJSZip(arrayBuffer) {
  const blobUrls = [];
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Encontrar la ruta del manifiesto OPF mediante container.xml
  let opfPath = '';
  const containerFile = zip.file('META-INF/container.xml');
  if (containerFile) {
    const containerText = await containerFile.async('text');
    const m = containerText.match(/full-path\s*=\s*["']([^"']+)["']/i);
    if (m && m[1]) opfPath = m[1].trim();
  }

  // Fallback si no está container.xml: buscar cualquier .opf
  if (!opfPath || !zip.file(opfPath)) {
    const opfEntries = Object.keys(zip.files).filter(k => k.toLowerCase().endsWith('.opf'));
    if (opfEntries.length > 0) opfPath = opfEntries[0];
  }

  let chapterPaths = [];
  let opfDir = '';

  if (opfPath && zip.file(opfPath)) {
    opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
    const opfText = await zip.file(opfPath).async('text');

    // Mapear manifest: id -> href
    const manifest = {};
    const itemRegex = /<item\b([^>]+)>/gi;
    let match;
    while ((match = itemRegex.exec(opfText)) !== null) {
      const attrs = match[1];
      const idMatch = attrs.match(/\bid\s*=\s*["']([^"']+)["']/i);
      const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i);
      if (idMatch && hrefMatch) {
        manifest[idMatch[1]] = hrefMatch[1];
      }
    }

    // Seguir el spine en orden secuencial de lectura
    const itemrefRegex = /<itemref\b([^>]+)>/gi;
    while ((match = itemrefRegex.exec(opfText)) !== null) {
      const attrs = match[1];
      const idrefMatch = attrs.match(/\bidref\s*=\s*["']([^"']+)["']/i);
      if (idrefMatch && manifest[idrefMatch[1]]) {
        const rawHref = decodeURIComponent(manifest[idrefMatch[1]]);
        const resolved = resolveZipPath(opfDir, rawHref);
        if (zip.file(resolved)) {
          chapterPaths.push(resolved);
        } else if (zip.file(rawHref)) {
          chapterPaths.push(rawHref);
        }
      }
    }
  }

  // Fallback: si no se encontró spine, extraer todos los archivos .xhtml o .html ordenados
  if (chapterPaths.length === 0) {
    chapterPaths = Object.keys(zip.files).filter(k => {
      const lower = k.toLowerCase();
      return (lower.endsWith('.xhtml') || lower.endsWith('.html') || lower.endsWith('.htm')) &&
             !lower.includes('toc') && !k.startsWith('__MACOSX');
    }).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }

  if (chapterPaths.length === 0) {
    return { chapters: [], blobUrls: [] };
  }

  // 2. Extraer todas las imágenes del zip y mapear a Blob URLs
  const imageMap = new Map();
  const imgExts = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];

  for (const [filename, fileObj] of Object.entries(zip.files)) {
    const lower = filename.toLowerCase();
    if (imgExts.some(ext => lower.endsWith(ext))) {
      try {
        const mimeType = lower.endsWith('.svg') ? 'image/svg+xml' :
                         lower.endsWith('.png') ? 'image/png' :
                         lower.endsWith('.gif') ? 'image/gif' :
                         lower.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
        const blob = await fileObj.async('blob');
        const typedBlob = blob.type ? blob : new Blob([blob], { type: mimeType });
        const blobUrl = URL.createObjectURL(typedBlob);
        blobUrls.push(blobUrl);

        imageMap.set(filename, blobUrl);
        const base = filename.split('/').pop();
        if (!imageMap.has(base)) imageMap.set(base, blobUrl);
      } catch (e) {}
    }
  }

  // 3. Procesar y sanitizar cada capítulo
  const domParser = new DOMParser();
  const chapters = [];

  for (let i = 0; i < chapterPaths.length; i++) {
    const cPath = chapterPaths[i];
    const file = zip.file(cPath);
    if (!file) continue;

    const rawHtml = await file.async('text');
    const doc = domParser.parseFromString(rawHtml, 'text/html');

    // Extraer título del capítulo
    let title = '';
    const headingEl = doc.querySelector('h1, h2, h3, title');
    if (headingEl && headingEl.textContent.trim()) {
      title = headingEl.textContent.trim().replace(/\s+/g, ' ');
    } else {
      title = `Capítulo ${chapters.length + 1}`;
    }

    // Reemplazar imágenes por sus Blob URLs correspondientes
    const cDir = cPath.includes('/') ? cPath.substring(0, cPath.lastIndexOf('/') + 1) : '';

    doc.querySelectorAll('img, image').forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('xlink:href');
      if (src) {
        const cleanSrc = decodeURIComponent(src);
        const resolved = resolveZipPath(cDir, cleanSrc);
        const baseName = cleanSrc.split('/').pop().split('?')[0];

        const matchUrl = imageMap.get(resolved) || imageMap.get(baseName) || imageMap.get(cleanSrc);
        if (matchUrl) {
          img.setAttribute('src', matchUrl);
          if (img.hasAttribute('xlink:href')) img.removeAttribute('xlink:href');
        }
      }
    });

    // Remover scripts o estilos externos que puedan interferir
    doc.querySelectorAll('script, link[rel="stylesheet"]').forEach(el => el.remove());

    const content = doc.body ? doc.body.innerHTML : rawHtml;

    if (content.trim().length > 15) {
      chapters.push({
        chapterNum: chapters.length + 1,
        title: title,
        html: content
      });
    }
  }

  return { chapters, blobUrls };
}

function resolveZipPath(baseDir, relativePath) {
  let cleanRel = relativePath.replace(/^\.\//, '');
  let full = baseDir ? (baseDir + cleanRel) : cleanRel;

  const parts = full.split('/');
  const stack = [];
  for (const part of parts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
}

export const DEMO_PAGES = [
  {
    chapter: 'Capítulo I',
    content: 'En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor. Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lantejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda...'
  },
  {
    chapter: 'Capítulo II',
    content: 'Hechas, pues, estas prevenciones, no quiso aguardar más tiempo a poner en efeto su pensamiento, apretándole a ello la falta que él pensaba que hacía en el mundo su tardanza, según eran los agravios que pensaba deshacer, tuertos que enderezar, sinrazones que enmendar, y abusos que mejorar, y deudas que satisfacer...'
  },
  {
    chapter: 'Capítulo III',
    content: 'Y así, con estos tan agradables pensamientos, ensilló a Rocinante, vistió su armadura y salió al campo con grandísimo contento y alborozo de ver con cuánta facilidad había dado principio a su buen deseo. Mas apenas se vio en el campo, cuando le asaltó un pensamiento terrible, y tal, que por poco le hiciera dejar la comenzada empresa...'
  },
  {
    chapter: 'Capítulo IV (Final)',
    content: 'Caminaba nuestro flamante aventurero hablando consigo mismo y diciendo: —«¿Quién duda sino que en los venideros tiempos, cuando salga a luz la verdadera historia de mis famosos hechos, que el sabio que los escribiere no ponga, cuando llegue a contar esta mi primera salida tan de mañana...» ¡Has llegado al final de esta lectura!'
  }
];
