"use client";

import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA_COLLISION_LAYER } from './SceneColliders';

// ============================================
// КОНСТАНТЫ
// ============================================

const COLLISION_THROTTLE_FRAMES = 2;
const ZOOM_SPEED = 0.5;
const MAX_DISTANCE = 15;

// ============================================
// ИНТЕРФЕЙСЫ
// ============================================

interface FollowCameraProps {
  targetPosition: { x: number; y: number; z: number };
  distance?: number;
  height?: number;
  smoothness?: number;
  isLocked?: boolean;
  enableCollision?: boolean;
  collisionRadius?: number;
  minDistance?: number;
  maxDistance?: number;
  enableZoom?: boolean;
}

// ============================================
// УТИЛИТЫ
// ============================================

/**
 * Проверяет, является ли объект коллайдером для камеры
 * Включает объекты с флагом isCollider, исключает с noCameraCollision, isPlayer, isNPC, isTrigger
 */
function isCollidable(object: THREE.Object3D): boolean {
  // Пропускаем объекты, которые не должны блокировать камеру
  if (object.userData?.noCameraCollision === true) {
    return false;
  }
  
  // Пропускаем игрока
  if (object.userData?.isPlayer === true) {
    return false;
  }
  
  // Пропускаем NPC
  if (object.userData?.isNPC === true) {
    return false;
  }
  
  // Пропускаем триггеры
  if (object.userData?.isTrigger === true) {
    return false;
  }
  
  // ВАЖНО: Объекты с isCollider === true всегда блокируют камеру
  if (object.userData?.isCollider === true) {
    return true;
  }
  
  return true;
}

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

export default function FollowCamera({
  targetPosition,
  distance = 6,
  height = 4,
  smoothness = 0.05,
  isLocked = false,
  enableCollision = true,
  collisionRadius = 0.3,
  minDistance = 2,
  maxDistance = MAX_DISTANCE,
  enableZoom = true,
}: FollowCameraProps) {
  const { camera, scene } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));
  const currentAngle = useRef(0);
  const currentDistance = useRef(distance);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const rotationSpeed = 0.005;
  const frameCount = useRef(0);

  /** Переиспользование вместо new Raycaster / Vector3 на каждый кадр коллизии — меньше давления на GC. */
  const collisionRaycasterRef = useRef<THREE.Raycaster | null>(null);
  const collisionOriginRef = useRef(new THREE.Vector3());
  const collisionDirectionRef = useRef(new THREE.Vector3());
  const collisionResultRef = useRef(new THREE.Vector3());
  const collisionOffsetRef = useRef(new THREE.Vector3());
  const frameTargetRef = useRef(new THREE.Vector3());
  const frameDesiredCamRef = useRef(new THREE.Vector3());
  
  // ============================================
  // ПРОВЕРКА КОЛЛИЗИЙ КАМЕРЫ
  // ============================================
  
  const checkCameraCollision = useCallback((
    targetPos: THREE.Vector3,
    desiredCamPos: THREE.Vector3,
    dist: number,
    radius: number,
    minDist: number
  ): THREE.Vector3 => {
    if (!enableCollision) {
      return desiredCamPos;
    }

    if (!collisionRaycasterRef.current) {
      collisionRaycasterRef.current = new THREE.Raycaster();
    }
    const raycaster = collisionRaycasterRef.current;
    const origin = collisionOriginRef.current;
    const direction = collisionDirectionRef.current;
    const collidedPos = collisionResultRef.current;
    const offset = collisionOffsetRef.current;
    
    direction.subVectors(desiredCamPos, targetPos).normalize();
    
    origin.copy(targetPos);
    origin.y += 1.5;
    
    raycaster.set(origin, direction);
    raycaster.far = dist + radius;
    raycaster.layers.set(CAMERA_COLLISION_LAYER);
    raycaster.layers.enable(0);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    for (const hit of intersects) {
      let isValidCollider = false;
      let currentObj: THREE.Object3D | null = hit.object;
      
      while (currentObj) {
        if (!isCollidable(currentObj)) {
          isValidCollider = false;
          break;
        }
        
        if (currentObj instanceof THREE.Mesh && currentObj.geometry) {
          isValidCollider = true;
        }
        
        currentObj = currentObj.parent;
      }
      
      if (isValidCollider && hit.distance < dist + radius) {
        const safeDistance = Math.max(minDist, hit.distance - radius);
        
        collidedPos.copy(targetPos);
        collidedPos.y += 1.5;
        offset.copy(direction).multiplyScalar(safeDistance);
        collidedPos.add(offset);
        
        return collidedPos;
      }
    }
    
    return desiredCamPos;
  }, [enableCollision, scene]);

  // ============================================
  // ОБРАБОТКА ВВОДА
  // ============================================

  const applyPointerDelta = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging.current || isLocked) return;
      const deltaX = clientX - lastMousePos.current.x;
      currentAngle.current -= deltaX * rotationSpeed;
      lastMousePos.current = { x: clientX, y: clientY };
    },
    [isLocked],
  );

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 0 || e.button === 2) {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      applyPointerDelta(e.clientX, e.clientY);
    },
    [applyPointerDelta],
  );

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    isDragging.current = true;
    lastMousePos.current = { x: t.clientX, y: t.clientY };
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      applyPointerDelta(t.clientX, t.clientY);
    },
    [applyPointerDelta],
  );

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  // Зум колёсиком мыши
  const handleWheel = useCallback((e: WheelEvent) => {
    if (isLocked || !enableZoom) return;
    
    const delta = Math.sign(e.deltaY) * ZOOM_SPEED;
    currentDistance.current = Math.max(
      minDistance,
      Math.min(maxDistance, currentDistance.current + delta)
    );
  }, [isLocked, enableZoom, minDistance, maxDistance]);

  // Добавляем обработчики событий (мышь + тач для орбиты)
  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleContextMenu,
    handleWheel,
  ]);

  // ============================================
  // ОБНОВЛЕНИЕ КАДРА
  // ============================================

  useFrame(() => {
    frameTargetRef.current.set(targetPosition.x, targetPosition.y, targetPosition.z);
    currentTarget.current.lerp(frameTargetRef.current, smoothness);

    const activeDistance = currentDistance.current;

    const cameraX = currentTarget.current.x + Math.sin(currentAngle.current) * activeDistance;
    const cameraZ = currentTarget.current.z + Math.cos(currentAngle.current) * activeDistance;
    const cameraY = currentTarget.current.y + height;

    frameDesiredCamRef.current.set(cameraX, cameraY, cameraZ);
    
    frameCount.current++;
    let finalCamPos: THREE.Vector3;
    
    if (enableCollision && frameCount.current % COLLISION_THROTTLE_FRAMES === 0) {
      finalCamPos = checkCameraCollision(
        currentTarget.current,
        frameDesiredCamRef.current,
        activeDistance,
        collisionRadius,
        minDistance
      );
    } else {
      finalCamPos = frameDesiredCamRef.current;
    }
    
    camera.position.lerp(finalCamPos, smoothness);

    camera.lookAt(currentTarget.current);
  });

  return null;
}

