import React, { useState } from 'react';
import {
  Library,
  Play,
  Gamepad2,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  Compass,
  Zap,
  Hand
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';

export function Blocker() {
  const { hasGameStarted, startGame } = useLibrary();
  const [currentSlide, setCurrentSlide] = useState(0);

  if (hasGameStarted) return null;

  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    startGame();
    if (!isTouch) {
      try {
        const canvas = document.querySelector('#canvas-container canvas');
        canvas?.requestPointerLock?.();
      } catch (err) {}
    }
  };

  return (
    <div id="blocker">
      <div className="intro-card">
        {/* Pestañas / Indicadores de Slide */}
        <div className="intro-slide-tabs">
          <button
            type="button"
            className={`slide-tab-btn ${currentSlide === 0 ? 'active' : ''}`}
            onClick={() => setCurrentSlide(0)}
          >
            <Library size={15} />
            <span>Bienvenida</span>
          </button>
          <button
            type="button"
            className={`slide-tab-btn ${currentSlide === 1 ? 'active' : ''}`}
            onClick={() => setCurrentSlide(1)}
          >
            <Gamepad2 size={15} />
            <span>Controles</span>
          </button>
        </div>

        {/* Contenido Slide 0: Bienvenida e Historia */}
        {currentSlide === 0 && (
          <div className="intro-slide-content animate-slide">
            <div className="intro-badge">
              <Library size={28} className="intro-icon" />
            </div>
            <h1>SazeDB</h1>
            <span className="intro-tagline">Cobrememoria Digital en 3D</span>
            <p id="intro-desc">
              Inspirado en los <em>Guardadores de Terris</em> de Brandon Sanderson, que almacenan recuerdos en sus mentes de metal. SazeDB guarda tus libros en las estanterías de <strong>Por Leer</strong> y <strong>Libros Leídos</strong>, permitiéndote adjuntar archivos PDF o EPUB y leerlos guardando tu progreso automáticamente en LocalStorage.
            </p>

            <div className="intro-feature-pills">
              <span className="feature-pill">Lector PDF y EPUB</span>
              <span className="feature-pill">Gestión Offline</span>
              <span className="feature-pill">Totalmente Responsive</span>
            </div>
          </div>
        )}

        {/* Contenido Slide 1: Guía de Controles Adaptativa */}
        {currentSlide === 1 && (
          <div className="intro-slide-content animate-slide">
            <div className="intro-badge">
              {isTouch ? <Smartphone size={28} /> : <Compass size={28} />}
            </div>
            <h1>Controles</h1>
            <span className="intro-tagline">
              {isTouch ? 'Optimizado para pantalla táctil móvil' : 'Optimizado para teclado y ratón'}
            </span>

            {isTouch ? (
              <div className="controls-guide mobile-guide">
                <div>
                  <span className="key-badge">D-Pad</span>
                  <span>Moverte en la sala (arriba, abajo, lados)</span>
                </div>
                <div>
                  <span className="key-badge">Arrastrar</span>
                  <span>Deslizar dedo para mirar alrededor</span>
                </div>
                <div>
                  <span className="key-badge"><Zap size={13} inline="true" /> Correr</span>
                  <span>Pulsar botón para alternar sprint rápido</span>
                </div>
                <div>
                  <span className="key-badge"><Hand size={13} inline="true" /> Acción</span>
                  <span>Botón flotante para leer libros o usar PC</span>
                </div>
              </div>
            ) : (
              <div className="controls-guide">
                <div>
                  <span className="key-badge">W</span>
                  <span className="key-badge">A</span>
                  <span className="key-badge">S</span>
                  <span className="key-badge">D</span>
                  <span>Moverte por la habitación</span>
                </div>
                <div>
                  <span className="key-badge">Ratón</span>
                  <span>Mirar alrededor y apuntar</span>
                </div>
                <div>
                  <span className="key-badge">Shift</span>
                  <span>Mantener pulsado para correr</span>
                </div>
                <div>
                  <span className="key-badge">E / Clic</span>
                  <span>Usar ordenador / Leer libro</span>
                </div>
                <div>
                  <span className="key-badge">ESC</span>
                  <span>Menú de pausa y sliders de sensibilidad</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navegación de Slides & Puntos */}
        <div className="intro-slide-nav">
          <div className="slide-dots">
            <span
              className={`dot ${currentSlide === 0 ? 'active' : ''}`}
              onClick={() => setCurrentSlide(0)}
            />
            <span
              className={`dot ${currentSlide === 1 ? 'active' : ''}`}
              onClick={() => setCurrentSlide(1)}
            />
          </div>

          <button
            type="button"
            className="btn-slide-toggle"
            onClick={() => setCurrentSlide(curr => curr === 0 ? 1 : 0)}
          >
            {currentSlide === 0 ? (
              <>
                <span>Ver Controles</span>
                <ChevronRight size={16} />
              </>
            ) : (
              <>
                <ChevronLeft size={16} />
                <span>Ver Historia</span>
              </>
            )}
          </button>
        </div>

        {/* Botón Principal de Entrada Directa */}
        <button type="button" className="start-btn" onClick={handleStart}>
          <Play size={18} />
          <span>Entrar a la biblioteca</span>
        </button>
      </div>
    </div>
  );
}
