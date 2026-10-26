import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useLibrary } from '../../context/LibraryContext';
import { Bookshelf } from './Bookshelf';
import { Book3D } from './Book3D';
import { DeskSetup } from './DeskSetup';
import { Player } from './Player';

export function Scene() {
  const { books } = useLibrary();

  // Separar libros por estantería para calcular su índice en la balda
  const unreadBooks = useMemo(() => books.filter(b => !b.isRead), [books]);
  const readBooks = useMemo(() => books.filter(b => b.isRead), [books]);

  // Materiales de la habitación
  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#442d1f',
    roughness: 0.85,
    metalness: 0.05
  }), []);

  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#34261e',
    roughness: 0.95,
    metalness: 0.0
  }), []);

  const ceilingMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1e1612',
    roughness: 0.9,
    metalness: 0.0
  }), []);

  return (
    <>
      {/* Niebla cálida */}
      <fogExp2 attach="fog" args={['#1c1612', 0.045]} />

      {/* Iluminación */}
      <ambientLight intensity={0.85} color="#ffe8d6" />
      <directionalLight position={[5, 8, 5]} intensity={1.1} color="#fff1e6" />
      <pointLight position={[0, 4.5, 0]} intensity={0.65} color="#ffb703" distance={15} />
      <pointLight position={[3.6, 2.5, -3.2]} intensity={0.5} color="#64dfdf" distance={5} />

      {/* Suelo */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={floorMaterial}>
        <planeGeometry args={[16, 16]} />
      </mesh>

      {/* Techo */}
      <mesh position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} material={ceilingMaterial}>
        <planeGeometry args={[16, 16]} />
      </mesh>

      {/* Pared Trasera (z = -6) */}
      <mesh position={[0, 3, -6]} material={wallMaterial}>
        <planeGeometry args={[16, 6]} />
      </mesh>

      {/* Pared Delantera (z = 6) */}
      <mesh position={[0, 3, 6]} rotation={[0, Math.PI, 0]} material={wallMaterial}>
        <planeGeometry args={[16, 6]} />
      </mesh>

      {/* Pared Izquierda (x = -6) */}
      <mesh position={[-6, 3, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial}>
        <planeGeometry args={[16, 6]} />
      </mesh>

      {/* Pared Derecha (x = 6) */}
      <mesh position={[6, 3, 0]} rotation={[0, -Math.PI / 2, 0]} material={wallMaterial}>
        <planeGeometry args={[16, 6]} />
      </mesh>

      {/* Estantería 1: POR LEER (Pared Trasera) */}
      <Bookshelf position={[0, 0, -5.2]} rotation={[0, 0, 0]} title="POR LEER" />

      {/* Estantería 2: LIBROS LEÍDOS (Pared Izquierda) */}
      <Bookshelf position={[-5.2, 0, 0]} rotation={[0, Math.PI / 2, 0]} title="LIBROS LEÍDOS" />

      {/* Escritorio y Ordenador de Gestión */}
      <DeskSetup />

      {/* Libros en 3D */}
      {unreadBooks.map((book, index) => (
        <Book3D key={book.id} book={book} indexOnShelf={index} />
      ))}
      {readBooks.map((book, index) => (
        <Book3D key={book.id} book={book} indexOnShelf={index} />
      ))}

      {/* Controlador de Jugador en Primera Persona */}
      <Player />
    </>
  );
}
