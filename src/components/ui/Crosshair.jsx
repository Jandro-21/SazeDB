import React from 'react';
import { useLibrary } from '../../context/LibraryContext';

export function Crosshair() {
  const { hasGameStarted, hoveredTarget, isComputerOpen, activeReaderBook, isPauseOpen } = useLibrary();

  if (!hasGameStarted || isComputerOpen || activeReaderBook || isPauseOpen) {
    return null;
  }

  return (
    <div className={`crosshair ${hoveredTarget ? 'active' : ''}`} />
  );
}
