import React, { useState, useEffect } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Zap,
  BookOpen,
  Monitor,
  Pause
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';

export function MobileControls() {
  const {
    hasGameStarted,
    isComputerOpen,
    activeReaderBook,
    isPauseOpen,
    openPause,
    hoveredTarget,
    openReader,
    openComputer,
    setMobileMove
  } = useLibrary();

  const [isSprintActive, setIsSprintActive] = useState(false);

  // Detectar si el dispositivo es táctil o pantalla pequeña
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
      setIsMobileDevice(isTouch);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobileDevice || !hasGameStarted || isComputerOpen || activeReaderBook || isPauseOpen) {
    return null;
  }

  const handleDirStart = (dir) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMobileMove(prev => ({ ...prev, [dir]: true }));
  };

  const handleDirEnd = (dir) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMobileMove(prev => ({ ...prev, [dir]: false }));
  };

  const toggleSprint = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSprintActive(prev => {
      const next = !prev;
      setMobileMove(m => ({ ...m, sprint: next }));
      return next;
    });
  };

  const handleAction = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hoveredTarget?.type === 'book') {
      openReader(hoveredTarget.id);
    } else if (hoveredTarget?.type === 'computer') {
      openComputer();
    }
  };

  return (
    <div id="mobile-hud-overlay">
      {/* Botón de Pausa Flotante (Superior Derecho) */}
      <button
        type="button"
        className="mobile-top-pause-btn"
        onClick={openPause}
        aria-label="Pausar juego"
      >
        <Pause size={22} />
      </button>

      {/* D-Pad Circular en la esquina inferior izquierda */}
      <div className="mobile-dpad-container" aria-label="Controles de movimiento">
        <div className="dpad-disc">
          {/* Botón Arriba (Avanzar) */}
          <button
            type="button"
            className="dpad-btn dpad-up"
            onPointerDown={handleDirStart('forward')}
            onPointerUp={handleDirEnd('forward')}
            onPointerCancel={handleDirEnd('forward')}
            onPointerLeave={handleDirEnd('forward')}
            aria-label="Avanzar"
          >
            <ChevronUp size={28} />
          </button>

          {/* Botón Izquierda */}
          <button
            type="button"
            className="dpad-btn dpad-left"
            onPointerDown={handleDirStart('left')}
            onPointerUp={handleDirEnd('left')}
            onPointerCancel={handleDirEnd('left')}
            onPointerLeave={handleDirEnd('left')}
            aria-label="Izquierda"
          >
            <ChevronLeft size={28} />
          </button>

          {/* Centro del D-Pad */}
          <div className="dpad-center" />

          {/* Botón Derecha */}
          <button
            type="button"
            className="dpad-btn dpad-right"
            onPointerDown={handleDirStart('right')}
            onPointerUp={handleDirEnd('right')}
            onPointerCancel={handleDirEnd('right')}
            onPointerLeave={handleDirEnd('right')}
            aria-label="Derecha"
          >
            <ChevronRight size={28} />
          </button>

          {/* Botón Abajo (Retroceder) */}
          <button
            type="button"
            className="dpad-btn dpad-down"
            onPointerDown={handleDirStart('backward')}
            onPointerUp={handleDirEnd('backward')}
            onPointerCancel={handleDirEnd('backward')}
            onPointerLeave={handleDirEnd('backward')}
            aria-label="Retroceder"
          >
            <ChevronDown size={28} />
          </button>
        </div>
      </div>

      {/* Zona de Botones de Acción e Interacción (Inferior Derecha) */}
      <div className="mobile-actions-container">
        {/* Botón de Esprintar / Correr */}
        <button
          type="button"
          className={`mobile-sprint-btn ${isSprintActive ? 'active' : ''}`}
          onClick={toggleSprint}
          aria-label="Alternar modo correr"
        >
          <Zap size={22} />
          <span className="sprint-label">{isSprintActive ? 'CORRIENDO' : 'CORRER'}</span>
        </button>

        {/* Botón Dinámico de Interacción al apuntar */}
        {hoveredTarget && (
          <button
            type="button"
            className="mobile-main-action-btn"
            onClick={handleAction}
            aria-label="Interactuar"
          >
            {hoveredTarget.type === 'computer' ? (
              <>
                <Monitor size={22} />
                <span>Usar SazeOS</span>
              </>
            ) : (
              <>
                <BookOpen size={22} />
                <span className="action-title-truncate">
                  {hoveredTarget.title ? `Leer: ${hoveredTarget.title}` : 'Leer Libro'}
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
