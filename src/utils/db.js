const IDB_NAME = 'SazeDB_FilesDB';
const IDB_VERSION = 1;
const IDB_STORE = 'book_files';

export function openFilesDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      // Fallback a versión previa si existía
      const fallbackReq = indexedDB.open('BookCRUD_FilesDB', 1);
      fallbackReq.onsuccess = () => resolve(fallbackReq.result);
      fallbackReq.onerror = () => resolve(null);
    };
  });
}

export async function saveBookFileToDB(bookId, arrayBuffer, fileName, fileType) {
  try {
    const db = await openFilesDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
      tx.objectStore(IDB_STORE).put({ data: arrayBuffer, fileName, fileType }, bookId);
    });
  } catch (err) {
    console.warn('No se pudo guardar el archivo en IndexedDB:', err);
  }
}

export async function getBookFileFromDB(bookId) {
  try {
    const db = await openFilesDB();
    if (!db) return null;
    return new Promise(resolve => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(bookId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

export async function deleteBookFileFromDB(bookId) {
  try {
    const db = await openFilesDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
      tx.objectStore(IDB_STORE).delete(bookId);
    });
  } catch (err) {}
}
