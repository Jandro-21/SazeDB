import React from 'react';
import { Library, Play, Move, MousePointer, Gauge, Sparkles } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';

export function Blocker() {
  const { hasGameStarted, startGame } = useLibrary();

  if (hasGameStarted) return null;

  return (
    <div id="blocker">
      <div className="intro-card">
        <div className="intro-badge">
          <Library size={28} className="intro-icon" />
        </div>
        <h1>SazeDB</h1>
        <p id="intro-desc">
          Entorno 3D en primera persona para la preservación de conocimiento. Al igual que un Guardador de Terris almacena historias en sus mentes de metal, SazeDB guarda tus libros en las estanterías de <strong>Por Leer</strong> y <strong>Libros Leídos</strong>, permitiéndote adjuntar archivos PDF o EPUB y leerlos guardando tu progreso automáticamente en LocalStorage.
        </p>

        <div className="controls-guide">
          <div>
            <span className="key-badge">W</span>
            <span className="key-badge">A</span>
            <span className="key-badge">S</span>
            <span className="key-badge">D</span>
            Moverte por la habitación
          </div>
          <div>
            <span className="key-badge">Ratón</span>
            Mirar alrededor y apuntar
          </div>
          <div>
            <span className="key-badge">Shift</span>
            Mantener pulsado para correr
          </div>
          <div>
            <span className="key-badge">E</span> o <span className="key-badge">Clic</span>
            Usar ordenador / Leer libro
          </div>
          <div>
            <span className="key-badge">ESC</span>
            Menú de pausa
          </div>
        </div>

        <button type="button" className="start-btn" onClick={startGame}>
          <Play size={18} />
          <span>Entrar a la biblioteca</span>
        </button>
      </div>
    </div>
  );
}
