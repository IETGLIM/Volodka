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
    
    // Создаём новые векторы для вычислений
    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const collidedPos = new THREE.Vector3();
    
    // Направление от цели к камере
    direction.subVectors(desiredCamPos, targetPos).normalize();
    
    // Начальная точка - чуть выше цели (голова персонажа)
    origin.copy(targetPos);
    origin.y += 1.5;
    
    // Создаём raycaster с оптимизацией по слоям
    const raycaster = new THREE.Raycaster();
    raycaster.set(origin, direction);
    raycaster.far = dist + radius;
    // Включаем только слой коллайдеров камеры и дефолтный слой
    raycaster.layers.set(CAMERA_COLLISION_LAYER);
    raycaster.layers.enable(0); // Дефолтный слой для обычных объектов
    
    // Получаем все пересечения (включая невидимые меши с opacity=0)
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Фильтруем пересечения
    for (const hit of intersects) {
      // Проверяем, что объект является коллайдером
      let isValidCollider = false;
      let currentObj: THREE.Object3D | null = hit.object;
      
      // Поднимаемся по иерархии для проверки userData
      while (currentObj) {
        if (!isCollidable(currentObj)) {
          isValidCollider = false;
          break;
        }
        
        // Если это mesh с геометрией - потенциальный коллайдер
        if (currentObj instanceof THREE.Mesh && currentObj.geometry) {
          isValidCollider = true;
        }
        
        currentObj = currentObj.parent;
      }
      
      if (isValidCollider && hit.distance < dist + radius) {
        // Коллизия обнаружена - двигаем камеру ближе к цели
        const safeDistance = Math.max(minDist, hit.distance - radius);
        
        collidedPos.copy(targetPos);
        collidedPos.y += 1.5;
        collidedPos.add(direction.clone().multiplyScalar(safeDistance));
        
        return collidedPos;
      }
    }
    
    // Коллизий нет - возвращаем исходную позицию
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
    // Целевая позиция с плавной интерполяцией
    const target = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
    currentTarget.current.lerp(target, smoothness);

    // Используем текущую дистанцию (с учётом зума)
    const activeDistance = currentDistance.current;

    // Вычисляем желаемую позицию камеры на основе угла
    const cameraX = currentTarget.current.x + Math.sin(currentAngle.current) * activeDistance;
    const cameraZ = currentTarget.current.z + Math.cos(currentAngle.current) * activeDistance;
    const cameraY = currentTarget.current.y + height;

    // Плавное движение камеры
    const desiredCamPos = new THREE.Vector3(cameraX, cameraY, cameraZ);
    
    // Проверка коллизий (каждый N-й кадр для производительности)
    frameCount.current++;
    let finalCamPos: THREE.Vector3;
    
    if (enableCollision && frameCount.current % COLLISION_THROTTLE_FRAMES === 0) {
      finalCamPos = checkCameraCollision(
        currentTarget.current,
        desiredCamPos,
        activeDistance,
        collisionRadius,
        minDistance
      );
    } else {
      finalCamPos = desiredCamPos;
    }
    
    camera.position.lerp(finalCamPos, smoothness);

    // Смотрим на цель
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
    const target = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
    currentTarget.current.lerp(target, smoothness);

    const activeDistance = currentDistance.current;
    const cameraX = currentTarget.current.x + Math.sin(currentAngle.current) * activeDistance;
    const cameraZ = currentTarget.current.z + Math.cos(currentAngle.current) * activeDistance;
    const cameraY = currentTarget.current.y + height;

    const targetCamPos = new THREE.Vector3(cameraX, cameraY, cameraZ);
    camera.position.lerp(targetCamPos, smoothness);

    camera.lookAt(currentTarget.current);
  });

  return null;
}
