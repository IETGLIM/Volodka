"use client";

import { useRef, useEffect, useCallback, type RefObject } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA_COLLISION_LAYER } from './SceneColliders';

// ============================================
// КОНСТАНТЫ
// ============================================

/** Коллизии камеры каждый кадр: при `2` чередовались «с коллизией / без» и давали заметный джиттер. */
const COLLISION_THROTTLE_FRAMES = 1;
const ZOOM_SPEED = 0.5;
const MAX_DISTANCE = 15;
const ROTATION_POINTER_SPEED = 0.005;
const PITCH_POINTER_SPEED = 0.0035;

// ============================================
// ИНТЕРФЕЙСЫ
// ============================================

export type FollowCameraTargetRef = {
  x: number;
  y: number;
  z: number;
  rotation?: number;
};

interface FollowCameraProps {
  targetPosition: { x: number; y: number; z: number; rotation?: number };
  /** Позиция из физики каждый кадр без ре-рендера React (приоритетнее `targetPosition` в useFrame). */
  targetPositionRef?: RefObject<FollowCameraTargetRef>;
  distance?: number;
  /** Высота «плеча» орбиты над ногами персонажа (пивот горизонтального кольца при pitch = 0). */
  height?: number;
  /** ~0.05–0.15: чем больше, тем резче догоняет цель (масштабируется с `delta`). */
  smoothness?: number;
  /** Смещение камеры вправо по горизонтали (м), классический over-the-shoulder. */
  shoulderOffset?: number;
  /** Точка lookAt над ногами (м), чтобы не «есть пол» при низкой камере. */
  lookAtHeightOffset?: number;
  /** Вертикальный угол орбиты (рад); 0 = прежняя плоская орбита в плоскости pivot. */
  pitchMin?: number;
  pitchMax?: number;
  /** Пружина подтягивания к точке после коллизии (чем выше, тем меньше рывков у стен). */
  collisionSpring?: number;
  /** Старт raycast для коллизий: `target.y + collisionRayOriginY`. */
  collisionRayOriginY?: number;
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

function dampFactor(smoothness: number, delta: number): number {
  const lambda = 2.4 + smoothness * 52;
  return 1 - Math.exp(-lambda * delta);
}

function dampCollisionFactor(collisionSpring: number, delta: number): number {
  return 1 - Math.exp(-collisionSpring * delta);
}

/**
 * Проверяет, является ли объект коллайдером для камеры
 * Включает объекты с флагом isCollider, исключает с noCameraCollision, isPlayer, isNPC, isTrigger
 */
function isCollidable(object: THREE.Object3D): boolean {
  if (object.userData?.noCameraCollision === true) {
    return false;
  }

  if (object.userData?.isPlayer === true) {
    return false;
  }

  if (object.userData?.isNPC === true) {
    return false;
  }

  if (object.userData?.isTrigger === true) {
    return false;
  }

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
  targetPositionRef,
  distance = 6,
  height = 4,
  smoothness = 0.05,
  shoulderOffset = 0.28,
  lookAtHeightOffset = 1.35,
  pitchMin = -0.48,
  pitchMax = 0.55,
  collisionSpring = 10,
  collisionRayOriginY = 1.5,
  isLocked = false,
  enableCollision = true,
  collisionRadius = 0.3,
  minDistance = 2,
  maxDistance = MAX_DISTANCE,
  enableZoom = true,
}: FollowCameraProps) {
  const { camera, scene, gl } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const currentAngle = useRef(0);
  const currentPitch = useRef(0);
  const currentDistance = useRef(distance);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const frameCount = useRef(0);
  const collisionSpringRef = useRef(collisionSpring);
  const springCamPos = useRef(new THREE.Vector3());
  const springCamInitialized = useRef(false);

  collisionSpringRef.current = collisionSpring;

  /** Смена сцены меняет `distance` из `RPGGameCanvas` — ref зума иначе остаётся от предыдущей локации. */
  useEffect(() => {
    currentDistance.current = distance;
    springCamInitialized.current = false;
  }, [distance]);

  /** Переиспользование вместо new Raycaster / Vector3 на каждый кадр коллизии — меньше давления на GC. */
  const collisionRaycasterRef = useRef<THREE.Raycaster | null>(null);
  const collisionOriginRef = useRef(new THREE.Vector3());
  const collisionDirectionRef = useRef(new THREE.Vector3());
  const collisionResultRef = useRef(new THREE.Vector3());
  const collisionOffsetRef = useRef(new THREE.Vector3());
  const frameTargetRef = useRef(new THREE.Vector3());
  const frameDesiredCamRef = useRef(new THREE.Vector3());
  const pivotRef = useRef(new THREE.Vector3());
  const rightScratchRef = useRef(new THREE.Vector3());

  const checkCameraCollision = useCallback(
    (targetPos: THREE.Vector3, desiredCamPos: THREE.Vector3, radius: number, minDist: number): THREE.Vector3 => {
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

      origin.copy(targetPos);
      origin.y += collisionRayOriginY;

      direction.subVectors(desiredCamPos, origin);
      const travel = direction.length();
      if (travel < 1e-4) {
        return desiredCamPos;
      }
      direction.multiplyScalar(1 / travel);

      raycaster.set(origin, direction);
      raycaster.far = travel + radius;
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

        if (isValidCollider && hit.distance < travel + radius) {
          const safeDistance = Math.max(minDist, hit.distance - radius);

          collidedPos.copy(origin);
          offset.copy(direction).multiplyScalar(safeDistance);
          collidedPos.add(offset);

          return collidedPos;
        }
      }

      return desiredCamPos;
    },
    [enableCollision, scene, collisionRayOriginY],
  );

  const applyPointerDelta = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging.current || isLocked) return;
      const deltaX = clientX - lastMousePos.current.x;
      const deltaY = clientY - lastMousePos.current.y;
      currentAngle.current -= deltaX * ROTATION_POINTER_SPEED;
      currentPitch.current -= deltaY * PITCH_POINTER_SPEED;
      currentPitch.current = Math.max(pitchMin, Math.min(pitchMax, currentPitch.current));
      lastMousePos.current = { x: clientX, y: clientY };
    },
    [isLocked, pitchMin, pitchMax],
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

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (isLocked || !enableZoom) return;
      e.preventDefault();
      const delta = Math.sign(e.deltaY) * ZOOM_SPEED;
      currentDistance.current = Math.max(
        minDistance,
        Math.min(maxDistance, currentDistance.current + delta),
      );
    },
    [isLocked, enableZoom, minDistance, maxDistance],
  );

  const recenterBehindPlayer = useCallback(() => {
    if (isLocked) return;
    const live = targetPositionRef?.current;
    const rot =
      live && typeof live.rotation === 'number'
        ? live.rotation
        : (targetPosition.rotation ?? 0);
    currentAngle.current = rot + Math.PI;
    currentPitch.current = 0;
  }, [isLocked, targetPosition.rotation, targetPositionRef]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code !== 'KeyR') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      recenterBehindPlayer();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [recenterBehindPlayer]);

  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleContextMenu,
  ]);

  useEffect(() => {
    if (!enableZoom) return;
    const el = gl.domElement;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [gl, enableZoom, handleWheel]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const live = targetPositionRef?.current;
    if (live) {
      frameTargetRef.current.set(live.x, live.y, live.z);
    } else {
      frameTargetRef.current.set(targetPosition.x, targetPosition.y, targetPosition.z);
    }

    const posT = dampFactor(smoothness, dt);
    currentTarget.current.lerp(frameTargetRef.current, posT);

    const pivot = pivotRef.current;
    pivot.set(currentTarget.current.x, currentTarget.current.y + height, currentTarget.current.z);

    const yaw = currentAngle.current;
    const pitch = currentPitch.current;
    const arm = currentDistance.current;
    const flat = arm * Math.cos(pitch);
    const rise = arm * Math.sin(pitch);

    const hx = Math.sin(yaw) * flat;
    const hz = Math.cos(yaw) * flat;
    const hLen = Math.hypot(hx, hz);
    const right = rightScratchRef.current;
    if (hLen > 1e-4) {
      right.set(hz / hLen, 0, -hx / hLen).multiplyScalar(shoulderOffset);
    } else {
      right.set(0, 0, 0);
    }

    frameDesiredCamRef.current.set(
      pivot.x + hx + right.x,
      pivot.y + rise,
      pivot.z + hz + right.z,
    );

    frameCount.current++;
    let rawCamPos: THREE.Vector3;

    if (enableCollision && frameCount.current % COLLISION_THROTTLE_FRAMES === 0) {
      rawCamPos = checkCameraCollision(
        currentTarget.current,
        frameDesiredCamRef.current,
        collisionRadius,
        minDistance,
      );
    } else {
      rawCamPos = frameDesiredCamRef.current;
    }

    if (!springCamInitialized.current) {
      springCamPos.current.copy(camera.position);
      springCamInitialized.current = true;
    }
    const colT = dampCollisionFactor(collisionSpringRef.current, dt);
    springCamPos.current.lerp(rawCamPos, colT);

    const camT = dampFactor(smoothness, dt);
    camera.position.lerp(springCamPos.current, camT);

    const lookY = currentTarget.current.y + lookAtHeightOffset;
    currentLookAt.current.set(currentTarget.current.x, lookY, currentTarget.current.z);
    camera.lookAt(currentLookAt.current);
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
  shoulderOffset?: number;
  lookAtHeightOffset?: number;
  pitchMin?: number;
  pitchMax?: number;
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
  shoulderOffset = 0.2,
  lookAtHeightOffset = 1.3,
  pitchMin = -0.48,
  pitchMax = 0.55,
  isLocked = false,
  minDistance = 2,
  maxDistance = MAX_DISTANCE,
  enableZoom = true,
}: SimpleFollowCameraProps) {
  const { camera, gl } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const simpleFrameTargetRef = useRef(new THREE.Vector3());
  const simpleFrameCamRef = useRef(new THREE.Vector3());
  const pivotRef = useRef(new THREE.Vector3());
  const rightScratchRef = useRef(new THREE.Vector3());
  const currentAngle = useRef(0);
  const currentPitch = useRef(0);
  const currentDistance = useRef(distance);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    currentDistance.current = distance;
  }, [distance]);

  const applyPointerDelta = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging.current || isLocked) return;
      const deltaX = clientX - lastMousePos.current.x;
      const deltaY = clientY - lastMousePos.current.y;
      currentAngle.current -= deltaX * ROTATION_POINTER_SPEED;
      currentPitch.current -= deltaY * PITCH_POINTER_SPEED;
      currentPitch.current = Math.max(pitchMin, Math.min(pitchMax, currentPitch.current));
      lastMousePos.current = { x: clientX, y: clientY };
    },
    [isLocked, pitchMin, pitchMax],
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

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (isLocked || !enableZoom) return;
      e.preventDefault();
      const delta = Math.sign(e.deltaY) * ZOOM_SPEED;
      currentDistance.current = Math.max(
        minDistance,
        Math.min(maxDistance, currentDistance.current + delta),
      );
    },
    [isLocked, enableZoom, minDistance, maxDistance],
  );

  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleContextMenu,
  ]);

  useEffect(() => {
    if (!enableZoom) return;
    const el = gl.domElement;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [gl, enableZoom, handleWheel]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    simpleFrameTargetRef.current.set(targetPosition.x, targetPosition.y, targetPosition.z);
    const posT = dampFactor(smoothness, dt);
    currentTarget.current.lerp(simpleFrameTargetRef.current, posT);

    const pivot = pivotRef.current;
    pivot.set(currentTarget.current.x, currentTarget.current.y + height, currentTarget.current.z);

    const yaw = currentAngle.current;
    const pitch = currentPitch.current;
    const arm = currentDistance.current;
    const flat = arm * Math.cos(pitch);
    const rise = arm * Math.sin(pitch);

    const hx = Math.sin(yaw) * flat;
    const hz = Math.cos(yaw) * flat;
    const hLen = Math.hypot(hx, hz);
    const right = rightScratchRef.current;
    if (hLen > 1e-4) {
      right.set(hz / hLen, 0, -hx / hLen).multiplyScalar(shoulderOffset);
    } else {
      right.set(0, 0, 0);
    }

    simpleFrameCamRef.current.set(
      pivot.x + hx + right.x,
      pivot.y + rise,
      pivot.z + hz + right.z,
    );

    const camT = dampFactor(smoothness, dt);
    camera.position.lerp(simpleFrameCamRef.current, camT);

    const lookY = currentTarget.current.y + lookAtHeightOffset;
    currentLookAt.current.set(currentTarget.current.x, lookY, currentTarget.current.z);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
