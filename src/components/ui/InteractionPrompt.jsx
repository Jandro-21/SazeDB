import React from 'react';
import { Monitor, BookOpen, Trophy } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';

export function InteractionPrompt() {
  const { hoveredTarget, isComputerOpen, activeReaderBook, isPauseOpen } = useLibrary();

  if (!hoveredTarget || isComputerOpen || activeReaderBook || isPauseOpen) {
    return null;
  }

  if (hoveredTarget.type === 'computer') {
    return (
      <div className="interaction-prompt">
        <Monitor size={18} className="prompt-icon" />
        <span>Presiona <strong>[E]</strong> o Clic para usar el Ordenador</span>
      </div>
    );
  }

  if (hoveredTarget.type === 'book') {
    return (
      <div className="interaction-prompt">
        {hoveredTarget.isRead ? (
          <Trophy size={18} className="prompt-icon text-gold" />
        ) : (
          <BookOpen size={18} className="prompt-icon text-terracotta" />
        )}
        <span>
          <span className="badge-status">{hoveredTarget.isRead ? 'Leído' : 'Por leer'}:</span>
          {' '}<strong>{hoveredTarget.title}</strong> [E o Clic: Leer]
        </span>
      </div>
    );
  }

  return null;
}
