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
  const [stickOffset, setStickOffset] = useState({ x: 0, y: 0 });

  const discRef = useRef(null);
  const dpadPointerId = useRef(null);
  const sprintHolding = useRef(false);
  const sprintDownTime = useRef(0);

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

  // Actualizar movimiento según la posición del toque respecto al centro del D-Pad
  const updateDirectionFromCoords = (clientX, clientY) => {
    if (!discRef.current) return;
    const rect = discRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Calcular desplazamiento visual del stick central
    const dist = Math.hypot(dx, dy);
    const maxNubDist = 26;
    if (dist > 0) {
      const angle = Math.atan2(dy, dx);
      const clampedDist = Math.min(dist, maxNubDist);
      setStickOffset({
        x: Math.cos(angle) * clampedDist,
        y: Math.sin(angle) * clampedDist
      });
    } else {
      setStickOffset({ x: 0, y: 0 });
    }

    const threshold = 12; // zona muerta central
    const forward = dy < -threshold;
    const backward = dy > threshold;
    const left = dx < -threshold;
    const right = dx > threshold;

    // Si se empuja el stick al límite superior (dy < -48), activar auto-sprint
    const isPushSprint = dy < -48;
    const shouldSprint = isSprintActive || sprintHolding.current || isPushSprint;

    setMobileMove(prev => ({
      ...prev,
      forward,
      backward,
      left,
      right,
      sprint: shouldSprint
    }));
  };

  const handlePointerDownDisc = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    dpadPointerId.current = e.pointerId;
    updateDirectionFromCoords(e.clientX, e.clientY);
  };

  const handlePointerMoveDisc = (e) => {
    if (dpadPointerId.current === null || e.pointerId !== dpadPointerId.current) return;
    e.preventDefault();
    e.stopPropagation();
    updateDirectionFromCoords(e.clientX, e.clientY);
  };

  const handlePointerUpDisc = (e) => {
    if (dpadPointerId.current !== null && e.pointerId === dpadPointerId.current) {
      e.preventDefault();
      e.stopPropagation();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
      dpadPointerId.current = null;
      setStickOffset({ x: 0, y: 0 });
      setMobileMove(prev => ({
        ...prev,
        forward: false,
        backward: false,
        left: false,
        right: false,
        sprint: isSprintActive || sprintHolding.current
      }));
    }
  };

  // Manejador del botón de sprint: Soporta tanto mantener pulsado (hold) como toque rápido (toggle)
  const handleSprintDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    sprintHolding.current = true;
    sprintDownTime.current = Date.now();
    setMobileMove(m => ({ ...m, sprint: true }));
  };

  const handleSprintUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    sprintHolding.current = false;
    const duration = Date.now() - sprintDownTime.current;

    if (duration < 280) {
      // Tap rápido: alternar modo toggle
      setIsSprintActive(prev => {
        const next = !prev;
        setMobileMove(m => ({ ...m, sprint: next }));
        return next;
      });
    } else {
      // Hold prolongado: al soltar el dedo, desactivar si no estaba bloqueado previamente
      if (!isSprintActive) {
        setMobileMove(m => ({ ...m, sprint: false }));
      }
    }
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

  if (!isMobileDevice || !hasGameStarted || isComputerOpen || activeReaderBook || isPauseOpen) {
    return null;
  }

  const isCurrentlySprinting = isSprintActive || mobileMove.sprint;

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

      {/* D-Pad Circular táctil continuo y fluido */}
      <div className="mobile-dpad-container" aria-label="Controles de movimiento">
        <div
          ref={discRef}
          className="dpad-disc"
          onPointerDown={handlePointerDownDisc}
          onPointerMove={handlePointerMoveDisc}
          onPointerUp={handlePointerUpDisc}
          onPointerCancel={handlePointerUpDisc}
        >
          {/* Indicador Arriba (Avanzar) */}
          <div
            className={`dpad-btn dpad-up ${mobileMove.forward ? 'active' : ''}`}
            aria-hidden="true"
          >
            <ChevronUp size={28} />
          </div>

          {/* Indicador Izquierda */}
          <div
            className={`dpad-btn dpad-left ${mobileMove.left ? 'active' : ''}`}
            aria-hidden="true"
          >
            <ChevronLeft size={28} />
          </div>

          {/* Stick Central Dinámico táctil */}
          <div
            className="dpad-center"
            style={{
              transform: `translate(calc(-50% + ${stickOffset.x}px), calc(-50% + ${stickOffset.y}px))`
            }}
          />

          {/* Indicador Derecha */}
          <div
            className={`dpad-btn dpad-right ${mobileMove.right ? 'active' : ''}`}
            aria-hidden="true"
          >
            <ChevronRight size={28} />
          </div>

          {/* Indicador Abajo (Retroceder) */}
          <div
            className={`dpad-btn dpad-down ${mobileMove.backward ? 'active' : ''}`}
            aria-hidden="true"
          >
            <ChevronDown size={28} />
          </div>
        </div>
      </div>

      {/* Zona de Botones de Acción e Interacción */}
      <div className="mobile-actions-container">
        {/* Botón de Esprintar / Correr (Mantener para correr o tocar para alternar) */}
        <button
          type="button"
          className={`mobile-sprint-btn ${isCurrentlySprinting ? 'active' : ''}`}
          onPointerDown={handleSprintDown}
          onPointerUp={handleSprintUp}
          onPointerCancel={handleSprintUp}
          aria-label="Correr o alternar esprint"
        >
          <Zap size={22} />
          <span className="sprint-label">{isCurrentlySprinting ? 'CORRIENDO' : 'CORRER'}</span>
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
