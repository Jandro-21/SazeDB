// -------------------------------------------------------------
// CONFIGURACIÓN Y CONSTANTES DE ALMACENAMIENTO LOCAL
// -------------------------------------------------------------
const STORAGE_KEY = 'bookcrud_library_v4';
const PROGRESS_KEY_PREFIX = 'bookcrud_page_';
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 768);

// -------------------------------------------------------------
// INDEXEDDB PARA ALMACENAR ARCHIVOS DE LIBROS (PDF, EPUB, AZW3)
// -------------------------------------------------------------
const IDB_NAME = 'BookCRUD_FilesStore';
const IDB_VERSION = 1;
const IDB_STORE = 'bookFiles';

function openFilesDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function saveBookFileToDB(bookId, arrayBuffer, fileName, fileType) {
  try {
    const db = await openFilesDB();
    if (!db) return;
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put({ data: arrayBuffer, fileName, fileType }, bookId);
  } catch (err) {
    console.warn('No se pudo guardar el archivo en IndexedDB:', err);
  }
}

async function getBookFileFromDB(bookId) {
  try {
    const db = await openFilesDB();
    if (!db) return null;
    const tx = db.transaction(IDB_STORE, 'readonly');
    return new Promise(resolve => {
      const req = tx.objectStore(IDB_STORE).get(bookId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

async function deleteBookFileFromDB(bookId) {
  try {
    const db = await openFilesDB();
    if (!db) return;
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(bookId);
  } catch (err) {}
}

// -------------------------------------------------------------
// CONTENIDO DE LECTURA DEMO INTEGRADO (Para probar sin archivos)
// -------------------------------------------------------------
const DEMO_BOOK_PAGES = {
  default: [
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
  ]
};

// -------------------------------------------------------------
// ESTADO GLOBAL DE DATOS (CRUD Y LOCALSTORAGE)
// -------------------------------------------------------------
let books = [];
let nextId = 1;
let selectedBookId = null;
let currentCoverImage = null;
let pendingDocFile = null; // { arrayBuffer, fileName, fileType }
let isComputerOpen = false;
let currentFilter = 'all';
let hasGameStarted = false;
let isPauseOpen = false;
let isTransitioningModal = false;

// Estado del lector
let activeReaderBook = null;
let readerCurrentPage = 1;
let readerTotalPages = 1;
let currentPdfDoc = null;
let currentEpubBook = null;
let currentEpubRendition = null;
let currentEpubChapters = [];
let currentEpubBlobUrls = [];

// Carga inicial desde LocalStorage o creación de datos por defecto
function loadInitialBooks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      books = JSON.parse(saved);
      if (Array.isArray(books) && books.length > 0) {
        const maxId = books.reduce((max, b) => Math.max(max, b.id || 0), 0);
        nextId = maxId + 1;
        // Recuperar progreso individual si existe
        books.forEach(b => {
          const prog = localStorage.getItem(PROGRESS_KEY_PREFIX + b.id);
          if (prog) b.currentPage = parseInt(prog, 10);
        });
        return;
      }
    } catch (e) {
      console.warn('Error al leer de LocalStorage, inicializando demo:', e);
    }
  }

  // Libros por defecto sin presets artificiales
  books = [
    { id: 1, title: 'Don Quijote', author: 'M. de Cervantes', color: '#c4683c', coverImage: null, isRead: false, currentPage: 1, totalPages: 4 },
    { id: 2, title: 'Cien Años de Soledad', author: 'G. García Márquez', color: '#8c5039', coverImage: null, isRead: false, currentPage: 1, totalPages: 4 },
    { id: 3, title: 'El Principito', author: 'A. de Saint-Exupéry', color: '#d98b43', coverImage: null, isRead: true, currentPage: 4, totalPages: 4 },
    { id: 4, title: 'La Odisea', author: 'Homero', color: '#7a3e26', coverImage: null, isRead: false, currentPage: 1, totalPages: 4 }
  ];
  nextId = 5;
  saveBooksToLocalStorage();
}

function saveBooksToLocalStorage() {
  const serializable = books.map(b => ({
    id: b.id,
    title: b.title,
    author: b.author,
    color: b.color,
    coverImage: b.coverImage,
    isRead: !!b.isRead,
    currentPage: b.currentPage || 1,
    totalPages: b.totalPages || 4,
    fileName: b.fileName || null,
    fileType: b.fileType || null
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

// -------------------------------------------------------------
// THREE.JS Y ENTORNOS EN PRIMERA PERSONA
// -------------------------------------------------------------
let scene, camera, renderer, controls;
let clock;
let raycaster, centerMouse;

// Estado de movimiento
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let isSprinting = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Rotación táctil móvil
let touchStartX = 0;
let touchStartY = 0;
let isTouchingScreen = false;
let cameraYaw = 0;
let cameraPitch = 0;

// Objetos interactivos
let computerScreenMesh = null;
let screenCanvas = null;
let screenCtx = null;
let screenTex = null;
const interactableBooks = [];

// Estanterías 3D
let shelfUnreadGroup = null;
let shelfReadGroup = null;

// Elementos DOM
const blocker = document.getElementById('blocker');
const btnStart = document.getElementById('btn-start');
const crosshair = document.getElementById('crosshair');
const interactionPrompt = document.getElementById('interaction-prompt');
const mobileControls = document.getElementById('mobile-controls');
const mobileActionBtn = document.getElementById('mobile-action-btn');

const computerModal = document.getElementById('computer-modal');
const btnCloseOs = document.getElementById('btn-close-os');

const form = document.getElementById('book-form');
const inputTitle = document.getElementById('title');
const inputAuthor = document.getElementById('author');
const inputColor = document.getElementById('color');
const checkIsRead = document.getElementById('book-is-read');
const modeBadge = document.getElementById('mode-badge');
const btnSubmit = document.getElementById('btn-submit');
const btnCancel = document.getElementById('btn-cancel');
const btnDelete = document.getElementById('btn-delete');
const booksScrollList = document.getElementById('books-scroll-list');
const booksCountTitle = document.getElementById('books-count-title');
const mobileTabCount = document.getElementById('mobile-tab-count');

// Archivos y portadas
const docFileInput = document.getElementById('doc-file-input');
const docFileInfo = document.getElementById('doc-file-info');
const coverFileInput = document.getElementById('cover-file-input');
const coverUrlInput = document.getElementById('cover-url-input');
const previewWrapper = document.getElementById('preview-wrapper');
const coverPreview = document.getElementById('cover-preview');
const btnRemoveCover = document.getElementById('btn-remove-cover');
const presetColorButtons = document.querySelectorAll('.preset-btn');
const filterChips = document.querySelectorAll('.filter-chip');

// Pestañas móviles
const tabFormBtn = document.getElementById('tab-form-btn');
const tabListBtn = document.getElementById('tab-list-btn');
const colForm = document.getElementById('col-form');
const colList = document.getElementById('col-list');

// Lector de libros
const readerModal = document.getElementById('reader-modal');
const readerViewport = document.getElementById('reader-viewport');
const readerBookTitle = document.getElementById('reader-book-title');
const readerBookAuthor = document.getElementById('reader-book-author');
const readerCurrentPageInput = document.getElementById('reader-current-page');
const readerTotalPagesSpan = document.getElementById('reader-total-pages');
const readerProgressPercent = document.getElementById('reader-progress-percent');
const btnCloseReader = document.getElementById('btn-close-reader');
const btnMarkAsRead = document.getElementById('btn-mark-as-read');
const btnPrevPage = document.getElementById('btn-prev-page');
const btnNextPage = document.getElementById('btn-next-page');

const pdfContainer = document.getElementById('pdf-container');
const pdfCanvas = document.getElementById('pdf-render-canvas');
const epubContainer = document.getElementById('epub-container');
const textContainer = document.getElementById('text-container');

// Menú de pausa
const pauseMenu = document.getElementById('pause-menu');
const pauseMainView = document.getElementById('pause-main-view');
const pauseControlsView = document.getElementById('pause-controls-view');
const btnPauseContinue = document.getElementById('btn-pause-continue');
const btnPauseControls = document.getElementById('btn-pause-controls');
const btnBackFromControls = document.getElementById('btn-back-from-controls');
const mobilePauseBtn = document.getElementById('mobile-pause-btn');

// -------------------------------------------------------------
// INICIALIZACIÓN
// -------------------------------------------------------------
function init() {
  loadInitialBooks();
  clock = new THREE.Clock();

  // Configurar PDF.js Worker
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
  }

  // Escena con niebla cálida
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1e1814);
  scene.fog = new THREE.FogExp2(0x1e1814, 0.045);

  // Cámara
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 40);
  camera.position.set(0, 1.7, 2.5);
  camera.rotation.order = 'YXZ';

  // Renderizador optimizado
  renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: 'high-performance',
    precision: 'mediump'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(isTouchDevice ? 1.0 : Math.min(window.devicePixelRatio, 1.25));
  renderer.shadowMap.enabled = false;
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  if (!isTouchDevice) {
    controls = new THREE.PointerLockControls(camera, document.body);
    scene.add(controls.getObject());
  }

  raycaster = new THREE.Raycaster();
  centerMouse = new THREE.Vector2(0, 0);

  // Construcción de la sala
  createOptimizedRoom();

  // Estantería 1: Por Leer (Pared trasera: Z = -6.3)
  shelfUnreadGroup = createBookshelfModel('📖 POR LEER', 0, -6.3, 0);

  // Estantería 2: Libros Leídos (Pared izquierda: X = -6.3, Z = 0)
  shelfReadGroup = createBookshelfModel('🏆 LIBROS LEÍDOS', -6.3, 0, Math.PI / 2);

  // Escritorio y PC de gestión
  createDeskAndComputer();

  // Crear mallas 3D de los libros
  books.forEach(b => createBook3DMesh(b));
  repositionBooksOnShelf();

  // Eventos de control y UI
  setupControlsEvents();
  setupCRUDEvents();
  setupMobileTabs();
  setupReaderEvents();

  renderBooksList();

  if (isTouchDevice) {
    document.getElementById('controls-desktop').style.display = 'none';
    document.getElementById('controls-mobile').style.display = 'block';
  }

  animate();
}

// -------------------------------------------------------------
// HABITACIÓN Y MUEBLES
// -------------------------------------------------------------
function createOptimizedRoom() {
  const hemi = new THREE.HemisphereLight(0xfff3e3, 0x6e4a30, 0.85);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xfffaed, 0.7);
  dir.position.set(4, 7, 3);
  scene.add(dir);

  const ceilingLight = new THREE.PointLight(0xffdfb3, 1.1, 15);
  ceilingLight.position.set(0, 3.4, 0);
  scene.add(ceilingLight);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe8c2 })
  );
  bulb.position.copy(ceilingLight.position);
  scene.add(bulb);

  const floorMat = new THREE.MeshStandardMaterial({ color: 0x6e4a30, roughness: 0.7 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const ceilMat = new THREE.MeshBasicMaterial({ color: 0x2e231c });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 3.8;
  scene.add(ceiling);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8dfd2, roughness: 0.85 });

  // Paredes
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.8), wallMat);
  backWall.position.set(0, 1.9, -7);
  scene.add(backWall);

  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.8), wallMat);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, 1.9, 7);
  scene.add(frontWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.8), wallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(7, 1.9, 0);
  scene.add(rightWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.8), wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-7, 1.9, 0);
  scene.add(leftWall);

  const rugMat = new THREE.MeshStandardMaterial({ color: 0x8a4b2c, roughness: 0.95 });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), rugMat);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.01, 0);
  scene.add(rug);
}

