import React, { useState } from 'react';
import { Play, Gamepad2, ArrowLeft, Pause } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';

export function PauseMenu() {
  const { isPauseOpen, closePause } = useLibrary();
  const [showControls, setShowControls] = useState(false);

  if (!isPauseOpen) return null;

  return (
    <div id="pause-menu">
      <div className="pause-card">
        {!showControls ? (
          <div id="pause-main-view">
            <div className="pause-header">
              <div className="pause-icon-badge">
                <Pause size={28} />
              </div>
              <h2>MENÚ DE PAUSA</h2>
              <span className="pause-subtitle">SazeDB — Entorno 3D</span>
            </div>

            <div className="pause-actions">
              <button type="button" className="pause-btn pause-btn-continue" onClick={closePause}>
                <Play size={18} />
                <span>Continuar</span>
              </button>

              <button type="button" className="pause-btn pause-btn-secondary" onClick={() => setShowControls(true)}>
                <Gamepad2 size={18} />
                <span>Controles</span>
              </button>

              <a
                href="https://github.com/Jandro-21/SazeDB"
                target="_blank"
                rel="noopener noreferrer"
                className="pause-btn pause-btn-github"
              >
                <svg className="github-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </a>
            </div>

            <div className="pause-credits">
              <p>Proyecto SazeDB creado por <strong>Jandro-21</strong> usando <strong>Google Antigravity</strong>, proyecto Open Source impulsado por IA con LocalStorage y IndexedDB proyecto bajo licencia MIT</p>
            </div>
          </div>
        ) : (
          <div id="pause-controls-view">
            <div className="pause-header">
              <div className="pause-icon-badge">
                <Gamepad2 size={28} />
              </div>
              <h2>CONTROLES</h2>
              <span className="pause-subtitle">Guía de interacción</span>
            </div>

            <div className="controls-guide">
              <div><span className="key-badge">W</span><span className="key-badge">A</span><span className="key-badge">S</span><span className="key-badge">D</span> Moverte por la habitación</div>
              <div><span class="key-badge">Ratón</span> Mirar alrededor y apuntar</div>
              <div><span className="key-badge">Shift</span> Mantener pulsado para correr</div>
              <div><span className="key-badge">E</span> o <span className="key-badge">Clic</span> Usar ordenador / Leer libro</div>
              <div><span className="key-badge">ESC</span> Menú de pausa</div>
            </div>

            <button type="button" className="pause-btn pause-btn-back" onClick={() => setShowControls(false)}>
              <ArrowLeft size={18} />
              <span>Volver al Menú</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