// ============================================
// ПРОСТАЯ ВЕРСИЯ КАМЕРЫ (без коллизий)
// ============================================

interface SimpleFollowCameraProps {
  targetPosition: { x: number; y: number; z: number };
  distance?: number;
  height?: number;
  smoothness?: number;
  isLocked?: boolean;
  minDistance?: number;
  maxDistance?: number;
  enableZoom?: boolean;
}

export function SimpleFollowCamera({
  targetPosition,
  distance = 6,
  height = 4,
  smoothness = 0.05,
  isLocked = false,
  minDistance = 2,
  maxDistance = MAX_DISTANCE,
  enableZoom = true,
}: SimpleFollowCameraProps) {
  const { camera } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));
  const simpleFrameTargetRef = useRef(new THREE.Vector3());
  const simpleFrameCamRef = useRef(new THREE.Vector3());
  const currentAngle = useRef(0);
  const currentDistance = useRef(distance);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const rotationSpeed = 0.005;

  const applyPointerDelta = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging.current || isLocked) return;
      const deltaX = clientX - lastMousePos.current.x;
      currentAngle.current -= deltaX * rotationSpeed;
      lastMousePos.current = { x: clientX, y: clientY };
    },
    [isLocked],
  );

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 0 || e.button === 2) {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      applyPointerDelta(e.clientX, e.clientY);
    },
    [applyPointerDelta],
  );

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    isDragging.current = true;
    lastMousePos.current = { x: t.clientX, y: t.clientY };
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      applyPointerDelta(t.clientX, t.clientY);
    },
    [applyPointerDelta],
  );

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  // Зум колёсиком мыши
  const handleWheel = useCallback((e: WheelEvent) => {
    if (isLocked || !enableZoom) return;
    
    const delta = Math.sign(e.deltaY) * ZOOM_SPEED;
    currentDistance.current = Math.max(
      minDistance,
      Math.min(maxDistance, currentDistance.current + delta)
    );
  }, [isLocked, enableZoom, minDistance, maxDistance]);

  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleContextMenu,
    handleWheel,
  ]);

  useFrame(() => {
    simpleFrameTargetRef.current.set(targetPosition.x, targetPosition.y, targetPosition.z);
    currentTarget.current.lerp(simpleFrameTargetRef.current, smoothness);

    const activeDistance = currentDistance.current;
    const cameraX = currentTarget.current.x + Math.sin(currentAngle.current) * activeDistance;
    const cameraZ = currentTarget.current.z + Math.cos(currentAngle.current) * activeDistance;
    const cameraY = currentTarget.current.y + height;

    simpleFrameCamRef.current.set(cameraX, cameraY, cameraZ);
    camera.position.lerp(simpleFrameCamRef.current, smoothness);

    camera.lookAt(currentTarget.current);
  });

  return null;
}
