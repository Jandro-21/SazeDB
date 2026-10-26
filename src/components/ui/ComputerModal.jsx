import React, { useState, useRef, useEffect } from 'react';
import {
  Monitor,
  X,
  PenLine,
  Library,
  UploadCloud,
  FileText,
  Image,
  BookOpen,
  Trophy,
  Pencil,
  Trash2,
  Check,
  RotateCcw
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';

export function ComputerModal() {
  const {
    books,
    isComputerOpen,
    closeComputer,
    addBook,
    updateBook,
    deleteBook,
    openReader
  } = useLibrary();

  // Estado del formulario
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#c4683c');
  const [isRead, setIsRead] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [pendingDoc, setPendingDoc] = useState(null); // { arrayBuffer, fileName, fileType }

  // Filtro de lista
  const [currentFilter, setCurrentFilter] = useState('all');
  const [mobileTab, setMobileTab] = useState('form'); // 'form' | 'list'

  const fileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);

  // Salir con Escape de vuelta al HUB 3D sin abrir menú de pausa
  useEffect(() => {
    if (!isComputerOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeComputer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isComputerOpen, closeComputer]);

  if (!isComputerOpen) return null;

  // Preset de colores cálidos
  const presets = ['#c4683c', '#8c5039', '#d98b43', '#7a3e26', '#4a5d4e', '#2b3a4a'];

  const resetForm = () => {
    setSelectedBookId(null);
    setTitle('');
    setAuthor('');
    setColor('#c4683c');
    setIsRead(false);
    setCoverImage(null);
    setCoverUrl('');
    setPendingDoc(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (coverFileInputRef.current) coverFileInputRef.current.value = '';
  };

  const handleEdit = (book) => {
    setSelectedBookId(book.id);
    setTitle(book.title);
    setAuthor(book.author || '');
    setColor(book.color || '#c4683c');
    setIsRead(!!book.isRead);
    setCoverImage(book.coverImage || null);
    setCoverUrl(typeof book.coverImage === 'string' && book.coverImage.startsWith('http') ? book.coverImage : '');
    setPendingDoc(null);
    setMobileTab('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const bookData = {
      title: title.trim(),
      author: author.trim(),
      color,
      coverImage,
      isRead
    };

    if (selectedBookId !== null) {
      await updateBook(selectedBookId, bookData, pendingDoc);
    } else {
      await addBook(bookData, pendingDoc);
    }

    resetForm();
    if (window.innerWidth <= 768) {
      setMobileTab('list');
    }
  };

  // Manejador de carga de archivo de lectura (.pdf, .epub, .azw3)
  const handleDocFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPendingDoc({
          arrayBuffer: evt.target.result,
          fileName: file.name,
          fileType: file.type || file.name.split('.').pop()
        });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Manejador de imagen de portada
  const handleCoverFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setCoverImage(evt.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtrado de libros
  const filteredBooks = books.filter(b => {
    if (currentFilter === 'unread') return !b.isRead;
    if (currentFilter === 'read') return b.isRead;
    return true;
  });

  return (
    <div id="computer-modal">
      {/* Barra de título del SO */}
      <div className="os-titlebar">
        <div className="title">
          <Monitor size={18} />
          <span>SazeOS 4.0 — Gestor SazeDB & Sincronización LocalStorage</span>
        </div>
        <button type="button" className="btn-exit-os" onClick={closeComputer}>
          <X size={16} />
          <span>Salir al estudio [ESC]</span>
        </button>
      </div>

      {/* Pestañas para versión móvil */}
      <div className="mobile-os-tabs">
        <button
          type="button"
          className={`os-tab ${mobileTab === 'form' ? 'active' : ''}`}
          onClick={() => setMobileTab('form')}
        >
          <PenLine size={16} />
          <span>Formulario</span>
        </button>
        <button
          type="button"
          className={`os-tab ${mobileTab === 'list' ? 'active' : ''}`}
          onClick={() => setMobileTab('list')}
        >
          <Library size={16} />
          <span>Libros ({books.length})</span>
        </button>
      </div>

      <div className="os-content">
        {/* Columna 1: Formulario */}
        <div className={`crud-form-col ${mobileTab === 'list' ? 'mobile-hidden' : ''}`}>
          <div className="form-header">
            <h2>Datos del Libro</h2>
            <span className={`mode-badge ${selectedBookId !== null ? 'editing' : ''}`}>
              {selectedBookId !== null ? `Editando ID: ${selectedBookId}` : 'Nuevo Libro'}
            </span>
          </div>

          <form onSubmit={handleSubmit} id="book-form">
            <div className="field-group">
              <label htmlFor="title">Título del libro *</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Don Quijote de la Mancha"
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="author">Autor</label>
              <input
                type="text"
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ej: Miguel de Cervantes"
              />
            </div>

            <div className="field-group">
              <label htmlFor="color">Color del lomo</label>
              <input
                type="color"
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <div className="color-presets">
                {presets.map(c => (
                  <button
                    key={c}
                    type="button"
                    className="preset-btn"
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            {/* Adjuntar archivo de lectura */}
            <div className="field-group doc-file-box">
              <label className="file-box-label">
                <FileText size={16} />
                <span>Archivo de Lectura (PDF / EPUB / AZW3)</span>
              </label>
              <p className="field-hint">
                Adjunta tu libro digital para leerlo con paginación y guardado automático en LocalStorage.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.epub,.azw3"
                onChange={handleDocFileChange}
                className="file-input-clean"
              />
              {pendingDoc && (
                <div className="doc-file-info success">
                  <Check size={14} />
                  <span>Documento cargado: {pendingDoc.fileName}</span>
                </div>
              )}
            </div>

            {/* Portada personalizada */}
            <div className="field-group">
              <label className="file-box-label">
                <Image size={16} />
                <span>Portada del Libro (Opcional)</span>
              </label>
              <input
                type="file"
                ref={coverFileInputRef}
                accept="image/*"
                onChange={handleCoverFileChange}
                className="file-input-clean"
              />
              <input
                type="text"
                placeholder="O pega aquí la URL de la imagen..."
                value={coverUrl}
                onChange={(e) => {
                  setCoverUrl(e.target.value);
                  setCoverImage(e.target.value.trim() || null);
                }}
                className="url-input"
              />
              {coverImage && (
                <div className="cover-preview-wrapper">
                  <div className="cover-preview" style={{ backgroundImage: `url(${coverImage})` }} />
                  <button
                    type="button"
                    className="btn-remove-cover"
                    onClick={() => {
                      setCoverImage(null);
                      setCoverUrl('');
                      if (coverFileInputRef.current) coverFileInputRef.current.value = '';
                    }}
                  >
                    <X size={14} /> Quitar portada
                  </button>
                </div>
              )}
            </div>

            {/* Checkbox Leído */}
            <div className="field-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isRead}
                  onChange={(e) => setIsRead(e.target.checked)}
                />
                <Trophy size={16} className={isRead ? 'text-gold' : ''} />
                <span>Colocar en la estantería de Libros Leídos</span>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {selectedBookId !== null ? 'Guardar Cambios' : 'Añadir a la Biblioteca'}
              </button>
              {selectedBookId !== null && (
                <>
                  <button type="button" className="btn-secondary" onClick={resetForm}>
                    <RotateCcw size={14} /> Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={async () => {
                      if (confirm('¿Eliminar este libro de la biblioteca?')) {
                        await deleteBook(selectedBookId);
                        resetForm();
                      }
                    }}
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Columna 2: Lista de libros */}
        <div className={`crud-list-col ${mobileTab === 'form' ? 'mobile-hidden' : ''}`}>
          <div className="list-header">
            <h3>Catálogo de Libros</h3>
            <span className="books-count-badge">Total: {filteredBooks.length}</span>
          </div>

          <div className="shelf-filters">
            <button
              type="button"
              className={`filter-chip ${currentFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCurrentFilter('all')}
            >
              Todos ({books.length})
            </button>
            <button
              type="button"
              className={`filter-chip ${currentFilter === 'unread' ? 'active' : ''}`}
              onClick={() => setCurrentFilter('unread')}
            >
              <BookOpen size={14} /> Por Leer ({books.filter(b => !b.isRead).length})
            </button>
            <button
              type="button"
              className={`filter-chip ${currentFilter === 'read' ? 'active' : ''}`}
              onClick={() => setCurrentFilter('read')}
            >
              <Trophy size={14} /> Leídos ({books.filter(b => b.isRead).length})
            </button>
          </div>

          <div className="books-scroll-list">
            {filteredBooks.length === 0 ? (
              <div className="empty-catalog">
                <BookOpen size={36} />
                <p>No hay libros en esta categoría.</p>
              </div>
            ) : (
              filteredBooks.map(b => (
                <div key={b.id} className="book-item-card">
                  <div className="book-card-color" style={{ backgroundColor: b.color || '#c4683c' }} />
                  <div className="book-card-info">
                    <h4>{b.title}</h4>
                    <span className="author-name">{b.author || 'Autor desconocido'}</span>
                    <div className="card-tags">
                      <span className={`status-pill ${b.isRead ? 'pill-read' : 'pill-unread'}`}>
                        {b.isRead ? <Trophy size={12} /> : <BookOpen size={12} />}
                        {b.isRead ? 'Leído' : 'Por leer'}
                      </span>
                      {b.fileName && (
                        <span className="file-pill">
                          <FileText size={12} /> {b.fileName.split('.').pop()?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="book-card-actions">
                    <button
                      type="button"
                      className="btn-card-read"
                      title="Leer este libro"
                      onClick={() => openReader(b.id)}
                    >
                      <BookOpen size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn-card-edit"
                      title="Editar libro"
                      onClick={() => handleEdit(b)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn-card-delete"
                      title="Eliminar libro"
                      onClick={async () => {
                        if (confirm(`¿Eliminar "${b.title}"?`)) {
                          await deleteBook(b.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
