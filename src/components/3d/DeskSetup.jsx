import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useLibrary } from '../../context/LibraryContext';

export function DeskSetup() {
  const { books, openComputer, setHoveredTarget } = useLibrary();
  const screenCanvasRef = useRef(document.createElement('canvas'));
  const screenTextureRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  // Inicializar canvas de la pantalla del monitor
  useEffect(() => {
    const canvas = screenCanvasRef.current;
    canvas.width = 512;
    canvas.height = 340;
    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    screenTextureRef.current = tex;
  }, []);

  // Actualizar textura de la pantalla cuando cambie la biblioteca o hover
  useEffect(() => {
    const canvas = screenCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const total = books.length;
    const unread = books.filter(b => !b.isRead).length;
    const read = books.filter(b => b.isRead).length;

    // Fondo retro-futurista limpio
    ctx.fillStyle = hovered ? '#1f2b35' : '#141c22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Barra superior estilo SazeOS
    ctx.fillStyle = '#22323e';
    ctx.fillRect(0, 0, canvas.width, 36);

    ctx.fillStyle = '#64dfdf';
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillText('SazeOS 4.0 — SazeDB', 16, 23);

    // Contenido
    ctx.fillStyle = '#f8f9fa';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Cobrememoria de Libros', 24, 82);

    ctx.fillStyle = '#b8c5ce';
    ctx.font = '14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Archivos preservados en LocalStorage & IDB', 24, 108);

    // Métricas en 3 tarjetas
    const cards = [
      { label: 'TOTAL', val: total, color: '#c4683c', x: 24 },
      { label: 'POR LEER', val: unread, color: '#e76f51', x: 180 },
      { label: 'LEÍDOS', val: read, color: '#2a9d8f', x: 336 }
    ];

    cards.forEach(c => {
      ctx.fillStyle = '#1b262e';
      ctx.fillRect(c.x, 136, 126, 76);
      ctx.fillStyle = c.color;
      ctx.font = 'bold 30px "JetBrains Mono", monospace';
      ctx.fillText(String(c.val), c.x + 18, 178);
      ctx.fillStyle = '#e8d5c4';
      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(c.label, c.x + 18, 198);
    });

    // Botón de acción interactivo
    ctx.fillStyle = hovered ? '#e76f51' : '#c4683c';
    ctx.fillRect(24, 240, canvas.width - 48, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Abrir Gestor de Libros [E / Clic]', canvas.width / 2, 272);
    ctx.textAlign = 'left';

    if (screenTextureRef.current) {
      screenTextureRef.current.needsUpdate = true;
    }
  }, [books, hovered]);

  // Materiales
  const deskWoodMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#3d2518',
    roughness: 0.55,
    metalness: 0.05
  }), []);

  const metalMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1a1a',
    roughness: 0.4,
    metalness: 0.6
  }), []);

  const chairWood = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2b1c13',
    roughness: 0.6
  }), []);

  const lampMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c4683c',
    roughness: 0.35,
    metalness: 0.2
  }), []);

  const screenMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: screenTextureRef.current
    });
  }, [screenTextureRef.current]);

  return (
    <group position={[4.8, 0, 0]}>
      {/* Tablero del escritorio */}
      <mesh position={[0, 0.85, 0]} material={deskWoodMat}>
        <boxGeometry args={[1.6, 0.08, 2.5]} />
      </mesh>

      {/* 4 Patas */}
      {[
        [-0.7, 0.425, -1.15],
        [0.7, 0.425, -1.15],
        [-0.7, 0.425, 1.15],
        [0.7, 0.425, 1.15]
      ].map(([x, y, z], idx) => (
        <mesh key={idx} position={[x, y, z]} material={deskWoodMat}>
          <boxGeometry args={[0.08, 0.85, 0.08]} />
        </mesh>
      ))}

      {/* Monitor: Base cilíndrica */}
      <mesh position={[0.4, 0.89, 0]} material={metalMat}>
        <cylinderGeometry args={[0.18, 0.2, 0.02, 16]} />
      </mesh>

      {/* Monitor: Brazo */}
      <mesh position={[0.4, 1.05, 0]} material={metalMat}>
        <boxGeometry args={[0.04, 0.35, 0.06]} />
      </mesh>

      {/* Monitor: Marco */}
      <mesh position={[0.4, 1.35, 0]} material={metalMat}>
        <boxGeometry args={[0.06, 0.72, 1.1]} />
      </mesh>

      {/* Monitor: Pantalla interactiva orientada hacia el centro (-X) */}
      <mesh
        position={[0.36, 1.35, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        material={screenMat}
        userData={{ isComputer: true }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          setHoveredTarget({ type: 'computer' });
        }}
        onPointerOut={() => {
          setHovered(false);
          setHoveredTarget(prev => (prev?.type === 'computer' ? null : prev));
        }}
        onClick={(e) => {
          e.stopPropagation();
          openComputer();
        }}
      >
        <planeGeometry args={[1.05, 0.68]} />
      </mesh>

      {/* Teclado */}
      <mesh position={[-0.1, 0.895, 0]} material={metalMat}>
        <boxGeometry args={[0.24, 0.02, 0.65]} />
      </mesh>

      {/* Ratón */}
      <mesh position={[-0.1, 0.895, 0.45]} material={metalMat}>
        <boxGeometry args={[0.12, 0.025, 0.08]} />
      </mesh>

      {/* Torre de la PC */}
      <mesh position={[0.4, 0.275, 1.0]} material={metalMat}>
        <boxGeometry args={[0.45, 0.55, 0.22]} />
      </mesh>

      {/* Lámpara de escritorio */}
      <mesh position={[0.4, 0.89, -0.85]} material={lampMat}>
        <cylinderGeometry args={[0.1, 0.12, 0.03, 16]} />
      </mesh>
      <mesh position={[0.2, 1.35, -0.85]} rotation={[0, 0, Math.PI / 4]} material={lampMat}>
        <coneGeometry args={[0.14, 0.18, 16]} />
      </mesh>
      <pointLight position={[0.1, 1.3, -0.85]} intensity={0.9} color="#ffdfb3" distance={4.5} />

      {/* Silla */}
      <mesh position={[-0.7, 0.48, 0]} material={chairWood}>
        <boxGeometry args={[0.65, 0.08, 0.65]} />
      </mesh>
      <mesh position={[-1.0, 0.8, 0]} material={chairWood}>
        <boxGeometry args={[0.08, 0.6, 0.65]} />
      </mesh>
      <mesh position={[-0.7, 0.24, 0]} material={metalMat}>
        <cylinderGeometry args={[0.04, 0.04, 0.48, 12]} />
      </mesh>
    </group>
  );
}
