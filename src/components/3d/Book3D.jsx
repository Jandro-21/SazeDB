import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createSpineTexture, createCoverCanvasTexture, createPagesTexture } from '../../utils/textureGenerator';
import { useLibrary } from '../../context/LibraryContext';

export function computeBookTransform(indexOnShelf, isRead) {
  const spacing = 0.44;
  const maxPerShelf = 8;
  const col = indexOnShelf % maxPerShelf;
  const row = Math.floor(indexOnShelf / maxPerShelf);
  const y = 1.0 + (row * 1.5);

  if (!isRead) {
    const startX = -2.0;
    return {
      position: [startX + (col * spacing), y, -5.0],
      rotation: [0, 0, 0]
    };
  } else {
    const startZ = -2.0;
    return {
      position: [-5.0, y, startZ + (col * spacing)],
      rotation: [0, Math.PI / 2, 0]
    };
  }
}

export function Book3D({ book, indexOnShelf }) {
  const meshRef = useRef();
  const { openReader, setHoveredTarget } = useLibrary();
  const [hovered, setHovered] = useState(false);

  // Calcular objetivo de posición y rotación
  const target = useMemo(() => {
    return computeBookTransform(indexOnShelf, book.isRead);
  }, [indexOnShelf, book.isRead]);

  // Cargar portada personalizada o textura canvas
  const coverTexture = useMemo(() => {
    if (book.coverImage) {
      const loader = new THREE.TextureLoader();
      return loader.load(book.coverImage);
    }
    return createCoverCanvasTexture(book.title, book.author, book.color);
  }, [book.coverImage, book.title, book.author, book.color]);

  const spineTexture = useMemo(() => {
    return createSpineTexture(book.title, book.author, book.color);
  }, [book.title, book.author, book.color]);

  const pagesTexture = useMemo(() => {
    return createPagesTexture();
  }, []);

  // Materiales de las 6 caras de la caja
  // BoxGeometry caras: +X (cubierta derecha), -X (lomo), +Y (páginas arriba), -Y (páginas abajo), +Z (portada), -Z (contraportada)
  const materials = useMemo(() => {
    const baseColor = new THREE.Color(book.color || '#c4683c');
    const spineMat = new THREE.MeshStandardMaterial({
      map: spineTexture,
      roughness: 0.6,
      metalness: 0.1
    });

    const coverMat = new THREE.MeshStandardMaterial({
      map: coverTexture,
      roughness: 0.5,
      metalness: 0.15
    });

    const backCoverMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.6,
      metalness: 0.1
    });

    const pagesMat = new THREE.MeshStandardMaterial({
      map: pagesTexture,
      roughness: 0.9,
      metalness: 0.0
    });

    return [
      pagesMat,      // +X
      spineMat,      // -X (lomo)
      pagesMat,      // +Y
      pagesMat,      // -Y
      coverMat,      // +Z (portada)
      backCoverMat   // -Z
    ];
  }, [spineTexture, coverTexture, pagesTexture, book.color]);

  // Animación suave de desplazamiento hacia su estante correspondiente
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;

    // Posición
    mesh.position.lerp(new THREE.Vector3(...target.position), 0.12);

    // Rotación
    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(...target.rotation));
    mesh.quaternion.slerp(targetQuat, 0.12);

    // Resaltado sutil al apuntar
    const targetScale = hovered ? 1.05 : 1.0;
    mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
  });

  return (
    <mesh
      ref={meshRef}
      position={target.position}
      rotation={target.rotation}
      material={materials}
      userData={{ isBook: true, id: book.id, title: book.title, isRead: book.isRead }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        setHoveredTarget({
          type: 'book',
          id: book.id,
          title: book.title,
          isRead: book.isRead
        });
      }}
      onPointerOut={() => {
        setHovered(false);
        setHoveredTarget(prev => (prev?.id === book.id ? null : prev));
      }}
      onClick={(e) => {
        e.stopPropagation();
        openReader(book.id);
      }}
    >
      <boxGeometry args={[0.34, 1.45, 1.05]} />
    </mesh>
  );
}
