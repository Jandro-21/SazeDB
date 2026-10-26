import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useLibrary } from '../../context/LibraryContext';

export function DeskSetup() {
  const { books, openComputer, setHoveredTarget } = useLibrary();
  const screenCanvasRef = useRef(document.createElement('canvas'));
  const screenTextureRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  // Inicializar canvas de la pantalla del ordenador
  useEffect(() => {
    const canvas = screenCanvasRef.current;
    canvas.width = 512;
    canvas.height = 384;
    screenTextureRef.current = new THREE.CanvasTexture(canvas);
  }, []);

  // Actualizar textura de la pantalla cuando cambie la biblioteca o hover
  useEffect(() => {
    const canvas = screenCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const total = books.length;
    const unread = books.filter(b => !b.isRead).length;
    const read = books.filter(b => b.isRead).length;

    // Fondo tipo monitor retro cálido
    ctx.fillStyle = hovered ? '#1f2a33' : '#141c22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Barra superior
    ctx.fillStyle = '#2a3b47';
    ctx.fillRect(0, 0, canvas.width, 42);

    ctx.fillStyle = '#64dfdf';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText('SazeOS 4.0 — SazeDB', 20, 27);

    // Contenido
    ctx.fillStyle = '#f8f9fa';
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Cobrememoria de Libros', 30, 95);

    ctx.fillStyle = '#b8c5ce';
    ctx.font = '16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Archivos preservados en LocalStorage & IDB', 30, 126);

    // Tarjetas de métricas
    ctx.fillStyle = '#1c2830';
    ctx.fillRect(30, 155, 130, 90);
    ctx.fillStyle = '#c4683c';
    ctx.font = 'bold 36px "JetBrains Mono", monospace';
    ctx.fillText(String(total), 50, 205);
    ctx.fillStyle = '#e8d5c4';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('TOTAL', 50, 230);

    ctx.fillStyle = '#1c2830';
    ctx.fillRect(180, 155, 130, 90);
    ctx.fillStyle = '#e76f51';
    ctx.font = 'bold 36px "JetBrains Mono", monospace';
    ctx.fillText(String(unread), 200, 205);
    ctx.fillStyle = '#e8d5c4';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('POR LEER', 200, 230);

    ctx.fillStyle = '#1c2830';
    ctx.fillRect(330, 155, 130, 90);
    ctx.fillStyle = '#2a9d8f';
    ctx.font = 'bold 36px "JetBrains Mono", monospace';
    ctx.fillText(String(read), 350, 205);
    ctx.fillStyle = '#e8d5c4';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('LEÍDOS', 350, 230);

    // Botón de llamada a la acción
    ctx.fillStyle = hovered ? '#e76f51' : '#c4683c';
    ctx.fillRect(30, 280, canvas.width - 60, 56);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▶ Abrir Gestor de Biblioteca [E]', canvas.width / 2, 315);
    ctx.textAlign = 'left';

    if (screenTextureRef.current) {
      screenTextureRef.current.needsUpdate = true;
    }
  }, [books, hovered]);

  // Materiales de escritorio y periféricos
  const deskMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#462e1e',
    roughness: 0.7,
    metalness: 0.05
  }), []);

  const legMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#222222',
    roughness: 0.5,
    metalness: 0.8
  }), []);

  const monitorCaseMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#252525',
    roughness: 0.6,
    metalness: 0.2
  }), []);

  const screenMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: screenTextureRef.current
    });
  }, [screenTextureRef.current]);

  // Posición del escritorio: en la esquina derecha de la habitación
  const deskX = 3.6;
  const deskZ = -3.2;

  return (
    <group position={[deskX, 0, deskZ]} rotation={[0, -Math.PI / 4, 0]}>
      {/* Tablero del escritorio */}
      <mesh position={[0, 1.15, 0]} material={deskMaterial}>
        <boxGeometry args={[2.8, 0.1, 1.4]} />
      </mesh>

      {/* 4 Patas */}
      <mesh position={[-1.25, 0.55, -0.55]} material={legMaterial}>
        <cylinderGeometry args={[0.04, 0.04, 1.1, 12]} />
      </mesh>
      <mesh position={[1.25, 0.55, -0.55]} material={legMaterial}>
        <cylinderGeometry args={[0.04, 0.04, 1.1, 12]} />
      </mesh>
      <mesh position={[-1.25, 0.55, 0.55]} material={legMaterial}>
        <cylinderGeometry args={[0.04, 0.04, 1.1, 12]} />
      </mesh>
      <mesh position={[1.25, 0.55, 0.55]} material={legMaterial}>
        <cylinderGeometry args={[0.04, 0.04, 1.1, 12]} />
      </mesh>

      {/* Torre PC */}
      <mesh position={[1.05, 0.45, 0]} material={legMaterial}>
        <boxGeometry args={[0.42, 0.8, 0.7]} />
      </mesh>

      {/* Monitor: Base */}
      <mesh position={[0, 1.23, -0.2]} material={monitorCaseMaterial}>
        <cylinderGeometry args={[0.26, 0.3, 0.06, 24]} />
      </mesh>
      {/* Monitor: Cuello */}
      <mesh position={[0, 1.4, -0.25]} material={monitorCaseMaterial}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 16]} />
      </mesh>
      {/* Monitor: Marco */}
      <mesh position={[0, 1.75, -0.15]} material={monitorCaseMaterial}>
        <boxGeometry args={[1.65, 1.15, 0.14]} />
      </mesh>

      {/* Monitor: Pantalla interactiva (clickable) */}
      <mesh
        position={[0, 1.75, -0.07]}
        material={screenMaterial}
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
        <planeGeometry args={[1.5, 1.0]} />
      </mesh>

      {/* Teclado */}
      <mesh position={[0, 1.21, 0.25]} material={legMaterial}>
        <boxGeometry args={[0.9, 0.03, 0.3]} />
      </mesh>

      {/* Ratón */}
      <mesh position={[0.62, 1.21, 0.25]} material={legMaterial}>
        <boxGeometry args={[0.12, 0.03, 0.18]} />
      </mesh>

      {/* Silla */}
      <group position={[0, 0, 0.95]}>
        <mesh position={[0, 0.7, 0]} material={deskMaterial}>
          <boxGeometry args={[0.7, 0.08, 0.7]} />
        </mesh>
        <mesh position={[0, 1.15, 0.32]} material={deskMaterial}>
          <boxGeometry args={[0.7, 0.8, 0.08]} />
        </mesh>
        <mesh position={[0, 0.35, 0]} material={legMaterial}>
          <cylinderGeometry args={[0.06, 0.06, 0.7, 12]} />
        </mesh>
      </group>
    </group>
  );
}
