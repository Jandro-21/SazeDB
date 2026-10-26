import React, { useMemo } from 'react';
import * as THREE from 'three';

function createBannerTexture(title) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#2b1a10';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.fillStyle = '#fff4db';
  ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, canvas.width / 2, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function Bookshelf({ position = [0, 0, 0], rotation = [0, 0, 0], title = 'ESTANTERÍA' }) {
  const woodMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#4a2c1d',
    roughness: 0.65,
    metalness: 0.08
  }), []);

  const bannerTexture = useMemo(() => createBannerTexture(title), [title]);

  const bannerMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    map: bannerTexture
  }), [bannerTexture]);

  // Libros decorativos secundarios en baldas inferior y superior
  const decorBooks = useMemo(() => {
    const colors = ['#5c3826', '#82442d', '#2e4134', '#78563a', '#364858', '#8a6240'];
    const items = [];
    const shelfYList = [0.85, 2.11]; // Baldas decorativas

    shelfYList.forEach((shelfY, sIdx) => {
      const startX = -2.7;
      for (let i = 0; i < 18; i++) {
        // Dejar algún pequeño hueco natural
        if (i === 9) continue;
        const tilt = (i === 4 || i === 13) ? -0.09 : (i === 11 ? 0.08 : 0);
        items.push({
          id: `decor_${sIdx}_${i}`,
          position: [startX + i * 0.31, shelfY + 0.20, -0.06],
          rotation: [0, 0, tilt],
          color: colors[(i + sIdx * 3) % colors.length]
        });
      }
    });
    return items;
  }, []);

  const shelfYPositions = [0.20, 0.82, 1.45, 2.08, 2.70];

  return (
    <group position={position} rotation={rotation}>
      {/* Panel Trasero */}
      <mesh position={[0, 1.6, -0.3]} material={woodMaterial}>
        <boxGeometry args={[6.6, 3.2, 0.1]} />
      </mesh>

      {/* Lateral Izquierdo */}
      <mesh position={[-3.3, 1.6, 0]} material={woodMaterial}>
        <boxGeometry args={[0.12, 3.2, 0.7]} />
      </mesh>

      {/* Lateral Derecho */}
      <mesh position={[3.3, 1.6, 0]} material={woodMaterial}>
        <boxGeometry args={[0.12, 3.2, 0.7]} />
      </mesh>

      {/* Baldas (5 estantes horizontales) */}
      {shelfYPositions.map((y, idx) => (
        <mesh key={idx} position={[0, y, 0]} material={woodMaterial}>
          <boxGeometry args={[6.6, 0.06, 0.7]} />
        </mesh>
      ))}

      {/* Cornisa Superior */}
      <mesh position={[0, 3.2, 0]} material={woodMaterial}>
        <boxGeometry args={[6.8, 0.12, 0.75]} />
      </mesh>

      {/* Placa Rotulada */}
      <mesh position={[0, 3.2, 0.38]} material={bannerMaterial}>
        <planeGeometry args={[2.4, 0.55]} />
      </mesh>

      {/* Libros Decorativos de Fondo */}
      {decorBooks.map((b) => (
        <mesh key={b.id} position={b.position} rotation={b.rotation}>
          <boxGeometry args={[0.065, 0.40, 0.28]} />
          <meshStandardMaterial color={b.color} roughness={0.65} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}
