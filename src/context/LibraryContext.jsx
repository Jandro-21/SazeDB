import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadBooksFromStorage, saveBooksToStorage, saveBookProgress, loadBookProgress } from '../utils/storage';
import { saveBookFileToDB, deleteBookFileFromDB } from '../utils/db';

const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const [books, setBooks] = useState(() => loadBooksFromStorage());
  const [activeReaderBook, setActiveReaderBook] = useState(null);
  const [readerPage, setReaderPage] = useState(1);
  const [isComputerOpen, setIsComputerOpen] = useState(false);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [hoveredTarget, setHoveredTarget] = useState(null); // { type: 'book' | 'computer', id, title, isRead }
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Configuración de controles ajustables
  const [cameraSensitivity, setCameraSensitivity] = useState(() => {
    const s = localStorage.getItem('sazedb_setting_sensitivity');
    return s ? parseFloat(s) : 1.0;
  });

  const [sprintSpeed, setSprintSpeed] = useState(() => {
    const s = localStorage.getItem('sazedb_setting_sprint_speed');
    return s ? parseFloat(s) : 38.0;
  });

  const updateCameraSensitivity = useCallback((val) => {
    setCameraSensitivity(val);
    localStorage.setItem('sazedb_setting_sensitivity', String(val));
  }, []);

  const updateSprintSpeed = useCallback((val) => {
    setSprintSpeed(val);
    localStorage.setItem('sazedb_setting_sprint_speed', String(val));
  }, []);

  // Estado de movimiento desde D-Pad móvil
  const [mobileMove, setMobileMove] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false
  });

  // Guardar en LocalStorage cada vez que cambien los libros
  useEffect(() => {
    saveBooksToStorage(books);
  }, [books]);

  const startGame = useCallback(() => {
    setHasGameStarted(true);
    setIsPauseOpen(false);
  }, []);

  const openComputer = useCallback(() => {
    if (document.pointerLockElement) {
      try { document.exitPointerLock(); } catch (e) {}
    }
    setIsComputerOpen(true);
  }, []);

  const closeComputer = useCallback(() => {
    setIsTransitioning(true);
    setIsComputerOpen(false);
    setTimeout(() => setIsTransitioning(false), 300);
  }, []);

  const openReader = useCallback((bookId) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    if (document.pointerLockElement) {
      try { document.exitPointerLock(); } catch (e) {}
    }
    const saved = loadBookProgress(book.id) || book.currentPage || 1;
    setActiveReaderBook(book);
    setReaderPage(saved);
    if (isComputerOpen) setIsComputerOpen(false);
  }, [books, isComputerOpen]);

  const closeReader = useCallback(() => {
    setIsTransitioning(true);
    setActiveReaderBook(null);
    setTimeout(() => setIsTransitioning(false), 300);
  }, []);

  const openPause = useCallback(() => {
    if (isComputerOpen || activeReaderBook || isTransitioning) return;
    if (document.pointerLockElement) {
      try { document.exitPointerLock(); } catch (e) {}
    }
    setIsPauseOpen(true);
  }, [isComputerOpen, activeReaderBook, isTransitioning]);

  const closePause = useCallback(() => {
    setIsPauseOpen(false);
  }, []);

  const updateReaderPage = useCallback((pageNum) => {
    setReaderPage(pageNum);
    if (activeReaderBook) {
      saveBookProgress(activeReaderBook.id, pageNum);
      setBooks(prev => prev.map(b => b.id === activeReaderBook.id ? { ...b, currentPage: pageNum } : b));
    }
  }, [activeReaderBook]);

  const markAsRead = useCallback((bookId) => {
    setBooks(prev => prev.map(b => {
      if (b.id === bookId) {
        const total = b.totalPages || 4;
        saveBookProgress(b.id, total);
        return { ...b, isRead: true, currentPage: total };
      }
      return b;
    }));
    setActiveReaderBook(prev => (prev && prev.id === bookId) ? { ...prev, isRead: true } : prev);
  }, []);

  const addBook = useCallback(async (bookData, docFile) => {
    const newId = books.reduce((max, b) => Math.max(max, b.id || 0), 0) + 1;
    const newBook = {
      id: newId,
      title: bookData.title,
      author: bookData.author || '',
      color: bookData.color || '#c4683c',
      coverImage: bookData.coverImage || null,
      isRead: !!bookData.isRead,
      currentPage: 1,
      totalPages: 4,
      fileName: docFile ? docFile.fileName : null,
      fileType: docFile ? docFile.fileType : null
    };

    if (docFile && docFile.arrayBuffer) {
      await saveBookFileToDB(newId, docFile.arrayBuffer, docFile.fileName, docFile.fileType);
    }

    setBooks(prev => [...prev, newBook]);
    return newBook;
  }, [books]);

  const updateBook = useCallback(async (bookId, bookData, docFile) => {
    if (docFile && docFile.arrayBuffer) {
      await saveBookFileToDB(bookId, docFile.arrayBuffer, docFile.fileName, docFile.fileType);
    }

    setBooks(prev => prev.map(b => {
      if (b.id === bookId) {
        return {
          ...b,
          title: bookData.title,
          author: bookData.author,
          color: bookData.color,
          coverImage: bookData.coverImage !== undefined ? bookData.coverImage : b.coverImage,
          isRead: !!bookData.isRead,
          fileName: docFile ? docFile.fileName : b.fileName,
          fileType: docFile ? docFile.fileType : b.fileType
        };
      }
      return b;
    }));
  }, []);

  const deleteBook = useCallback(async (bookId) => {
    await deleteBookFileFromDB(bookId);
    localStorage.removeItem('sazedb_page_' + bookId);
    localStorage.removeItem('bookcrud_page_' + bookId);
    setBooks(prev => prev.filter(b => b.id !== bookId));
    if (activeReaderBook && activeReaderBook.id === bookId) {
      closeReader();
    }
  }, [activeReaderBook, closeReader]);

  return (
    <LibraryContext.Provider value={{
      books,
      activeReaderBook,
      readerPage,
      isComputerOpen,
      isPauseOpen,
      hasGameStarted,
      hoveredTarget,
      isTransitioning,
      setHoveredTarget,
      startGame,
      openComputer,
      closeComputer,
      openReader,
      closeReader,
      openPause,
      closePause,
      updateReaderPage,
      markAsRead,
      addBook,
      updateBook,
      deleteBook,
      cameraSensitivity,
      updateCameraSensitivity,
      sprintSpeed,
      updateSprintSpeed,
      mobileMove,
      setMobileMove
    }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary debe usarse dentro de LibraryProvider');
  return ctx;
}
