import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useLibrary } from '../../context/LibraryContext';
import { Bookshelf } from './Bookshelf';
import { Book3D } from './Book3D';
import { DeskSetup } from './DeskSetup';
import { Player } from './Player';

export function Scene() {
  const { books } = useLibrary();

  // Separar libros por estantería
  const unreadBooks = useMemo(() => books.filter(b => !b.isRead), [books]);
  const readBooks = useMemo(() => books.filter(b => b.isRead), [books]);

  // Materiales de la habitación clásica y luminosa
  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#6e4a30',
    roughness: 0.7,
    metalness: 0.05
  }), []);

  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#e8dfd2',
    roughness: 0.85,
    metalness: 0.0
  }), []);

  const ceilingMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#2e231c'
  }), []);

  const rugMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#8a4b2c',
    roughness: 0.95,
    metalness: 0.0
  }), []);

  return (
    <>
      {/* Niebla cálida sutil para profundidad */}
      <fogExp2 attach="fog" args={['#1e1814', 0.025]} />

      {/* Iluminación clara, acogedora y brillante */}
      <hemisphereLight color="#fff3e3" groundColor="#6e4a30" intensity={0.95} />
      <directionalLight position={[4, 7, 3]} intensity={0.8} color="#fffaed" />
      <pointLight position={[0, 3.4, 0]} intensity={1.2} color="#ffdfb3" distance={16} />

      {/* Lámpara de techo (Bombilla luminosa) */}
      <mesh position={[0, 3.4, 0]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshBasicMaterial color="#ffe8c2" />
      </mesh>

      {/* Suelo de madera de 14x14m */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={floorMaterial}>
        <planeGeometry args={[14, 14]} />
      </mesh>

      {/* Alfombra central de 6x6m */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={rugMaterial}>
        <planeGeometry args={[6, 6]} />
      </mesh>

      {/* Techo a 3.8m de altura */}
      <mesh position={[0, 3.8, 0]} rotation={[Math.PI / 2, 0, 0]} material={ceilingMaterial}>
        <planeGeometry args={[14, 14]} />
      </mesh>

      {/* Pared Trasera (z = -7) */}
      <mesh position={[0, 1.9, -7]} material={wallMaterial}>
        <planeGeometry args={[14, 3.8]} />
      </mesh>

      {/* Pared Delantera (z = 7) */}
      <mesh position={[0, 1.9, 7]} rotation={[0, Math.PI, 0]} material={wallMaterial}>
        <planeGeometry args={[14, 3.8]} />
      </mesh>

      {/* Pared Izquierda (x = -7) */}
      <mesh position={[-7, 1.9, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial}>
        <planeGeometry args={[14, 3.8]} />
      </mesh>

      {/* Pared Derecha (x = 7) */}
      <mesh position={[7, 1.9, 0]} rotation={[0, -Math.PI / 2, 0]} material={wallMaterial}>
        <planeGeometry args={[14, 3.8]} />
      </mesh>

      {/* Estantería 1: POR LEER (Pared trasera: Z = -6.3) */}
      <Bookshelf position={[0, 0, -6.3]} rotation={[0, 0, 0]} title="POR LEER" />

      {/* Estantería 2: LIBROS LEÍDOS (Pared izquierda: X = -6.3) */}
      <Bookshelf position={[-6.3, 0, 0]} rotation={[0, Math.PI / 2, 0]} title="LIBROS LEÍDOS" />

      {/* Escritorio y Monitor de Gestión (Pared derecha: X = 4.8) */}
      <DeskSetup />

      {/* Libros Interactivos 3D */}
      {unreadBooks.map((book, index) => (
        <Book3D
          key={book.id}
          book={book}
          indexOnShelf={index}
          totalInShelf={unreadBooks.length}
        />
      ))}
      {readBooks.map((book, index) => (
        <Book3D
          key={book.id}
          book={book}
          indexOnShelf={index}
          totalInShelf={readBooks.length}
        />
      ))}

      {/* Jugador en Primera Persona */}
      <Player />
    </>
  );
}
