import React from 'react';
import { Canvas } from '@react-three/fiber';
import { LibraryProvider } from './context/LibraryContext';
import { Scene } from './components/3d/Scene';
import { Crosshair } from './components/ui/Crosshair';
import { InteractionPrompt } from './components/ui/InteractionPrompt';
import { Blocker } from './components/ui/Blocker';
import { PauseMenu } from './components/ui/PauseMenu';
import { ComputerModal } from './components/ui/ComputerModal';
import { ReaderModal } from './components/ui/ReaderModal';
import { MobileControls } from './components/ui/MobileControls';

export function AppContent() {
  return (
    <div className="app-container">
      {/* Lienzo 3D con React Three Fiber */}
      <div id="canvas-container">
        <Canvas
          camera={{ position: [0, 1.7, 2.5], fov: 70 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: false,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true
          }}
        >
          <Scene />
        </Canvas>
      </div>

      {/* Capas de Interfaz de Usuario */}
      <Crosshair />
      <InteractionPrompt />
      <MobileControls />
      <Blocker />
      <PauseMenu />
      <ComputerModal />
      <ReaderModal />
    </div>
  );
}

export default function App() {
  return (
    <LibraryProvider>
      <AppContent />
    </LibraryProvider>
  );
}