// Genera un modelo completo de estantería con placa rotulada y libros decorativos
function createBookshelfModel(labelTitle, posX, posZ, rotY) {
  const group = new THREE.Group();
  group.position.set(posX, 0, posZ);
  group.rotation.y = rotY;

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2c1d, roughness: 0.65 });

  // Fondo
  const back = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.2, 0.1), woodMat);
  back.position.set(0, 1.6, -0.3);
  group.add(back);

  // Laterales
  const leftSide = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 0.7), woodMat);
  leftSide.position.set(-3.3, 1.6, 0);
  group.add(leftSide);

  const rightSide = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 0.7), woodMat);
  rightSide.position.set(3.3, 1.6, 0);
  group.add(rightSide);

  // Baldas
  const shelfYPositions = [0.20, 0.82, 1.45, 2.08, 2.70];
  shelfYPositions.forEach(y => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.06, 0.7), woodMat);
    shelf.position.set(0, y, 0);
    group.add(shelf);
  });

  // Cornisa superior
  const topCrown = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.12, 0.75), woodMat);
  topCrown.position.set(0, 3.2, 0);
  group.add(topCrown);

  // Placa rotulada en madera dorada
  const plaqueCanvas = document.createElement('canvas');
  plaqueCanvas.width = 512;
  plaqueCanvas.height = 128;
  const pCtx = plaqueCanvas.getContext('2d');
  pCtx.fillStyle = '#2b1a10';
  pCtx.fillRect(0, 0, 512, 128);
  pCtx.strokeStyle = '#d4af37';
  pCtx.lineWidth = 6;
  pCtx.strokeRect(10, 10, 492, 108);
  pCtx.fillStyle = '#fff4db';
  pCtx.font = 'bold 36px "Segoe UI", sans-serif';
  pCtx.textAlign = 'center';
  pCtx.fillText(labelTitle, 256, 75);

  const plaqueTex = new THREE.CanvasTexture(plaqueCanvas);
  const plaqueMat = new THREE.MeshBasicMaterial({ map: plaqueTex });
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.55), plaqueMat);
  plaque.position.set(0, 3.2, 0.38);
  group.add(plaque);

  // Libros de fondo secundarios (InstancedMesh)
  createInstancedBackgroundBooks(group);

  scene.add(group);
  return group;
}

function createInstancedBackgroundBooks(group) {
  const totalBooks = 36;
  const bookGeo = new THREE.BoxGeometry(0.065, 0.40, 0.28);
  const bookMat = new THREE.MeshStandardMaterial({ roughness: 0.6 });
  const instancedMesh = new THREE.InstancedMesh(bookGeo, bookMat, totalBooks);

  const dummy = new THREE.Object3D();
  const colors = [
    new THREE.Color(0x5c3826),
    new THREE.Color(0x82442d),
    new THREE.Color(0x2e4134),
    new THREE.Color(0x78563a),
    new THREE.Color(0x364858),
    new THREE.Color(0x8a6240)
  ];

  let idx = 0;
  const shelfYList = [0.85, 2.11];

  shelfYList.forEach(shelfY => {
    let startX = -2.7;
    for (let i = 0; i < 18; i++) {
      if (idx >= totalBooks) break;

      dummy.position.set(startX, shelfY + 0.20, -0.06);
      dummy.rotation.set(0, 0, (i === 4 || i === 12) ? -0.1 : 0);
      dummy.updateMatrix();

      instancedMesh.setMatrixAt(idx, dummy.matrix);
      instancedMesh.setColorAt(idx, colors[idx % colors.length]);

      idx++;
      startX += 0.08;
    }
  });

  instancedMesh.instanceMatrix.needsUpdate = true;
  if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
  group.add(instancedMesh);
}

