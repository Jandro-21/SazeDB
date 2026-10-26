export const STORAGE_KEY = 'sazedb_library_v1';
export const LEGACY_STORAGE_KEY = 'bookcrud_library_v1';
export const PROGRESS_KEY_PREFIX = 'sazedb_page_';

export const DEFAULT_BOOKS = [
  { id: 1, title: 'El Imperio Final (Mistborn)', author: 'Brandon Sanderson', color: '#c4683c', coverImage: null, isRead: false, currentPage: 1, totalPages: 4 },
  { id: 2, title: 'El Pozo de la Ascensión', author: 'Brandon Sanderson', color: '#8c5039', coverImage: null, isRead: false, currentPage: 1, totalPages: 4 },
  { id: 3, title: 'El Héroe de las Eras', author: 'Brandon Sanderson', color: '#d98b43', coverImage: null, isRead: true, currentPage: 4, totalPages: 4 },
  { id: 4, title: 'Don Quijote de la Mancha', author: 'M. de Cervantes', color: '#7a3e26', coverImage: null, isRead: false, currentPage: 1, totalPages: 4 }
];

export function loadBooksFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(b => {
          const prog = localStorage.getItem(PROGRESS_KEY_PREFIX + b.id) || localStorage.getItem('bookcrud_page_' + b.id);
          return {
            ...b,
            currentPage: prog ? parseInt(prog, 10) : (b.currentPage || 1),
            totalPages: b.totalPages || 4
          };
        });
      }
    } catch (e) {
      console.warn('Error leyendo libros de LocalStorage:', e);
    }
  }
  return DEFAULT_BOOKS;
}

export function saveBooksToStorage(books) {
  const serializable = books.map(b => ({
    id: b.id,
    title: b.title,
    author: b.author || '',
    color: b.color || '#c4683c',
    coverImage: b.coverImage || null,
    isRead: !!b.isRead,
    currentPage: b.currentPage || 1,
    totalPages: b.totalPages || 4,
    fileName: b.fileName || null,
    fileType: b.fileType || null
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

export function saveBookProgress(bookId, pageNum) {
  localStorage.setItem(PROGRESS_KEY_PREFIX + bookId, String(pageNum));
}

export function loadBookProgress(bookId) {
  const val = localStorage.getItem(PROGRESS_KEY_PREFIX + bookId);
  return val ? parseInt(val, 10) : 1;
}
