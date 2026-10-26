import React, { useMemo } from 'react';
import * as THREE from 'three';

function createBannerTexture(title) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#22150d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#c49a45';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.fillStyle = '#fff4e3';
  ctx.font = 'bold 38px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, canvas.width / 2, canvas.height / 2);

  return new THREE.CanvasTexture(canvas);
}

export function Bookshelf({ position = [0, 0, 0], rotation = [0, 0, 0], title = 'ESTANTERÍA' }) {
  const woodMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#342217',
    roughness: 0.78,
    metalness: 0.08
  }), []);

  const bannerTexture = useMemo(() => createBannerTexture(title), [title]);

  const bannerMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: bannerTexture,
    roughness: 0.5,
    metalness: 0.1
  }), [bannerTexture]);

  const shelfWidth = 5.4;
  const shelfDepth = 1.2;
  const shelfThickness = 0.12;
  const shelfHeight = 5.4;

  return (
    <group position={position} rotation={rotation}>
      {/* Panel Trasero */}
      <mesh position={[0, shelfHeight / 2, -shelfDepth / 2 + 0.05]} material={woodMaterial}>
        <boxGeometry args={[shelfWidth, shelfHeight, 0.1]} />
      </mesh>

      {/* Lateral Izquierdo */}
      <mesh position={[-shelfWidth / 2 + 0.06, shelfHeight / 2, 0]} material={woodMaterial}>
        <boxGeometry args={[shelfThickness, shelfHeight, shelfDepth]} />
      </mesh>

      {/* Lateral Derecho */}
      <mesh position={[shelfWidth / 2 - 0.06, shelfHeight / 2, 0]} material={woodMaterial}>
        <boxGeometry args={[shelfThickness, shelfHeight, shelfDepth]} />
      </mesh>

      {/* Panel Superior */}
      <mesh position={[0, shelfHeight - 0.06, 0]} material={woodMaterial}>
        <boxGeometry args={[shelfWidth, shelfThickness, shelfDepth]} />
      </mesh>

      {/* Panel Inferior */}
      <mesh position={[0, 0.06, 0]} material={woodMaterial}>
        <boxGeometry args={[shelfWidth, shelfThickness, shelfDepth]} />
      </mesh>

      {/* Balda 1 (inferior) */}
      <mesh position={[0, 0.92, 0]} material={woodMaterial}>
        <boxGeometry args={[shelfWidth - 0.2, shelfThickness, shelfDepth - 0.1]} />
      </mesh>

      {/* Balda 2 (media) */}
      <mesh position={[0, 2.42, 0]} material={woodMaterial}>
        <boxGeometry args={[shelfWidth - 0.2, shelfThickness, shelfDepth - 0.1]} />
      </mesh>

      {/* Balda 3 (alta) */}
      <mesh position={[0, 3.92, 0]} material={woodMaterial}>
        <boxGeometry args={[shelfWidth - 0.2, shelfThickness, shelfDepth - 0.1]} />
      </mesh>

      {/* Placa / Cartel del Título arriba */}
      <mesh position={[0, shelfHeight + 0.28, shelfDepth / 2 - 0.05]} material={bannerMaterial}>
        <boxGeometry args={[3.2, 0.72, 0.1]} />
      </mesh>
    </group>
  );
}