// Escritorio y PC
function createDeskAndComputer() {
  const deskGroup = new THREE.Group();
  deskGroup.position.set(4.8, 0, 0);

  const deskWoodMat = new THREE.MeshStandardMaterial({ color: 0x3d2518, roughness: 0.5 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 });

  const tabletop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 2.5), deskWoodMat);
  tabletop.position.set(0, 0.85, 0);
  deskGroup.add(tabletop);

  const legGeo = new THREE.BoxGeometry(0.08, 0.85, 0.08);
  [
    [-0.7, 0.425, -1.15],
    [0.7, 0.425, -1.15],
    [-0.7, 0.425, 1.15],
    [0.7, 0.425, 1.15]
  ].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, deskWoodMat);
    leg.position.set(x, y, z);
    deskGroup.add(leg);
  });

  // Monitor
  createMonitor(deskGroup, metalMat);

  // Periféricos
  const keyboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.02, 0.65),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 })
  );
  keyboard.position.set(-0.1, 0.895, 0);
  deskGroup.add(keyboard);

  const mouseMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.025, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.5 })
  );
  mouseMesh.position.set(-0.1, 0.895, 0.45);
  deskGroup.add(mouseMesh);

  const pcTower = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.22), metalMat);
  pcTower.position.set(0.4, 0.275, 1.0);
  deskGroup.add(pcTower);

  const deskLampMat = new THREE.MeshStandardMaterial({ color: 0xc4683c, roughness: 0.3 });
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.03, 12), deskLampMat);
  lampBase.position.set(0.4, 0.89, -0.85);
  deskGroup.add(lampBase);

  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.18, 12), deskLampMat);
  lampShade.position.set(0.2, 1.35, -0.85);
  lampShade.rotation.z = Math.PI / 4;
  deskGroup.add(lampShade);

  const lampLight = new THREE.PointLight(0xffdfb3, 0.8, 4);
  lampLight.position.set(0.1, 1.3, -0.85);
  deskGroup.add(lampLight);

  const chairWood = new THREE.MeshStandardMaterial({ color: 0x2b1c13, roughness: 0.6 });
  const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.65), chairWood);
  chairSeat.position.set(-0.7, 0.48, 0);
  deskGroup.add(chairSeat);

  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.65), chairWood);
  chairBack.position.set(-1.0, 0.8, 0);
  deskGroup.add(chairBack);

  const chairLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.48), metalMat);
  chairLeg.position.set(-0.7, 0.24, 0);
  deskGroup.add(chairLeg);

  scene.add(deskGroup);
}

function createMonitor(deskGroup, metalMat) {
  const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.02, 12), metalMat);
  baseMesh.position.set(0.4, 0.89, 0);
  deskGroup.add(baseMesh);

  const standArm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.06), metalMat);
  standArm.position.set(0.4, 1.05, 0);
  deskGroup.add(standArm);

  const monitorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 1.1), metalMat);
  monitorFrame.position.set(0.4, 1.35, 0);
  deskGroup.add(monitorFrame);

  const w = isTouchDevice ? 512 : 1024;
  const h = isTouchDevice ? 340 : 680;

  screenCanvas = document.createElement('canvas');
  screenCanvas.width = w;
  screenCanvas.height = h;
  screenCtx = screenCanvas.getContext('2d');

  screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.generateMipmaps = true;
  screenTex.minFilter = THREE.LinearMipmapLinearFilter;
  screenTex.magFilter = THREE.LinearFilter;
  if (renderer && renderer.capabilities) {
    screenTex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), isTouchDevice ? 2 : 4);
  }

  updateMonitorScreen();

  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
  computerScreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.67), screenMat);
  computerScreenMesh.rotation.y = -Math.PI / 2;
  computerScreenMesh.position.set(0.365, 1.35, 0);
  computerScreenMesh.userData = { isComputer: true };
  deskGroup.add(computerScreenMesh);
}

function updateMonitorScreen() {
  if (!screenCtx || !screenCanvas) return;
  const w = screenCanvas.width;
  const h = screenCanvas.height;
  const scale = w / 1024;

  screenCtx.fillStyle = '#261b14';
  screenCtx.fillRect(0, 0, w, h);

  screenCtx.fillStyle = '#18100b';
  screenCtx.fillRect(0, 0, w, 44 * scale);

  screenCtx.fillStyle = '#f8ede2';
  screenCtx.font = `bold ${Math.round(18 * scale)}px monospace`;
  screenCtx.fillText('💻 BibliotecaOS v3.5', 20 * scale, 28 * scale);

  const unreadCount = books.filter(b => !b.isRead).length;
  const readCount = books.filter(b => b.isRead).length;

  screenCtx.fillStyle = '#6bc48d';
  screenCtx.font = `600 ${Math.round(15 * scale)}px sans-serif`;
  screenCtx.fillText(`📖 Por Leer: ${unreadCount} | 🏆 Leídos: ${readCount}`, 300 * scale, 28 * scale);

  const winX = 50 * scale, winY = 68 * scale, winW = 924 * scale, winH = 570 * scale;
  screenCtx.fillStyle = '#fffdfa';
  screenCtx.fillRect(winX, winY, winW, winH);

  screenCtx.fillStyle = '#3a2418';
  screenCtx.fillRect(winX, winY, winW, 54 * scale);

  screenCtx.fillStyle = '#fff6ed';
  screenCtx.font = `bold ${Math.round(20 * scale)}px sans-serif`;
  screenCtx.fillText('SISTEMA DE GESTIÓN Y LECTURA', winX + 24 * scale, winY + 35 * scale);

  screenCtx.fillStyle = '#2b1e16';
  screenCtx.font = `800 ${Math.round(28 * scale)}px sans-serif`;
  screenCtx.fillText('Gestor de Estanterías y Lector Local', winX + 40 * scale, winY + 120 * scale);

  screenCtx.fillStyle = '#786254';
  screenCtx.font = `500 ${Math.round(18 * scale)}px sans-serif`;
  screenCtx.fillText('Soporte de lectura en PDF, EPUB y AZW3 con progreso guardado.', winX + 40 * scale, winY + 165 * scale);
  screenCtx.fillText('Sincronizado automáticamente en LocalStorage.', winX + 40 * scale, winY + 195 * scale);

  screenCtx.fillStyle = '#f7ede2';
  screenCtx.strokeStyle = '#e0cebd';
  screenCtx.lineWidth = 2;
  screenCtx.fillRect(winX + 40 * scale, winY + 230 * scale, 840 * scale, 130 * scale);
  screenCtx.strokeRect(winX + 40 * scale, winY + 230 * scale, 840 * scale, 130 * scale);

  screenCtx.fillStyle = '#4a3225';
  screenCtx.font = `700 ${Math.round(20 * scale)}px sans-serif`;
  screenCtx.fillText('Inventario y Estado de Lectura:', winX + 60 * scale, winY + 272 * scale);

  screenCtx.fillStyle = '#c4683c';
  screenCtx.font = `600 ${Math.round(18 * scale)}px monospace`;
  screenCtx.fillText(`▶ Estantería "Por Leer": ${unreadCount} libros`, winX + 60 * scale, winY + 312 * scale);
  screenCtx.fillText(`▶ Estantería "Leídos": ${readCount} libros`, winX + 60 * scale, winY + 338 * scale);

  screenCtx.fillStyle = '#c4683c';
  screenCtx.fillRect(winX + 40 * scale, winY + 410 * scale, 380 * scale, 68 * scale);

  screenCtx.fillStyle = '#ffffff';
  screenCtx.font = `bold ${Math.round(22 * scale)}px sans-serif`;
  screenCtx.fillText(isTouchDevice ? 'TOCA PARA ABRIR GESTOR' : 'ABRIR GESTOR CRUD [E]', winX + 65 * scale, winY + 453 * scale);

  if (screenTex) screenTex.needsUpdate = true;
}

// -------------------------------------------------------------
// TEXTURAS LIMPIAS (SIN PRESETS) Y MODELADO 3D DE LIBROS
// -------------------------------------------------------------
function createSharpTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  if (renderer && renderer.capabilities) {
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), isTouchDevice ? 2 : 4);
  }
  texture.needsUpdate = true;
  return texture;
}

// Textura de lomo limpia
function createSpineTexture(title, author, colorHex) {
  const canvas = document.createElement('canvas');
  canvas.width = isTouchDevice ? 256 : 512;
  canvas.height = isTouchDevice ? 1024 : 2048;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const s = w / 512;

  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, w, h);

  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0.0, 'rgba(0,0,0,0.45)');
  grad.addColorStop(0.18, 'rgba(255,255,255,0.15)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.0)');
  grad.addColorStop(0.82, 'rgba(0,0,0,0.15)');
  grad.addColorStop(1.0, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Filetes dorados sutiles
  ctx.strokeStyle = 'rgba(255, 235, 180, 0.7)';
  ctx.lineWidth = Math.round(8 * s);
  ctx.strokeRect(30 * s, 100 * s, (512 - 60) * s, 1);
  ctx.strokeRect(30 * s, 125 * s, (512 - 60) * s, 1);
  ctx.strokeRect(30 * s, 1800 * s, (512 - 60) * s, 1);
  ctx.strokeRect(30 * s, 1915 * s, (512 - 60) * s, 1);

  ctx.save();
  ctx.translate(w / 2, 1000 * s);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let titleSize = Math.round(62 * s);
  ctx.font = `bold ${titleSize}px "Segoe UI", system-ui, sans-serif`;
  while (ctx.measureText(title).width > 1050 * s && titleSize > 24 * s) {
    titleSize -= 2 * s;
    ctx.font = `bold ${titleSize}px "Segoe UI", system-ui, sans-serif`;
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, 0, 0);
  ctx.restore();

  ctx.save();
  ctx.translate(w / 2, 1680 * s);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${Math.round(42 * s)}px "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255, 248, 235, 0.9)';
  ctx.fillText(author || 'Autor desconocido', 0, 0);
  ctx.restore();

  return createSharpTexture(canvas);
}

