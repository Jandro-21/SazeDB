import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useLibrary } from '../../context/LibraryContext';

export function Player() {
  const { camera, scene } = useThree();
  const controlsRef = useRef();
  const {
    hasGameStarted,
    isComputerOpen,
    activeReaderBook,
    isPauseOpen,
    isTransitioning,
    openPause,
    openReader,
    openComputer,
    setHoveredTarget
  } = useLibrary();

  // Teclas de movimiento
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false
  });

  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());
  const centerCoord = useRef(new THREE.Vector2(0, 0));

  // Manejador de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Si está en campos de texto, no mover el personaje
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      // Dentro de modales o pausa, no procesar movimiento
      if (isComputerOpen || activeReaderBook || isPauseOpen) {
        return;
      }

      switch (e.code) {
        case 'KeyW': case 'ArrowUp': setKeys(k => ({ ...k, forward: true })); break;
        case 'KeyS': case 'ArrowDown': setKeys(k => ({ ...k, backward: true })); break;
        case 'KeyA': case 'ArrowLeft': setKeys(k => ({ ...k, left: true })); break;
        case 'KeyD': case 'ArrowRight': setKeys(k => ({ ...k, right: true })); break;
        case 'ShiftLeft': case 'ShiftRight': setKeys(k => ({ ...k, sprint: true })); break;
        case 'KeyE': triggerCenterInteraction(); break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': setKeys(k => ({ ...k, forward: false })); break;
        case 'KeyS': case 'ArrowDown': setKeys(k => ({ ...k, backward: false })); break;
        case 'KeyA': case 'ArrowLeft': setKeys(k => ({ ...k, left: false })); break;
        case 'KeyD': case 'ArrowRight': setKeys(k => ({ ...k, right: false })); break;
        case 'ShiftLeft': case 'ShiftRight': setKeys(k => ({ ...k, sprint: false })); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isComputerOpen, activeReaderBook, isPauseOpen]);

  // Interacción central con E o Clic
  const triggerCenterInteraction = () => {
    raycaster.current.setFromCamera(centerCoord.current, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    for (let i = 0; i < intersects.length; i++) {
      const hit = intersects[i];
      if (hit.distance > 4.6) break;

      let obj = hit.object;
      while (obj) {
        if (obj.userData?.isBook) {
          openReader(obj.userData.id);
          return;
        }
        if (obj.userData?.isComputer) {
          openComputer();
          return;
        }
        obj = obj.parent;
      }
    }
  };

  // Click del ratón en primera persona
  useEffect(() => {
    const handleMouseDown = () => {
      if (controlsRef.current?.isLocked && !isComputerOpen && !activeReaderBook && !isPauseOpen) {
        triggerCenterInteraction();
      }
    };
    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [isComputerOpen, activeReaderBook, isPauseOpen]);

  // Manejo de eventos de bloqueo / desbloqueo de puntero
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleUnlock = () => {
      setKeys({ forward: false, backward: false, left: false, right: false, sprint: false });

      if (isComputerOpen || activeReaderBook || isTransitioning) {
        return;
      }

      if (hasGameStarted) {
        openPause();
      }
    };

    controls.addEventListener('unlock', handleUnlock);
    return () => controls.removeEventListener('unlock', handleUnlock);
  }, [hasGameStarted, isComputerOpen, activeReaderBook, isTransitioning, openPause]);

  // Auto-bloqueo al iniciar o reanudar
  useEffect(() => {
    if (hasGameStarted && !isComputerOpen && !activeReaderBook && !isPauseOpen && !isTransitioning) {
      if (controlsRef.current && !controlsRef.current.isLocked) {
        try {
          controlsRef.current.lock();
        } catch (e) {}
      }
    }
  }, [hasGameStarted, isComputerOpen, activeReaderBook, isPauseOpen, isTransitioning]);

  // Físicas y Raycasting en useFrame
  useFrame((state, delta) => {
    const canMove = controlsRef.current?.isLocked;
    const clampedDelta = Math.min(delta, 0.1);

    if (canMove) {
      // Amortiguación
      velocity.current.x -= velocity.current.x * 10.0 * clampedDelta;
      velocity.current.z -= velocity.current.z * 10.0 * clampedDelta;

      direction.current.z = Number(keys.forward) - Number(keys.backward);
      direction.current.x = Number(keys.right) - Number(keys.left);
      direction.current.normalize();

      const speed = keys.sprint ? 38.0 : 20.0;
      if (keys.forward || keys.backward) velocity.current.z -= direction.current.z * speed * clampedDelta;
      if (keys.left || keys.right) velocity.current.x -= direction.current.x * speed * clampedDelta;

      controlsRef.current.moveRight(-velocity.current.x * clampedDelta);
      controlsRef.current.moveForward(-velocity.current.z * clampedDelta);

      // Límites de la habitación
      const pos = camera.position;
      pos.x = Math.max(-5.8, Math.min(5.8, pos.x));
      pos.z = Math.max(-5.8, Math.min(5.8, pos.z));
      pos.y = 1.7; // Altura de ojos fija

      // Efecto sutil de FOV dinámico al esprintar
      const isMoving = keys.forward || keys.backward || keys.left || keys.right;
      const targetFov = (keys.sprint && isMoving) ? 78 : 70;
      if (Math.abs(camera.fov - targetFov) > 0.1) {
        camera.fov += (targetFov - camera.fov) * 0.15;
        camera.updateProjectionMatrix();
      }

      // Raycasting continuo para el puntero central HUD
      raycaster.current.setFromCamera(centerCoord.current, camera);
      const intersects = raycaster.current.intersectObjects(scene.children, true);
      let detectedTarget = null;

      for (let i = 0; i < intersects.length; i++) {
        const hit = intersects[i];
        if (hit.distance > 4.6) break;

        let obj = hit.object;
        while (obj) {
          if (obj.userData?.isBook) {
            detectedTarget = {
              type: 'book',
              id: obj.userData.id,
              title: obj.userData.title,
              isRead: obj.userData.isRead
            };
            break;
          }
          if (obj.userData?.isComputer) {
            detectedTarget = { type: 'computer' };
            break;
          }
          obj = obj.parent;
        }
        if (detectedTarget) break;
      }

      setHoveredTarget(detectedTarget);
    }
  });

  return <PointerLockControls ref={controlsRef} />;
}
