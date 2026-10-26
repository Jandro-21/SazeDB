import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createSpineTexture, createCoverCanvasTexture, createPagesTexture } from '../../utils/textureGenerator';
import { useLibrary } from '../../context/LibraryContext';

export function computeBookTransform(indexOnShelf, isRead, totalCount = 1) {
  const spacing = 0.11;
  const maxPerRow = 24;
  const row = Math.floor(indexOnShelf / maxPerRow);
  const col = indexOnShelf % maxPerRow;

  // Baldas: 1.70 (media), 2.33 (alta), 1.07 (baja)
  const shelfYList = [1.70, 2.33, 1.07];
  const y = shelfYList[row % shelfYList.length];

  const visibleInRow = Math.min(totalCount - (row * maxPerRow), maxPerRow);
  const startOffset = -((Math.max(1, visibleInRow) - 1) * spacing) / 2;

  if (!isRead) {
    // Estantería de Por Leer (Pared trasera: Z = -6.3)
    return {
      position: [startOffset + (col * spacing), y, -6.29],
      rotation: [0, 0, 0]
    };
  } else {
    // Estantería de Libros Leídos (Pared izquierda: X = -6.3)
    return {
      position: [-6.29, y, startOffset + (col * spacing)],
      rotation: [0, Math.PI / 2, 0]
    };
  }
}

export function Book3D({ book, indexOnShelf, totalInShelf = 1 }) {
  const meshRef = useRef();
  const { openReader, setHoveredTarget } = useLibrary();
  const [hovered, setHovered] = useState(false);

  // Calcular objetivo de posición y rotación base
  const baseTransform = useMemo(() => {
    return computeBookTransform(indexOnShelf, book.isRead, totalInShelf);
  }, [indexOnShelf, book.isRead, totalInShelf]);

  // Cargar portada personalizada o textura canvas
  const coverTexture = useMemo(() => {
    if (book.coverImage) {
      const loader = new THREE.TextureLoader();
      const tex = loader.load(book.coverImage);
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return tex;
    }
    return createCoverCanvasTexture(book.title, book.author, book.color);
  }, [book.coverImage, book.title, book.author, book.color]);

  const spineTexture = useMemo(() => {
    return createSpineTexture(book.title, book.author, book.color);
  }, [book.title, book.author, book.color]);

  const pagesTexture = useMemo(() => {
    return createPagesTexture();
  }, []);

  // Materiales de las 6 caras del libro:
  // [0: front (+X), 1: backCover (-X), 2: pagesTop (+Y), 3: pagesBottom (-Y), 4: spine (+Z), 5: pagesFore (-Z)]
  const materials = useMemo(() => {
    const baseColor = new THREE.Color(book.color || '#c4683c');

    const spineMat = new THREE.MeshStandardMaterial({
      map: spineTexture,
      roughness: 0.5,
      metalness: 0.08
    });

    const frontMat = new THREE.MeshStandardMaterial({
      map: coverTexture,
      roughness: 0.5,
      metalness: 0.08
    });

    const backCoverMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.55,
      metalness: 0.08
    });

    const pagesMat = new THREE.MeshStandardMaterial({
      map: pagesTexture,
      roughness: 0.9,
      metalness: 0.0
    });

    return [
      frontMat,     // +X (portada derecha)
      backCoverMat, // -X (contraportada izquierda)
      pagesMat,     // +Y (borde superior páginas)
      pagesMat,     // -Y (borde inferior páginas apoyado en balda)
      spineMat,     // +Z (lomo con título visible hacia la habitación)
      pagesMat      // -Z (corte de páginas hacia el fondo del mueble)
    ];
  }, [spineTexture, coverTexture, pagesTexture, book.color]);

  // Animación suave de desplazamiento hacia su balda con leve extracción al apuntar
  useFrame(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;

    const targetPos = [...baseTransform.position];
    // Al hacer hover, el libro se asoma sutilmente hacia el jugador
    if (hovered) {
      if (!book.isRead) {
        targetPos[2] += 0.05; // Asomarse en +Z
      } else {
        targetPos[0] += 0.05; // Asomarse en +X
      }
    }

    mesh.position.lerp(new THREE.Vector3(...targetPos), 0.12);

    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(...baseTransform.rotation));
    mesh.quaternion.slerp(targetQuat, 0.12);
  });

  return (
    <mesh
      ref={meshRef}
      position={baseTransform.position}
      rotation={baseTransform.rotation}
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
      <boxGeometry args={[0.08, 0.44, 0.32]} />
    </mesh>
  );
}