// Textura de portada limpia (sin textos predeterminados de "Edición Clásica")
function createDefaultCoverTexture(title, author, colorHex) {
  const canvas = document.createElement('canvas');
  canvas.width = isTouchDevice ? 512 : 1024;
  canvas.height = isTouchDevice ? 720 : 1440;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const s = w / 1024;

  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, w, h);

  const rad = ctx.createRadialGradient(w / 2, h / 2, 100 * s, w / 2, h / 2, 800 * s);
  rad.addColorStop(0, 'rgba(255,255,255,0.12)');
  rad.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255, 235, 180, 0.6)';
  ctx.lineWidth = Math.round(14 * s);
  ctx.strokeRect(50 * s, 50 * s, (1024 - 100) * s, (1440 - 100) * s);
  ctx.lineWidth = Math.round(4 * s);
  ctx.strokeRect(76 * s, 76 * s, (1024 - 152) * s, (1440 - 152) * s);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const words = title.split(' ');
  let lines = [];
  let current = '';
  ctx.font = `bold ${Math.round(66 * s)}px "Segoe UI", system-ui, sans-serif`;
  for (let word of words) {
    let test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > 800 * s && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  const startY = (560 - (lines.length * 85) / 2 + 42) * s;
  lines.forEach((l, i) => ctx.fillText(l, w / 2, startY + i * 85 * s));

  ctx.fillStyle = 'rgba(255, 245, 230, 0.9)';
  ctx.font = `500 ${Math.round(44 * s)}px "Segoe UI", system-ui, sans-serif`;
  ctx.fillText(author || 'Autor desconocido', w / 2, 920 * s);

  return createSharpTexture(canvas);
}

// Crea la malla 3D de un libro
function createBook3DMesh(bookData) {
  const width = 0.08;
  const height = 0.44;
  const depth = 0.32;

  const spineTex = createSpineTexture(bookData.title, bookData.author, bookData.color);
  const pagesMat = new THREE.MeshStandardMaterial({ color: 0xf6f0e4, roughness: 0.9 });
  const spineMat = new THREE.MeshStandardMaterial({ map: spineTex, roughness: 0.45, metalness: 0.05 });
  const backCoverMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(bookData.color), roughness: 0.5 });
  const frontMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.05 });

  if (bookData.coverImage) {
    applyCoverImageToMaterial(frontMat, bookData.coverImage);
  } else {
    frontMat.map = createDefaultCoverTexture(bookData.title, bookData.author, bookData.color);
  }

  const materials = [frontMat, backCoverMat, pagesMat, pagesMat, spineMat, pagesMat];
  const geo = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geo, materials);
  mesh.userData = { id: bookData.id, isBook: true, title: bookData.title, author: bookData.author, isRead: !!bookData.isRead };

  scene.add(mesh);
  bookData.mesh = mesh;
  interactableBooks.push(mesh);
  return mesh;
}

function applyCoverImageToMaterial(material, imageSource) {
  const loader = new THREE.TextureLoader();
  loader.load(
    imageSource,
    (tex) => {
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      if (renderer && renderer.capabilities) {
        tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), isTouchDevice ? 2 : 4);
      }
      tex.needsUpdate = true;
      material.map = tex;
      material.needsUpdate = true;
    },
    undefined,
    (err) => console.warn('Error al cargar portada:', err)
  );
}

function updateBookMesh(bookData) {
  if (!bookData.mesh) return;

  bookData.mesh.userData.title = bookData.title;
  bookData.mesh.userData.author = bookData.author;
  bookData.mesh.userData.isRead = !!bookData.isRead;

  if (bookData.mesh.material[4].map) bookData.mesh.material[4].map.dispose();
  bookData.mesh.material[4].map = createSpineTexture(bookData.title, bookData.author, bookData.color);
  bookData.mesh.material[4].needsUpdate = true;

  bookData.mesh.material[1].color.set(bookData.color);

  if (bookData.mesh.material[0].map) bookData.mesh.material[0].map.dispose();
  if (bookData.coverImage) {
    applyCoverImageToMaterial(bookData.mesh.material[0], bookData.coverImage);
  } else {
    bookData.mesh.material[0].map = createDefaultCoverTexture(bookData.title, bookData.author, bookData.color);
    bookData.mesh.material[0].needsUpdate = true;
  }
}

// -------------------------------------------------------------
// DISTRIBUCIÓN DE LIBROS ENTRE LAS DOS ESTANTERÍAS (POR LEER / LEÍDOS)
// -------------------------------------------------------------
function repositionBooksOnShelf() {
  const unreadBooks = books.filter(b => !b.isRead);
  const readBooks = books.filter(b => b.isRead);

  const spacing = 0.11;
  const shelfY = 1.70;

  // 1. Estantería de "Por Leer" (Pared trasera: Z = -6.29, orientada a +Z)
  const unreadCount = unreadBooks.length;
  const startXUnread = -((unreadCount - 1) * spacing) / 2;

  unreadBooks.forEach((book, idx) => {
    if (!book.mesh) return;
    const targetX = startXUnread + idx * spacing;
    const targetZ = -6.29;

    book.mesh.userData.targetPosition = new THREE.Vector3(targetX, shelfY, targetZ);
    book.mesh.userData.targetRotation = new THREE.Euler(0, 0, 0);

    if (!book.mesh.position.y || book.mesh.position.y === 0) {
      book.mesh.position.set(targetX, shelfY, targetZ);
      book.mesh.rotation.set(0, 0, 0);
    }
  });

  // 2. Estantería de "Libros Leídos" (Pared izquierda: X = -6.29, orientada a +X)
  const readCount = readBooks.length;
  const startZRead = -((readCount - 1) * spacing) / 2;

  readBooks.forEach((book, idx) => {
    if (!book.mesh) return;
    const targetX = -6.29;
    const targetZ = startZRead + idx * spacing;

    book.mesh.userData.targetPosition = new THREE.Vector3(targetX, shelfY, targetZ);
    // Girado 90 grados para alinearse con la estantería izquierda
    book.mesh.userData.targetRotation = new THREE.Euler(0, Math.PI / 2, 0);

    if (!book.mesh.position.y || book.mesh.position.y === 0) {
      book.mesh.position.set(targetX, shelfY, targetZ);
      book.mesh.rotation.set(0, Math.PI / 2, 0);
    }
  });
}

