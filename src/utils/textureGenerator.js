import * as THREE from 'three';

const textureCache = new Map();

export function createSpineTexture(title, author, colorHex) {
  const cacheKey = `spine_${title}_${author}_${colorHex}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Fondo del lomo
  ctx.fillStyle = colorHex || '#c4683c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Textura y sombreado lateral
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0.3)');
  grad.addColorStop(0.2, 'rgba(255,255,255,0.12)');
  grad.addColorStop(0.8, 'rgba(0,0,0,0.15)');
  grad.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Filetes dorados arriba y abajo
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 24, canvas.width - 20, 16);
  ctx.strokeRect(10, canvas.height - 40, canvas.width - 20, 16);

  // Título vertical
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#fff9f0';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  const cleanTitle = (title || 'Libro').length > 22 ? (title.substring(0, 20) + '…') : title;
  ctx.fillText(cleanTitle, 0, -8);

  ctx.fillStyle = '#e8d5c4';
  ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
  const cleanAuthor = (author || '').length > 22 ? (author.substring(0, 20) + '…') : author;
  ctx.fillText(cleanAuthor, 0, 16);

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}

export function createCoverCanvasTexture(title, author, colorHex) {
  const cacheKey = `cover_${title}_${author}_${colorHex}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');

  // Fondo de portada
  ctx.fillStyle = colorHex || '#c4683c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Marco elegante
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  // Título
  ctx.fillStyle = '#fffcf7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 36px "Plus Jakarta Sans", serif';

  const words = (title || 'Sin Título').split(' ');
  let line = '';
  let y = canvas.height * 0.38;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    if (ctx.measureText(testLine).width > canvas.width - 120 && n > 0) {
      ctx.fillText(line.trim(), canvas.width / 2, y);
      line = words[n] + ' ';
      y += 44;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), canvas.width / 2, y);

  // Autor
  if (author) {
    ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#eedcc9';
    ctx.fillText(author, canvas.width / 2, y + 60);
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}

export function createPagesTexture() {
  const cacheKey = 'pages_texture';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f5eedf';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#ded0bb';
  ctx.lineWidth = 1;
  for (let y = 0; y < canvas.height; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}
