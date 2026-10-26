import React, { useState, useEffect, useRef } from 'react';
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
    mobileMove,
    setMobileMove
  } = useLibrary();

  const [isSprintActive, setIsSprintActive] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const discRef = useRef(null);

  // Detectar si el dispositivo es táctil o pantalla pequeña
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

  // Actualizar movimiento según la posición del toque respecto al centro del D-Pad
  const updateDirectionFromCoords = (clientX, clientY) => {
    if (!discRef.current) return;
    const rect = discRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const threshold = 12; // zona muerta central

    const forward = dy < -threshold;
    const backward = dy > threshold;
    const left = dx < -threshold;
    const right = dx > threshold;

    setMobileMove(prev => ({
      ...prev,
      forward,
      backward,
      left,
      right
    }));
  };

  const handlePointerDownDisc = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    updateDirectionFromCoords(e.clientX, e.clientY);
  };

  const handlePointerMoveDisc = (e) => {
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();
    updateDirectionFromCoords(e.clientX, e.clientY);
  };

  const handlePointerUpDisc = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    setMobileMove(prev => ({
      ...prev,
      forward: false,
      backward: false,
      left: false,
      right: false
    }));
  };

  // Botón individual de dirección con Pointer Capture asegurado
  const handleBtnDown = (dir) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    setMobileMove(prev => ({ ...prev, [dir]: true }));
  };

  const handleBtnUp = (dir) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
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
      {/* Botón de Pausa Flotante */}
      <button
        type="button"
        className="mobile-top-pause-btn"
        onClick={openPause}
        aria-label="Pausar juego"
      >
        <Pause size={22} />
      </button>

      {/* D-Pad Circular táctil continuo */}
      <div className="mobile-dpad-container" aria-label="Controles de movimiento">
        <div
          ref={discRef}
          className="dpad-disc"
          onPointerDown={handlePointerDownDisc}
          onPointerMove={handlePointerMoveDisc}
          onPointerUp={handlePointerUpDisc}
          onPointerCancel={handlePointerUpDisc}
        >
          {/* Botón Arriba (Avanzar) */}
          <button
            type="button"
            className={`dpad-btn dpad-up ${mobileMove.forward ? 'active' : ''}`}
            onPointerDown={handleBtnDown('forward')}
            onPointerUp={handleBtnUp('forward')}
            onPointerCancel={handleBtnUp('forward')}
            aria-label="Avanzar"
          >
            <ChevronUp size={28} />
          </button>

          {/* Botón Izquierda */}
          <button
            type="button"
            className={`dpad-btn dpad-left ${mobileMove.left ? 'active' : ''}`}
            onPointerDown={handleBtnDown('left')}
            onPointerUp={handleBtnUp('left')}
            onPointerCancel={handleBtnUp('left')}
            aria-label="Izquierda"
          >
            <ChevronLeft size={28} />
          </button>

          {/* Centro del D-Pad */}
          <div className="dpad-center" />

          {/* Botón Derecha */}
          <button
            type="button"
            className={`dpad-btn dpad-right ${mobileMove.right ? 'active' : ''}`}
            onPointerDown={handleBtnDown('right')}
            onPointerUp={handleBtnUp('right')}
            onPointerCancel={handleBtnUp('right')}
            aria-label="Derecha"
          >
            <ChevronRight size={28} />
          </button>

          {/* Botón Abajo (Retroceder / Ir para abajo) */}
          <button
            type="button"
            className={`dpad-btn dpad-down ${mobileMove.backward ? 'active' : ''}`}
            onPointerDown={handleBtnDown('backward')}
            onPointerUp={handleBtnUp('backward')}
            onPointerCancel={handleBtnUp('backward')}
            aria-label="Retroceder"
          >
            <ChevronDown size={28} />
          </button>
        </div>
      </div>

      {/* Zona de Botones de Acción e Interacción */}
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