// -------------------------------------------------------------
// EVENTOS DE CONTROL (DESKTOP Y MÓVIL)
// -------------------------------------------------------------
function setupControlsEvents() {
  btnStart.addEventListener('click', () => {
    hasGameStarted = true;
    blocker.style.display = 'none';

    if (!isTouchDevice && controls) {
      controls.lock();
    } else {
      mobileControls.style.display = 'block';
    }
  });

  if (controls) {
    controls.addEventListener('lock', () => {
      hasGameStarted = true;
      blocker.style.display = 'none';
      pauseMenu.style.display = 'none';
      isPauseOpen = false;
      crosshair.style.display = 'block';
    });

    controls.addEventListener('unlock', () => {
      isSprinting = false;
      moveForward = false;
      moveBackward = false;
      moveLeft = false;
      moveRight = false;
      crosshair.style.display = 'none';
      interactionPrompt.style.display = 'none';

      // Si se desbloqueó porque se abrió o cerró un modal (ordenador o lector), NO mostrar menú de pausa
      if (isComputerOpen || activeReaderBook || isTransitioningModal) {
        return;
      }

      // Si el juego ya había empezado, abrir menú de pausa
      if (hasGameStarted) {
        openPauseMenu();
      } else {
        blocker.style.display = 'flex';
      }
    });
  }

  // Eventos de botones del Menú de Pausa
  btnPauseContinue.addEventListener('click', closePauseMenu);
  btnPauseControls.addEventListener('click', () => {
    pauseMainView.style.display = 'none';
    pauseControlsView.style.display = 'block';
  });
  btnBackFromControls.addEventListener('click', () => {
    pauseControlsView.style.display = 'none';
    pauseMainView.style.display = 'block';
  });

  if (mobilePauseBtn) {
    mobilePauseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openPauseMenu();
    });
  }

  // Teclado
  document.addEventListener('keydown', (e) => {
    // 1. Si el lector de libros está abierto
    if (activeReaderBook) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeBookReader();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        nextReaderPage();
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevReaderPage();
        return;
      }
      return;
    }

    // 2. Si el ordenador OS está abierto
    if (isComputerOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeComputerOS();
        return;
      }
      return;
    }

    // 3. Si el menú de pausa está abierto
    if (isPauseOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePauseMenu();
        return;
      }
      return;
    }

    // Ignorar si está escribiendo en campos de formulario
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return;
    }

    // Si está en el HUB y pulsa ESC
    if (e.key === 'Escape') {
      if (hasGameStarted && !isPauseOpen) {
        e.preventDefault();
        openPauseMenu();
      }
      return;
    }

    // Tecla Shift para aumentar la velocidad (Sprint / Correr)
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      isSprinting = true;
      return;
    }

    switch (e.code) {
      case 'KeyW': case 'ArrowUp': moveForward = true; break;
      case 'KeyS': case 'ArrowDown': moveBackward = true; break;
      case 'KeyA': case 'ArrowLeft': moveLeft = true; break;
      case 'KeyD': case 'ArrowRight': moveRight = true; break;
      case 'KeyE': handleInteraction(); break;
    }
  });

  document.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': moveForward = false; break;
      case 'KeyS': case 'ArrowDown': moveBackward = false; break;
      case 'KeyA': case 'ArrowLeft': moveLeft = false; break;
      case 'KeyD': case 'ArrowRight': moveRight = false; break;
      case 'ShiftLeft': case 'ShiftRight': isSprinting = false; break;
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (controls && controls.isLocked && !isComputerOpen && !activeReaderBook && !isPauseOpen) {
      handleInteraction();
    } else if (controls && !controls.isLocked && hasGameStarted && !isComputerOpen && !activeReaderBook && !isPauseOpen && blocker.style.display === 'none') {
      if (e.target === renderer.domElement) {
        try { controls.lock(); } catch (err) {}
      }
    }
  });

  // D-Pad móvil
  const setupDpad = (id, onStart, onEnd) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const startHandler = (e) => { e.preventDefault(); onStart(); };
    const endHandler = (e) => { e.preventDefault(); onEnd(); };
    btn.addEventListener('touchstart', startHandler, { passive: false });
    btn.addEventListener('touchend', endHandler, { passive: false });
    btn.addEventListener('touchcancel', endHandler, { passive: false });
    btn.addEventListener('mousedown', startHandler);
    btn.addEventListener('mouseup', endHandler);
  };

  setupDpad('btn-up', () => moveForward = true, () => moveForward = false);
  setupDpad('btn-down', () => moveBackward = true, () => moveBackward = false);
  setupDpad('btn-left', () => moveLeft = true, () => moveLeft = false);
  setupDpad('btn-right', () => moveRight = true, () => moveRight = false);

  mobileActionBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handleInteraction();
  });

  // Giro de cámara táctil
  const canvas = renderer.domElement;
  canvas.addEventListener('touchstart', (e) => {
    if (isComputerOpen || activeReaderBook) return;
    if (e.touches.length === 1) {
      isTouchingScreen = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (!isTouchingScreen || isComputerOpen || activeReaderBook || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - touchStartX;
    const deltaY = e.touches[0].clientY - touchStartY;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;

    const sens = 0.0035;
    cameraYaw -= deltaX * sens;
    cameraPitch = Math.max(-1.3, Math.min(1.3, cameraPitch - deltaY * sens));
    camera.quaternion.setFromEuler(new THREE.Euler(cameraPitch, cameraYaw, 0, 'YXZ'));
  }, { passive: true });

  canvas.addEventListener('touchend', () => isTouchingScreen = false, { passive: true });
  canvas.addEventListener('touchcancel', () => isTouchingScreen = false, { passive: true });

  window.addEventListener('resize', onWindowResize);
}

// -------------------------------------------------------------
// MENÚ DE PAUSA
// -------------------------------------------------------------
function openPauseMenu() {
  if (isComputerOpen || activeReaderBook || isTransitioningModal) return;
  isPauseOpen = true;
  isSprinting = false;
  moveForward = moveBackward = moveLeft = moveRight = false;

  if (controls && controls.isLocked) {
    controls.unlock();
  }

  // Vista inicial en menú de pausa principal
  pauseMainView.style.display = 'block';
  pauseControlsView.style.display = 'none';

  pauseMenu.style.display = 'flex';
  crosshair.style.display = 'none';
  interactionPrompt.style.display = 'none';
}

function closePauseMenu() {
  isPauseOpen = false;
  pauseMenu.style.display = 'none';

  if (!isTouchDevice && controls) {
    try {
      controls.lock();
    } catch (e) {}
  } else {
    mobileControls.style.display = 'block';
  }
}

// -------------------------------------------------------------
// INTERACCIÓN Y RAYCASTING
// -------------------------------------------------------------
function handleInteraction() {
  raycaster.setFromCamera(centerMouse, camera);
  const targets = [computerScreenMesh, ...interactableBooks].filter(Boolean);
  const intersects = raycaster.intersectObjects(targets);

  if (intersects.length > 0) {
    const hit = intersects[0];
    if (hit.distance < 4.5) {
      if (hit.object.userData.isComputer) {
        openComputerOS();
      } else if (hit.object.userData.isBook) {
        // Abrir lector del libro al apuntarlo
        openBookReader(hit.object.userData.id);
      }
    }
  }
}

// -------------------------------------------------------------
// GESTIÓN DEL ORDENADOR (CRUD)
// -------------------------------------------------------------
function openComputerOS() {
  isComputerOpen = true;
  isSprinting = false;
  moveForward = moveBackward = moveLeft = moveRight = false;
  if (controls && controls.isLocked) controls.unlock();
  mobileControls.style.display = 'none';
  computerModal.style.display = 'flex';
  renderBooksList();
}

function closeComputerOS() {
  isComputerOpen = false;
  computerModal.style.display = 'none';

  isTransitioningModal = true;
  if (!isTouchDevice) {
    crosshair.style.display = 'block';
    if (controls) {
      try { controls.lock(); } catch (err) {}
    }
  } else {
    mobileControls.style.display = 'block';
  }
  setTimeout(() => { isTransitioningModal = false; }, 350);
}

btnCloseOs.addEventListener('click', closeComputerOS);

function setupMobileTabs() {
  tabFormBtn.addEventListener('click', () => {
    tabFormBtn.classList.add('active');
    tabListBtn.classList.remove('active');
    colForm.classList.remove('mobile-hidden');
    colList.classList.add('mobile-hidden');
  });

  tabListBtn.addEventListener('click', () => {
    tabListBtn.classList.add('active');
    tabFormBtn.classList.remove('active');
    colList.classList.remove('mobile-hidden');
    colForm.classList.add('mobile-hidden');
  });
}

function setupCRUDEvents() {
  // Manejo de archivo de lectura (PDF / EPUB / AZW3)
  docFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        pendingDocFile = {
          arrayBuffer: evt.target.result,
          fileName: file.name,
          fileType: file.type || file.name.split('.').pop()
        };
        docFileInfo.innerHTML = `<span style="color:#2a9d8f; font-weight:700;">✓ Archivo cargado: ${file.name}</span>`;
      };
      reader.readAsArrayBuffer(file);
    }
  });

  // Portada imagen personalizada
  coverFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        currentCoverImage = event.target.result;
        updateCoverPreview(currentCoverImage);
      };
      reader.readAsDataURL(file);
    }
  });

  coverUrlInput.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url) {
      currentCoverImage = url;
      updateCoverPreview(url);
    }
  });

  btnRemoveCover.addEventListener('click', () => {
    currentCoverImage = null;
    coverFileInput.value = '';
    coverUrlInput.value = '';
    updateCoverPreview(null);
  });

  presetColorButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      inputColor.value = btn.dataset.color;
    });
  });

  // Filtros de estantería en la lista
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      renderBooksList();
    });
  });

  // Submit del formulario (Crear o Actualizar)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = inputTitle.value.trim();
    const author = inputAuthor.value.trim();
    const color = inputColor.value;
    const isRead = checkIsRead.checked;

    if (!title) return;

    if (selectedBookId !== null) {
      // Actualización
      const book = books.find(b => b.id === selectedBookId);
      if (book) {
        book.title = title;
        book.author = author;
        book.color = color;
        book.coverImage = currentCoverImage;
        book.isRead = isRead;

        if (pendingDocFile) {
          book.fileName = pendingDocFile.fileName;
          book.fileType = pendingDocFile.fileType;
          await saveBookFileToDB(book.id, pendingDocFile.arrayBuffer, pendingDocFile.fileName, pendingDocFile.fileType);
          pendingDocFile = null;
        }

        updateBookMesh(book);
      }
    } else {
      // Creación
      const newBook = {
        id: nextId++,
        title,
        author,
        color,
        coverImage: currentCoverImage,
        isRead: isRead,
        currentPage: 1,
        totalPages: 4,
        fileName: pendingDocFile ? pendingDocFile.fileName : null,
        fileType: pendingDocFile ? pendingDocFile.fileType : null
      };

      if (pendingDocFile) {
        await saveBookFileToDB(newBook.id, pendingDocFile.arrayBuffer, pendingDocFile.fileName, pendingDocFile.fileType);
        pendingDocFile = null;
      }

      books.push(newBook);
      createBook3DMesh(newBook);
    }

    saveBooksToLocalStorage();
    repositionBooksOnShelf();
    resetCRUDForm();
    renderBooksList();
    updateMonitorScreen();

    if (window.innerWidth <= 768) {
      tabListBtn.click();
    }
  });

  btnCancel.addEventListener('click', resetCRUDForm);

  btnDelete.addEventListener('click', async () => {
    if (selectedBookId !== null) {
      await deleteBook(selectedBookId);
      resetCRUDForm();
      renderBooksList();
    }
  });
}

