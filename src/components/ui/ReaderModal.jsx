import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen,
  Trophy,
  X,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  AlertCircle
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { useLibrary } from '../../context/LibraryContext';
import { getBookFileFromDB } from '../../utils/db';
import { parseEpubWithJSZip, DEMO_PAGES } from '../../utils/epubParser';

// Configurar Worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export function ReaderModal() {
  const {
    activeReaderBook,
    closeReader,
    markAsRead,
    readerPage,
    updateReaderPage
  } = useLibrary();

  const [docType, setDocType] = useState('demo'); // 'pdf' | 'epub' | 'demo'
  const [totalPages, setTotalPages] = useState(1);
  const [epubChapters, setEpubChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfDoc, setPdfDoc] = useState(null);

  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const blobUrlsRef = useRef([]);

  // Cargar documento al abrir el libro
  useEffect(() => {
    if (!activeReaderBook) return;

    let isMounted = true;
    setLoading(true);

    async function loadBookData() {
      // Limpiar blob URLs previas
      blobUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
      blobUrlsRef.current = [];

      const stored = await getBookFileFromDB(activeReaderBook.id);

      if (stored && stored.data) {
        const ext = (stored.fileName || '').toLowerCase();

        if (ext.endsWith('.pdf')) {
          try {
            const loadingTask = pdfjsLib.getDocument({ data: stored.data });
            const pdf = await loadingTask.promise;
            if (!isMounted) return;
            setPdfDoc(pdf);
            setDocType('pdf');
            setTotalPages(pdf.numPages);
            setLoading(false);
            return;
          } catch (err) {
            console.warn('Error cargando PDF:', err);
          }
        } else if (ext.endsWith('.epub') || ext.endsWith('.azw3') || ext.endsWith('.zip')) {
          try {
            const { chapters, blobUrls } = await parseEpubWithJSZip(stored.data);
            if (!isMounted) return;
            blobUrlsRef.current = blobUrls;

            if (chapters.length > 0) {
              setEpubChapters(chapters);
              setDocType('epub');
              setTotalPages(chapters.length);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.warn('Error descomprimiendo EPUB:', err);
          }
        }
      }

      // Fallback a texto Demo
      if (!isMounted) return;
      setDocType('demo');
      setTotalPages(DEMO_PAGES.length);
      setLoading(false);
    }

    loadBookData();

    return () => {
      isMounted = false;
      blobUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
      blobUrlsRef.current = [];
    };
  }, [activeReaderBook]);

  // Renderizar página PDF cuando cambie la página o el documento
  useEffect(() => {
    if (docType !== 'pdf' || !pdfDoc || !canvasRef.current) return;

    let cancel = false;
    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(readerPage);
        if (cancel) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: window.innerWidth <= 768 ? 1.0 : 1.4 });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (err) {
        console.warn('Error renderizando página PDF:', err);
      }
    }

    renderPage();
    return () => { cancel = true; };
  }, [docType, pdfDoc, readerPage]);

  // Scroll al inicio al cambiar de página
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0;
    }
  }, [readerPage]);

  // Navegación de páginas
  const handlePrev = useCallback(() => {
    if (readerPage > 1) {
      updateReaderPage(readerPage - 1);
    }
  }, [readerPage, updateReaderPage]);

  const handleNext = useCallback(() => {
    if (readerPage < totalPages) {
      const nextP = readerPage + 1;
      updateReaderPage(nextP);

      // Si llega a la última página y no está leído
      if (nextP === totalPages && activeReaderBook && !activeReaderBook.isRead) {
        setTimeout(() => {
          if (confirm(`¡Has completado "${activeReaderBook.title}"! ¿Deseas colocarlo en la estantería de Libros Leídos?`)) {
            markAsRead(activeReaderBook.id);
          }
        }, 300);
      }
    }
  }, [readerPage, totalPages, activeReaderBook, updateReaderPage, markAsRead]);

  // Eventos de teclado dentro del lector
  useEffect(() => {
    if (!activeReaderBook) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeReader();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNext();
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeReaderBook, closeReader, handleNext, handlePrev]);

  if (!activeReaderBook) return null;

  const currentEpubChapter = (epubChapters && epubChapters[readerPage - 1]) || null;
  const currentDemoPage = DEMO_PAGES[Math.min(readerPage - 1, DEMO_PAGES.length - 1)];
  const percent = Math.round((readerPage / Math.max(1, totalPages)) * 100);

  return (
    <div id="reader-modal">
      {/* Cabecera del lector */}
      <div className="reader-header">
        <div className="reader-title-info">
          <div className="reader-icon-wrapper">
            <BookOpen size={20} />
          </div>
          <div>
            <h2>{activeReaderBook.title}</h2>
            <span>{activeReaderBook.author || 'Autor desconocido'}</span>
          </div>
        </div>

        <div className="reader-status-actions">
          <button
            type="button"
            className={`btn-reader-action btn-reader-finish ${activeReaderBook.isRead ? 'already-read' : ''}`}
            onClick={() => markAsRead(activeReaderBook.id)}
          >
            <Trophy size={16} />
            <span>{activeReaderBook.isRead ? 'Ya está en Leídos' : 'Marcar como Leído'}</span>
          </button>
          <button
            type="button"
            className="btn-reader-action btn-reader-close"
            onClick={closeReader}
            title="Cerrar lector [ESC]"
          >
            <X size={16} />
            <span>Cerrar lector [ESC]</span>
          </button>
        </div>
      </div>

      {/* Área del documento */}
      <div className="reader-viewport" ref={viewportRef}>
        {loading ? (
          <div className="reader-loading">
            <BookOpen size={48} className="spinner-icon" />
            <h3>Abriendo documento...</h3>
            <p>Preparando capítulos, páginas y formato de lectura.</p>
          </div>
        ) : docType === 'pdf' ? (
          <div className="pdf-container">
            <canvas ref={canvasRef} className="pdf-canvas" />
          </div>
        ) : docType === 'epub' && currentEpubChapter ? (
          <div className="text-reader-content epub-chapter-view">
            <div className="epub-chapter-meta">
              <span className="chapter-badge">Capítulo {readerPage} de {totalPages}</span>
              <h3 className="chapter-heading">{currentEpubChapter.title}</h3>
            </div>
            <div
              className="epub-body-text"
              dangerouslySetInnerHTML={{ __html: currentEpubChapter.html }}
            />
          </div>
        ) : (
          <div className="text-reader-content">
            <h3>{activeReaderBook.title} — {currentDemoPage.chapter}</h3>
            <p>{currentDemoPage.content}</p>
            <div className="demo-notice">
              <AlertCircle size={18} />
              <p>
                Puedes adjuntar cualquier archivo <strong>.PDF, .EPUB o .AZW3</strong> desde el ordenador de la biblioteca para disfrutar de tus libros reales con guardado automático de página.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Barra de navegación inferior */}
      <div className="reader-footer">
        <button
          type="button"
          className="btn-page-nav"
          onClick={handlePrev}
          disabled={readerPage <= 1}
        >
          <ChevronLeft size={16} />
          <span>Página Anterior</span>
        </button>

        <div className="reader-pagination-info">
          <span>Página</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={readerPage}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1 && val <= totalPages) {
                updateReaderPage(val);
              }
            }}
          />
          <span>de <strong>{totalPages}</strong></span>
          <span className="progress-pill">{percent}%</span>
          <span className="save-status">
            <Save size={13} /> Guardado en LocalStorage
          </span>
        </div>

        <button
          type="button"
          className="btn-page-nav"
          onClick={handleNext}
          disabled={readerPage >= totalPages}
        >
          <span>Página Siguiente</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
