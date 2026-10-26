import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import * as THREE from 'three';
import { useLibrary } from '../../context/LibraryContext';

export function Player() {
  const { camera, scene, gl } = useThree();
  const controlsRef = useRef(null);
  const {
    hasGameStarted,
    isComputerOpen,
    activeReaderBook,
    isPauseOpen,
    isTransitioning,
    openPause,
    openReader,
    openComputer,
    setHoveredTarget,
    cameraSensitivity,
    sprintSpeed,
    mobileMove,
    lockHubPointer,
    unlockHubPointer
  } = useLibrary();

  // Teclas de movimiento de teclado
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

  // Ángulos de cámara para móviles / táctil
  const cameraYaw = useRef(0);
  const cameraPitch = useRef(0);
  const touchStart = useRef({ x: 0, y: 0, active: false });

  // Determinar si estamos exclusivamente en el HUB 3D activo
  const isHubActive = hasGameStarted && !isComputerOpen && !activeReaderBook && !isPauseOpen && !isTransitioning;

  // Inicializar PointerLockControls nativo de Three.js (sin listeners automáticos indeseados)
  useEffect(() => {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch) return;

    const controls = new PointerLockControls(camera, gl.domElement);
    controls.pointerSpeed = cameraSensitivity || 1.0;
    controlsRef.current = controls;

    const handleUnlock = () => {
      setKeys({ forward: false, backward: false, left: false, right: false, sprint: false });
    };

    controls.addEventListener('unlock', handleUnlock);

    return () => {
      controls.removeEventListener('unlock', handleUnlock);
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl.domElement]);

  // Actualizar sensibilidad en tiempo real
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.pointerSpeed = cameraSensitivity || 1.0;
    }
  }, [cameraSensitivity]);

  // Auto-ocultar cursor al estar en el HUB y mostrarlo al salir a cualquier interactuable
  useEffect(() => {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch) return;

    if (isHubActive) {
      // Auto-ocultar cursor al volver al HUB 3D sin tener que dar clic
      const timer = setTimeout(() => {
        if (!controlsRef.current?.isLocked && !document.pointerLockElement) {
          try {
            controlsRef.current?.lock();
          } catch (e) {}
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Mostrar cursor inmediatamente en libros, PC o pausa
      if (document.pointerLockElement) {
        try { document.exitPointerLock(); } catch (e) {}
      }
      if (controlsRef.current?.isLocked) {
        try { controlsRef.current?.unlock(); } catch (e) {}
      }
    }
  }, [isHubActive]);

  // Manejador de teclado en PC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
      if (!isHubActive) {
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
  }, [isHubActive]);

  // Interacción central con E o Clic: muestra el cursor al interactuar
  const triggerCenterInteraction = useCallback(() => {
    raycaster.current.setFromCamera(centerCoord.current, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    for (let i = 0; i < intersects.length; i++) {
      const hit = intersects[i];
      if (hit.distance > 4.8) break;

      let obj = hit.object;
      while (obj) {
        if (obj.userData?.isBook) {
          // Mostrar cursor inmediatamente
          unlockHubPointer();
          openReader(obj.userData.id);
          return;
        }
        if (obj.userData?.isComputer) {
          // Mostrar cursor inmediatamente
          unlockHubPointer();
          openComputer();
          return;
        }
        obj = obj.parent;
      }
    }
  }, [camera, scene, openReader, openComputer, unlockHubPointer]);

  // Clic en el HUB 3D: interactuar si está bloqueado o re-bloquear si se perdió el foco
  useEffect(() => {
    const handleCanvasClick = (e) => {
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      if (isTouch || !isHubActive || e.button !== 0) return;

      const controls = controlsRef.current;
      if (controls && controls.isLocked) {
        triggerCenterInteraction();
      } else {
        // Si no estaba bloqueado, bloquear y ocultar cursor al hacer clic en el HUB
        try {
          controls?.lock();
        } catch (err) {}
      }
    };

    const dom = gl.domElement;
    dom.addEventListener('click', handleCanvasClick);
    return () => dom.removeEventListener('click', handleCanvasClick);
  }, [isHubActive, gl.domElement, triggerCenterInteraction]);

  // Tecla Escape en el HUB 3D para pausar y mostrar cursor
  useEffect(() => {
    const handleEscapeInHub = (e) => {
      if (e.key === 'Escape' && isHubActive) {
        e.preventDefault();
        unlockHubPointer();
        openPause();
      }
    };

    window.addEventListener('keydown', handleEscapeInHub);
    return () => window.removeEventListener('keydown', handleEscapeInHub);
  }, [isHubActive, unlockHubPointer, openPause]);

  // Control táctil de rotación de cámara en móviles
  useEffect(() => {
    const dom = gl.domElement;
    if (!dom) return;

    const handleTouchStart = (e) => {
      if (!isHubActive) return;
      if (e.touches.length === 1) {
        touchStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          active: true
        };
      }
    };

    const handleTouchMove = (e) => {
      if (!touchStart.current.active || !isHubActive) return;
      if (e.touches.length !== 1) return;

      const deltaX = e.touches[0].clientX - touchStart.current.x;
      const deltaY = e.touches[0].clientY - touchStart.current.y;
      touchStart.current.x = e.touches[0].clientX;
      touchStart.current.y = e.touches[0].clientY;

      const sens = 0.0035 * (cameraSensitivity || 1.0);
      cameraYaw.current -= deltaX * sens;
      cameraPitch.current = Math.max(-1.45, Math.min(1.45, cameraPitch.current - deltaY * sens));

      camera.quaternion.setFromEuler(new THREE.Euler(cameraPitch.current, cameraYaw.current, 0, 'YXZ'));
    };

    const handleTouchEnd = () => {
      touchStart.current.active = false;
    };

    dom.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      dom.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [gl.domElement, isHubActive, cameraSensitivity, camera]);

  // Físicas de movimiento y actualización de fotograma
  useFrame((state, delta) => {
    const isLocked = controlsRef.current?.isLocked;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const canMove = (isLocked || isTouch) && isHubActive;
    const clampedDelta = Math.min(delta, 0.1);

    if (canMove) {
      velocity.current.x -= velocity.current.x * 10.0 * clampedDelta;
      velocity.current.z -= velocity.current.z * 10.0 * clampedDelta;

      const moveFwd = keys.forward || mobileMove.forward;
      const moveBack = keys.backward || mobileMove.backward;
      const moveLeft = keys.left || mobileMove.left;
      const moveRight = keys.right || mobileMove.right;
      const isSprinting = keys.sprint || mobileMove.sprint;

      direction.current.z = Number(moveFwd) - Number(moveBack);
      direction.current.x = Number(moveRight) - Number(moveLeft);
      direction.current.normalize();

      const speed = isSprinting ? (sprintSpeed || 38.0) : 20.0;
      if (moveFwd || moveBack) velocity.current.z -= direction.current.z * speed * clampedDelta;
      if (moveLeft || moveRight) velocity.current.x -= direction.current.x * speed * clampedDelta;

      if (isLocked && controlsRef.current) {
        controlsRef.current.moveRight(-velocity.current.x * clampedDelta);
        controlsRef.current.moveForward(-velocity.current.z * clampedDelta);
      } else {
        const forwardVec = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, cameraYaw.current, 0));
        const rightVec = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, cameraYaw.current, 0));
        camera.position.addScaledVector(forwardVec, -velocity.current.z * clampedDelta);
        camera.position.addScaledVector(rightVec, -velocity.current.x * clampedDelta);
      }

      // Límites perimetrales de la sala
      const pos = camera.position;
      pos.x = Math.max(-5.8, Math.min(5.8, pos.x));
      pos.z = Math.max(-5.8, Math.min(5.8, pos.z));
      pos.y = 1.7;

      // FOV dinámico al esprintar
      const isMoving = moveFwd || moveBack || moveLeft || moveRight;
      const targetFov = (isSprinting && isMoving) ? 78 : 70;
      if (Math.abs(camera.fov - targetFov) > 0.1) {
        camera.fov += (targetFov - camera.fov) * 0.15;
        camera.updateProjectionMatrix();
      }

      // Raycasting continuo para HUD interactivo
      raycaster.current.setFromCamera(centerCoord.current, camera);
      const intersects = raycaster.current.intersectObjects(scene.children, true);
      let detectedTarget = null;

      for (let i = 0; i < intersects.length; i++) {
        const hit = intersects[i];
        if (hit.distance > 4.8) break;

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

  return null;
}