function updateCoverPreview(imageSource) {
  if (imageSource) {
    coverPreview.style.backgroundImage = `url("${imageSource}")`;
    previewWrapper.style.display = 'flex';
  } else {
    coverPreview.style.backgroundImage = 'none';
    previewWrapper.style.display = 'none';
  }
}

function editBook(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;

  selectedBookId = id;
  inputTitle.value = book.title;
  inputAuthor.value = book.author;
  inputColor.value = book.color;
  checkIsRead.checked = !!book.isRead;
  currentCoverImage = book.coverImage || null;
  updateCoverPreview(currentCoverImage);

  if (book.fileName) {
    docFileInfo.innerHTML = `<span style="color:#2a9d8f; font-weight:700;">✓ Documento vinculado: ${book.fileName}</span>`;
  } else {
    docFileInfo.innerHTML = `<span>Sin archivo adjunto (usa texto de muestra)</span>`;
  }

  modeBadge.textContent = `Editando ID: ${book.id}`;
  modeBadge.classList.add('editing');

  btnSubmit.textContent = 'Guardar Cambios';
  btnCancel.style.display = 'block';
  btnDelete.style.display = 'block';

  renderBooksList();

  if (window.innerWidth <= 768) {
    tabFormBtn.click();
  }
}

async function deleteBook(id) {
  const index = books.findIndex(b => b.id === id);
  if (index === -1) return;

  const [removed] = books.splice(index, 1);
  if (removed && removed.mesh) {
    scene.remove(removed.mesh);
    const hitIdx = interactableBooks.indexOf(removed.mesh);
    if (hitIdx !== -1) interactableBooks.splice(hitIdx, 1);

    removed.mesh.geometry.dispose();
    removed.mesh.material.forEach(m => {
      if (m.map) m.map.dispose();
      m.dispose();
    });
  }

  await deleteBookFileFromDB(id);
  localStorage.removeItem(PROGRESS_KEY_PREFIX + id);
  saveBooksToLocalStorage();

  repositionBooksOnShelf();
  updateMonitorScreen();
}

function resetCRUDForm() {
  selectedBookId = null;
  form.reset();
  inputColor.value = '#c4683c';
  checkIsRead.checked = false;
  currentCoverImage = null;
  pendingDocFile = null;
  updateCoverPreview(null);
  docFileInfo.innerHTML = `<span>Sin archivo adjunto (incluye texto de lectura demo)</span>`;

  modeBadge.textContent = 'Nuevo Libro';
  modeBadge.classList.remove('editing');

  btnSubmit.textContent = 'Añadir a la biblioteca';
  btnCancel.style.display = 'none';
  btnDelete.style.display = 'none';

  renderBooksList();
}

function renderBooksList() {
  let filtered = books;
  if (currentFilter === 'unread') filtered = books.filter(b => !b.isRead);
  if (currentFilter === 'read') filtered = books.filter(b => b.isRead);

  booksCountTitle.textContent = `Libros (${filtered.length} de ${books.length})`;
  mobileTabCount.textContent = books.length;
  booksScrollList.innerHTML = '';

  if (filtered.length === 0) {
    booksScrollList.innerHTML = '<p style="color: #8c786a; font-size: 0.85rem; padding: 14px;">No hay libros en esta sección.</p>';
    return;
  }

  filtered.forEach(b => {
    const card = document.createElement('div');
    card.className = `book-card-item ${b.id === selectedBookId ? 'selected' : ''}`;

    const thumbStyle = b.coverImage ? `background-image: url("${b.coverImage}");` : `background-color: ${b.color};`;
    const curP = b.currentPage || 1;
    const totP = b.totalPages || 4;
    const pct = Math.round((curP / totP) * 100);

    card.innerHTML = `
      <div class="book-card-spine" style="background-color: ${b.color};"></div>
      <div class="book-card-thumb" style="${thumbStyle}"></div>
      <div class="book-card-info">
        <div class="book-card-title">${b.title}</div>
        <div class="book-card-author">${b.author || 'Sin autor'}</div>
        <div class="book-card-progress">
          <span class="progress-pill ${b.isRead ? 'done' : ''}">${b.isRead ? '🏆 Leído' : `Pág ${curP}/${totP} (${pct}%)`}</span>
          ${b.fileName ? '<span style="font-size:0.7rem; color:#2a9d8f;">📄 ' + b.fileName.substring(0, 15) + '</span>' : ''}
        </div>
      </div>
      <div class="book-card-actions">
        <button type="button" class="btn-card-action btn-card-read" data-id="${b.id}" title="Abrir lector">📖 Leer</button>
        <button type="button" class="btn-card-action btn-card-edit" data-id="${b.id}" title="Editar datos">✎</button>
        <button type="button" class="btn-card-action btn-card-delete" data-id="${b.id}" title="Eliminar">✕</button>
      </div>
    `;

    card.querySelector('.btn-card-read').addEventListener('click', (e) => {
      e.stopPropagation();
      openBookReader(b.id);
    });

    card.querySelector('.btn-card-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      editBook(b.id);
    });

    card.querySelector('.btn-card-delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      await deleteBook(b.id);
      if (selectedBookId === b.id) resetCRUDForm();
      renderBooksList();
    });

    card.addEventListener('click', () => editBook(b.id));

    booksScrollList.appendChild(card);
  });
}

