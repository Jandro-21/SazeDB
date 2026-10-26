import React from 'react';
import { Hand, Pause, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
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
    openComputer
  } = useLibrary();

  if (!hasGameStarted || isComputerOpen || activeReaderBook || isPauseOpen) {
    return null;
  }

  const handleAction = () => {
    if (hoveredTarget?.type === 'book') {
      openReader(hoveredTarget.id);
    } else if (hoveredTarget?.type === 'computer') {
      openComputer();
    }
  };

  return (
    <div id="mobile-controls">
      {/* Botones de acción lateral */}
      <div className="mobile-action-zone">
        {hoveredTarget && (
          <button type="button" className="mobile-action-btn" onClick={handleAction}>
            <Hand size={18} />
            <span>
              {hoveredTarget.type === 'computer' ? 'Usar Ordenador' : `Leer: ${hoveredTarget.title?.substring(0, 12)}`}
            </span>
          </button>
        )}
        <button
          type="button"
          className="mobile-pause-btn"
          title="Menú de Pausa"
          onClick={openPause}
        >
          <Pause size={20} />
        </button>
      </div>
    </div>
  );
}