// -------------------------------------------------------------
// LECTOR INTEGRADO (PDF / EPUB / AZW3 / TEXTO DEMO)
// -------------------------------------------------------------
async function openBookReader(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;

  activeReaderBook = book;
  isSprinting = false;
  moveForward = moveBackward = moveLeft = moveRight = false;
  if (controls && controls.isLocked) controls.unlock();
  mobileControls.style.display = 'none';
  if (isComputerOpen) computerModal.style.display = 'none';

  readerModal.style.display = 'flex';
  readerBookTitle.textContent = book.title;
  readerBookAuthor.textContent = book.author || 'Autor desconocido';

  // Recuperar última página leída desde LocalStorage
  const savedPage = localStorage.getItem(PROGRESS_KEY_PREFIX + book.id);
  readerCurrentPage = savedPage ? parseInt(savedPage, 10) : (book.currentPage || 1);

  btnMarkAsRead.textContent = book.isRead ? '✓ Ya está en Leídos' : '🏆 Marcar como Leído';
  btnMarkAsRead.style.opacity = book.isRead ? '0.6' : '1.0';

  // Comprobar si hay archivo en IndexedDB
  const storedFile = await getBookFileFromDB(book.id);

  if (storedFile && storedFile.data) {
    const ext = (storedFile.fileName || '').toLowerCase();

    if (ext.endsWith('.pdf') && window.pdfjsLib) {
      loadPdfDocument(storedFile.data);
    } else if ((ext.endsWith('.epub') || ext.endsWith('.azw3')) && window.JSZip) {
      await loadEpubDocument(storedFile.data);
    } else if (window.JSZip) {
      try {
        await loadEpubDocument(storedFile.data);
      } catch (e) {
        loadTextDemoDocument(book);
      }
    } else {
      // Fallback a texto
      loadTextDemoDocument(book);
    }
  } else {
    // Si no subió archivo aún, carga páginas demo ricas y navegables
    loadTextDemoDocument(book);
  }
}

function closeBookReader() {
  activeReaderBook = null;
  readerModal.style.display = 'none';

  if (currentPdfDoc) currentPdfDoc = null;
  currentEpubChapters = [];
  if (currentEpubBlobUrls && currentEpubBlobUrls.length > 0) {
    currentEpubBlobUrls.forEach(url => URL.revokeObjectURL(url));
    currentEpubBlobUrls = [];
  }
  if (currentEpubRendition) {
    try { currentEpubRendition.destroy(); } catch(e) {}
    currentEpubRendition = null;
  }

  isTransitioningModal = true;
  if (isComputerOpen) {
    computerModal.style.display = 'flex';
  } else if (!isTouchDevice) {
    crosshair.style.display = 'block';
    if (controls) {
      try { controls.lock(); } catch (err) {}
    }
  } else {
    mobileControls.style.display = 'block';
  }
  setTimeout(() => { isTransitioningModal = false; }, 350);
}

function setupReaderEvents() {
  btnCloseReader.addEventListener('click', closeBookReader);

  btnPrevPage.addEventListener('click', prevReaderPage);
  btnNextPage.addEventListener('click', nextReaderPage);

  readerCurrentPageInput.addEventListener('change', () => {
    const target = parseInt(readerCurrentPageInput.value, 10);
    if (!isNaN(target) && target >= 1 && target <= readerTotalPages) {
      goToReaderPage(target);
    } else {
      readerCurrentPageInput.value = readerCurrentPage;
    }
  });

  // Marcar como leído y mover a la estantería de leídos
  btnMarkAsRead.addEventListener('click', () => {
    if (!activeReaderBook) return;
    markBookAsRead(activeReaderBook.id);
  });
}

function markBookAsRead(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;

  book.isRead = true;
  book.currentPage = book.totalPages || readerTotalPages;
  saveBooksToLocalStorage();
  localStorage.setItem(PROGRESS_KEY_PREFIX + book.id, book.currentPage);

  updateBookMesh(book);
  repositionBooksOnShelf();
  updateMonitorScreen();
  renderBooksList();

  btnMarkAsRead.textContent = '✓ Ya está en Leídos';
  btnMarkAsRead.style.opacity = '0.6';

  alert(`🎉 ¡Felicidades! "${book.title}" ha sido añadido a la estantería de Libros Leídos.`);
}

function updateReaderPaginationUI() {
  readerCurrentPageInput.value = readerCurrentPage;
  readerTotalPagesSpan.textContent = readerTotalPages;
  const pct = Math.round((readerCurrentPage / readerTotalPages) * 100);
  readerProgressPercent.textContent = `${pct}%`;

  btnPrevPage.disabled = (readerCurrentPage <= 1);
  btnNextPage.disabled = (readerCurrentPage >= readerTotalPages);

  // Guardar en LocalStorage cada vez que se pasa de página
  if (activeReaderBook) {
    activeReaderBook.currentPage = readerCurrentPage;
    activeReaderBook.totalPages = readerTotalPages;
    localStorage.setItem(PROGRESS_KEY_PREFIX + activeReaderBook.id, readerCurrentPage);
    saveBooksToLocalStorage();
    renderBooksList();

    // Si llega al final del libro, ofrecer mover a la estantería de leídos
    if (readerCurrentPage === readerTotalPages && !activeReaderBook.isRead) {
      setTimeout(() => {
        if (confirm(`🎉 ¡Has llegado a la última página de "${activeReaderBook.title}"! ¿Deseas colocarlo en la estantería de Libros Leídos?`)) {
          markBookAsRead(activeReaderBook.id);
        }
      }, 400);
    }
  }
}

// -------------------------------------------------------------
// VISORES DE DOCUMENTO (PDF / EPUB / TEXTO)
// -------------------------------------------------------------

// 1. Visor PDF con PDF.js
async function loadPdfDocument(arrayBuffer) {
  pdfContainer.style.display = 'flex';
  epubContainer.style.display = 'none';
  textContainer.style.display = 'none';

  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    currentPdfDoc = await loadingTask.promise;
    readerTotalPages = currentPdfDoc.numPages;

    if (readerCurrentPage > readerTotalPages) readerCurrentPage = 1;
    renderPdfPage(readerCurrentPage);
  } catch (err) {
    console.warn('Error abriendo PDF:', err);
    loadTextDemoDocument(activeReaderBook);
  }
}

async function renderPdfPage(pageNum) {
  if (!currentPdfDoc) return;
  try {
    const page = await currentPdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: isTouchDevice ? 1.0 : 1.5 });

    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;

    const ctx = pdfCanvas.getContext('2d');
    const renderContext = { canvasContext: ctx, viewport: viewport };
    await page.render(renderContext).promise;

    updateReaderPaginationUI();
  } catch (err) {
    console.warn('Error al renderizar página PDF:', err);
  }
}

// 2. Visor EPUB y AZW3 con parser nativo JSZip de alta fidelidad
async function loadEpubDocument(arrayBuffer) {
  pdfContainer.style.display = 'none';
  epubContainer.style.display = 'none';
  textContainer.style.display = 'block';
  textContainer.innerHTML = `
    <div style="text-align:center; padding: 60px 20px;">
      <div style="font-size: 2.4rem; margin-bottom: 14px;">📖</div>
      <h3 style="font-size:1.3rem; font-weight:800; color:#4a2e1f; margin-bottom: 8px;">Abriendo libro digital...</h3>
      <p style="color:#7d685c; font-size:0.95rem;">Extrayendo capítulos, estructura e ilustraciones para lectura óptima...</p>
    </div>
  `;

  try {
    currentEpubChapters = await parseEpubWithJSZip(arrayBuffer);

    if (currentEpubChapters && currentEpubChapters.length > 0) {
      readerTotalPages = currentEpubChapters.length;
      if (readerCurrentPage > readerTotalPages || readerCurrentPage < 1) {
        readerCurrentPage = 1;
      }
      renderEpubChapter(readerCurrentPage);
    } else {
      console.warn('No se encontraron capítulos legibles en el EPUB.');
      tryFallbackEpub(arrayBuffer);
    }
  } catch (err) {
    console.warn('Error al procesar EPUB con JSZip:', err);
    tryFallbackEpub(arrayBuffer, err);
  }
}

// Parser de EPUB basado en estándares OPF / Spine con JSZip
async function parseEpubWithJSZip(arrayBuffer) {
  if (currentEpubBlobUrls && currentEpubBlobUrls.length > 0) {
    currentEpubBlobUrls.forEach(url => URL.revokeObjectURL(url));
    currentEpubBlobUrls = [];
  }

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
    return [];
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
        currentEpubBlobUrls.push(blobUrl);

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

  return chapters;
}

// Resolver rutas relativas dentro del ZIP
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

// Manejador de fallback si el archivo no es un EPUB estándar o es un MOBI/AZW3 propietario
function tryFallbackEpub(arrayBuffer, initialError) {
  try {
    const bytes = new Uint8Array(arrayBuffer.slice(0, 64));
    let headerStr = '';
    for (let i = 0; i < bytes.length; i++) headerStr += String.fromCharCode(bytes[i]);

    if (headerStr.includes('BOOKMOBI') || headerStr.includes('TEXtREAd')) {
      textContainer.innerHTML = `
        <div style="text-align:center; padding: 40px 24px;">
          <h3 style="color:#c4683c; font-size:1.3rem;">📖 Formato Kindle AZW3/MOBI Detectado</h3>
          <p style="color:#4a3224; margin:16px 0; line-height:1.7;">
            Este archivo utiliza el formato binario propietario de Amazon Kindle.
          </p>
          <div style="background:#f3e8db; padding:16px; border-radius:8px; display:inline-block; max-width:540px; text-align:left; font-size:0.92rem; color:#5c4231;">
            💡 <strong>Consejo para una lectura óptima:</strong><br>
            Puedes convertir tu archivo AZW3 a formato <strong>EPUB</strong> o <strong>PDF</strong> de manera instantánea y gratuita con Calibre o herramientas online, y luego subirlo aquí para disfrutar de todos sus capítulos e imágenes sin restricciones.
          </div>
        </div>
      `;
      readerTotalPages = 1;
      updateReaderPaginationUI();
      return;
    }
  } catch (e) {}

  loadTextDemoDocument(activeReaderBook);
}

// Renderizar un capítulo EPUB en el visor
function renderEpubChapter(chapNum) {
  if (!currentEpubChapters || currentEpubChapters.length === 0) {
    loadTextDemoDocument(activeReaderBook);
    return;
  }

  const idx = Math.max(0, Math.min(chapNum - 1, currentEpubChapters.length - 1));
  const chapter = currentEpubChapters[idx];

  textContainer.innerHTML = `
    <div class="epub-chapter-view">
      <div class="epub-chapter-meta">
        <span class="chapter-badge">Capítulo ${idx + 1} de ${currentEpubChapters.length}</span>
        <h3 class="chapter-heading">${chapter.title}</h3>
      </div>
      <div class="epub-body-text">
        ${chapter.html}
      </div>
    </div>
  `;

  if (readerViewport) {
    readerViewport.scrollTop = 0;
  }
  updateReaderPaginationUI();
}

// 3. Visor de Texto Demo (con capítulos paginados)
function loadTextDemoDocument(book) {
  pdfContainer.style.display = 'none';
  epubContainer.style.display = 'none';
  textContainer.style.display = 'block';

  const pages = DEMO_BOOK_PAGES.default;
  readerTotalPages = pages.length;

  if (readerCurrentPage > readerTotalPages) readerCurrentPage = 1;
  renderTextPage(readerCurrentPage);
}

function renderTextPage(pageNum) {
  const pages = DEMO_BOOK_PAGES.default;
  const p = pages[pageNum - 1] || pages[0];

  textContainer.innerHTML = `
    <h3>${activeReaderBook ? activeReaderBook.title : 'Lectura'} — ${p.chapter}</h3>
    <p>${p.content}</p>
    <p style="font-size:0.9rem; color:#7d685c; margin-top:30px; font-style:italic;">
      Nota: Puedes adjuntar cualquier archivo <strong>.PDF, .EPUB o .AZW3</strong> desde el ordenador de la habitación para leer tus libros reales en este lector con progreso guardado en LocalStorage.
    </p>
  `;

  if (readerViewport) {
    readerViewport.scrollTop = 0;
  }
  updateReaderPaginationUI();
}

function prevReaderPage() {
  if (readerCurrentPage > 1) {
    goToReaderPage(readerCurrentPage - 1);
  }
}

function nextReaderPage() {
  if (readerCurrentPage < readerTotalPages) {
    goToReaderPage(readerCurrentPage + 1);
  }
}

function goToReaderPage(pageNum) {
  readerCurrentPage = pageNum;

  if (currentPdfDoc) {
    renderPdfPage(readerCurrentPage);
  } else if (currentEpubChapters && currentEpubChapters.length > 0) {
    renderEpubChapter(readerCurrentPage);
  } else if (currentEpubRendition) {
    try { currentEpubRendition.display(pageNum); } catch(e) {}
    updateReaderPaginationUI();
  } else {
    renderTextPage(readerCurrentPage);
  }

  if (readerViewport) {
    readerViewport.scrollTop = 0;
  }
}

// -------------------------------------------------------------
// BUCLE DE RENDERIZADO Y FÍSICAS DE MOVIMIENTO
// -------------------------------------------------------------
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(isTouchDevice ? 1.0 : Math.min(window.devicePixelRatio, 1.25));
}

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);
  const canMove = (!controls || controls.isLocked) || (isTouchDevice && !isComputerOpen && !activeReaderBook && blocker.style.display === 'none');

  if (canMove) {
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    const baseSpeed = 20.0;
    const currentSpeed = isSprinting ? 38.0 : baseSpeed;
    if (moveForward || moveBackward) velocity.z -= direction.z * currentSpeed * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * currentSpeed * delta;

    // Efecto sutil y suave de FOV al esprintar
    const isMoving = (moveForward || moveBackward || moveLeft || moveRight);
    const targetFov = (isSprinting && isMoving) ? 78 : 70;
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov += (targetFov - camera.fov) * 0.15;
      camera.updateProjectionMatrix();
    }

    if (controls && !isTouchDevice) {
      controls.moveRight(-velocity.x * delta);
      controls.moveForward(-velocity.z * delta);
      const playerPos = controls.getObject().position;
      playerPos.x = Math.max(-5.8, Math.min(5.8, playerPos.x));
      playerPos.z = Math.max(-5.8, Math.min(5.8, playerPos.z));
      playerPos.y = 1.7;
    } else {
      const forwardVec = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, cameraYaw, 0));
      const rightVec = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, cameraYaw, 0));

      camera.position.addScaledVector(forwardVec, -velocity.z * delta);
      camera.position.addScaledVector(rightVec, -velocity.x * delta);

      camera.position.x = Math.max(-5.8, Math.min(5.8, camera.position.x));
      camera.position.z = Math.max(-5.8, Math.min(5.8, camera.position.z));
      camera.position.y = 1.7;
    }

    // Raycast para interacción
    raycaster.setFromCamera(centerMouse, camera);
    const targets = [computerScreenMesh, ...interactableBooks].filter(Boolean);
    const intersects = raycaster.intersectObjects(targets);

    if (intersects.length > 0 && intersects[0].distance < 4.6) {
      const hit = intersects[0].object;
      crosshair.classList.add('active');

      if (hit.userData.isComputer) {
        interactionPrompt.textContent = '🖥️ Presiona [E] o Clic para usar el Ordenador';
        interactionPrompt.style.display = isTouchDevice ? 'none' : 'block';

        mobileActionBtn.textContent = '🖥️ Usar Ordenador';
        mobileActionBtn.style.display = 'block';
      } else if (hit.userData.isBook) {
        const isRead = hit.userData.isRead;
        const statusText = isRead ? '🏆 Leído' : '📖 Por leer';
        interactionPrompt.textContent = `${statusText}: ${hit.userData.title} [E o Clic: Leer]`;
        interactionPrompt.style.display = isTouchDevice ? 'none' : 'block';

        mobileActionBtn.textContent = `📖 Leer: ${hit.userData.title.substring(0, 14)}`;
        mobileActionBtn.style.display = 'block';
      }
    } else {
      crosshair.classList.remove('active');
      interactionPrompt.style.display = 'none';
      mobileActionBtn.style.display = 'none';
    }
  }

  // Animación suave de reposicionamiento de libros entre estanterías
  books.forEach(b => {
    if (b.mesh && b.mesh.userData.targetPosition) {
      b.mesh.position.lerp(b.mesh.userData.targetPosition, 0.12);
      b.mesh.quaternion.slerp(
        new THREE.Quaternion().setFromEuler(b.mesh.userData.targetRotation),
        0.12
      );
    }
  });

  renderer.render(scene, camera);
}

// Iniciar aplicación
init();
