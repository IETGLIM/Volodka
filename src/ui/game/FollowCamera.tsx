"use client";

import { useRef, useEffect, useLayoutEffect, useCallback, type RefObject } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { damp3 } from 'maath/easing';
import { followCameraCollisionDamp, followCameraSmoothDamp } from '@/lib/followCameraDamp';
import { clampPhysicsTimestep } from '@/engine/physics/CharacterController';
import { explorationPointerBlocksCameraOrbit } from '@/lib/explorationUiPointer';
import { setExplorationCameraOrbitYawRad } from '@/lib/explorationCameraOrbitBridge';
import { eventBus } from '@/engine/EventBus';
import {
  applyExplorationInteractionCameraShake,
  bumpExplorationInteractionShake,
} from './explorationCameraShake';
import { CAMERA_COLLISION_LAYER } from './SceneColliders';

// ============================================
// КОНСТАНТЫ
// ============================================
// Эталон «сзади + ~рост глаз» в локальных координатах игрока: `EXPLORATION_TPS_CAMERA_OFFSET_LOCAL_M` в `@/ecs` (`CameraSystem`).

/** Коллизии камеры каждый кадр: при `2` чередовались «с коллизией / без» и давали заметный джиттер. */
const COLLISION_THROTTLE_FRAMES = 1;
const ZOOM_SPEED = 0.5;
/** Чувствительность колеса/тачпада (м/тик); мелкие deltaY дают плавное приближение. */
const ZOOM_PIXEL_SCALE = 0.0075;
const MAX_DISTANCE = 15;

function followCameraWheelDistanceDelta(e: WheelEvent): number {
  const coarse = Math.abs(e.deltaY) >= 48;
  return coarse ? Math.sign(e.deltaY) * ZOOM_SPEED : -e.deltaY * ZOOM_PIXEL_SCALE;
}
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
  /** Позиция из физики каждый кадр без ре-рендера React; сглаживается тем же lerp, что и проп `targetPosition`. */
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
  /** Узкий кадр «игрок — NPC» при диалоге из обхода (с `isLocked` и позицией NPC). */
  dialogueFraming?: boolean;
  dialogueSubjectPosition?: { x: number; y: number; z: number } | null;
  /** Смена сцены: мгновенно переставить орбиту сзади по yaw игрока (см. `RPGGameCanvas` → `sceneId`). */
  orbitResyncKey?: string;
  /**
   * Кат-сцена без диалогового кадра: не трогать камеру и орбиту — ими управляет `IntroCutsceneCinematicDirector`.
   */
  cutsceneActive?: boolean;
}

// ============================================
// УТИЛИТЫ
// ============================================

const dampFactor = followCameraSmoothDamp;
const dampCollisionFactor = followCameraCollisionDamp;

/** Разница углов в (−π, π]. */
function shortestAngleDelta(from: number, to: number): number {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * `maath` smoothTime для `damp3(camera.position, …)`: меньше → резче (согласовано с пропом `smoothness`).
 */
function cameraPositionSmoothTime(smoothness: number): number {
  const base = (0.3 - smoothness * 4) * 1.06;
  return Math.max(0.075, base);
}

/**
 * Приоритет `useFrame` в R3F: **больше** → **позже** в кадре. Rapier шагает на ~0 — камера читает
 * `targetPositionRef` / меш после интеграции и интерполяции rigid body.
 */
/** Выше типичного `useFrame(0)` (анимации/игрок) — камера читает сглаженный итог кадра. */
const FOLLOW_CAMERA_R3F_PRIORITY = 75;

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
  dialogueFraming = false,
  dialogueSubjectPosition = null,
  orbitResyncKey,
  cutsceneActive = false,
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

  /** Не обновлять ref синхронно в render (eslint react-hooks/refs). */
  useEffect(() => {
    collisionSpringRef.current = collisionSpring;
  }, [collisionSpring]);

  /** Смена сцены / лимитов зума: `currentDistance` не выше `maxDistance` (узкая комната и т.п.).
   * Без сброса `springCamInitialized` — иначе мгновенный сдвиг `damp3` даёт рывок при смене пресета. */
  useEffect(() => {
    currentDistance.current = Math.max(minDistance, Math.min(maxDistance, distance));
  }, [distance, minDistance, maxDistance]);

  /** Диалог / блокировка: иначе орбита может «ехать» от последнего удержания кнопки до lock. */
  useEffect(() => {
    if (isLocked) isDragging.current = false;
  }, [isLocked]);

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
  const framingFlatRef = useRef(new THREE.Vector3());
  const framingCamRef = useRef(new THREE.Vector3());
  const framingLookRef = useRef(new THREE.Vector3());
  /** Цель lookAt до `damp3` — сглаживание точки взгляда, иначе `camera.position` демпфируется, а орбита дёргается. */
  const lookAtGoalRef = useRef(new THREE.Vector3());
  const interactionShakeAmpRef = useRef(0);

  useEffect(() => {
    return eventBus.on('ui:interaction_feedback', (e) => {
      if (e.kind === 'success') {
        bumpExplorationInteractionShake(interactionShakeAmpRef);
      }
    });
  }, []);

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
    if (explorationPointerBlocksCameraOrbit(e.target)) return;
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
    if (explorationPointerBlocksCameraOrbit(e.target)) return;
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
      const delta = followCameraWheelDistanceDelta(e);
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
    setExplorationCameraOrbitYawRad(currentAngle.current);
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

  /** Первый кадр и смена сцены: орбита сразу сзади по yaw игрока (до paint, чтобы не «плыть» из стартового угла 0). */
  useLayoutEffect(() => {
    recenterBehindPlayer();
  }, [orbitResyncKey, recenterBehindPlayer]);

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
    const dt = clampPhysicsTimestep(delta);
    if (cutsceneActive && !(isLocked && dialogueFraming && dialogueSubjectPosition)) {
      return;
    }
    const live = targetPositionRef?.current;
    if (live) {
      frameTargetRef.current.set(live.x, live.y, live.z);
    } else {
      frameTargetRef.current.set(targetPosition.x, targetPosition.y, targetPosition.z);
    }

    const posT = dampFactor(smoothness, dt);
    currentTarget.current.lerp(frameTargetRef.current, posT);

    if (!isLocked) {
      const playerYaw =
        live && typeof live.rotation === 'number'
          ? live.rotation
          : (targetPosition.rotation ?? 0);
      const behind = playerYaw + Math.PI;
      if (!isDragging.current) {
        const diff = shortestAngleDelta(currentAngle.current, behind);
        const syncRadPerSec = 14;
        currentAngle.current += diff * Math.min(1, syncRadPerSec * dt);
      }
    }

    if (isLocked && dialogueFraming && dialogueSubjectPosition) {
      const px = currentTarget.current.x;
      const py = currentTarget.current.y;
      const pz = currentTarget.current.z;
      const sx = dialogueSubjectPosition.x;
      const sy = dialogueSubjectPosition.y;
      const sz = dialogueSubjectPosition.z;
      const flat = framingFlatRef.current.set(sx - px, 0, sz - pz);
      const flatLen = flat.length();
      const arm = 3.35;
      if (flatLen > 0.06) {
        flat.multiplyScalar(1 / flatLen);
        framingCamRef.current.set(px - flat.x * arm, py + 1.52, pz - flat.z * arm);
      } else {
        framingCamRef.current.set(px, py + 2.2, pz + arm * 0.85);
      }
      framingLookRef.current.set(
        px + (sx - px) * 0.42,
        Math.max(py, sy) + 1.28,
        pz + (sz - pz) * 0.42,
      );
      if (!springCamInitialized.current) {
        springCamPos.current.copy(camera.position);
        lookAtGoalRef.current.copy(framingLookRef.current);
        currentLookAt.current.copy(framingLookRef.current);
        springCamInitialized.current = true;
      }
      const colT = dampCollisionFactor(collisionSpringRef.current, dt);
      springCamPos.current.lerp(framingCamRef.current, colT);
      damp3(camera.position, springCamPos.current, cameraPositionSmoothTime(smoothness), dt);
      lookAtGoalRef.current.copy(framingLookRef.current);
      damp3(
        currentLookAt.current,
        lookAtGoalRef.current,
        cameraPositionSmoothTime(smoothness),
        dt,
      );
      camera.lookAt(currentLookAt.current);
      applyExplorationInteractionCameraShake(camera, interactionShakeAmpRef, dt);
      return;
    }

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
      lookAtGoalRef.current.set(
        currentTarget.current.x,
        currentTarget.current.y + lookAtHeightOffset,
        currentTarget.current.z,
      );
      currentLookAt.current.copy(lookAtGoalRef.current);
      springCamInitialized.current = true;
    }
    const colT = dampCollisionFactor(collisionSpringRef.current, dt);
    springCamPos.current.lerp(rawCamPos, colT);

    damp3(camera.position, springCamPos.current, cameraPositionSmoothTime(smoothness), dt);

    lookAtGoalRef.current.set(
      currentTarget.current.x,
      currentTarget.current.y + lookAtHeightOffset,
      currentTarget.current.z,
    );
    damp3(currentLookAt.current, lookAtGoalRef.current, cameraPositionSmoothTime(smoothness), dt);
    camera.lookAt(currentLookAt.current);
    applyExplorationInteractionCameraShake(camera, interactionShakeAmpRef, dt);

    setExplorationCameraOrbitYawRad(currentAngle.current);
  }, FOLLOW_CAMERA_R3F_PRIORITY);

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
  const simpleLookGoalRef = useRef(new THREE.Vector3());

  useEffect(() => {
    currentDistance.current = distance;
  }, [distance]);

  useEffect(() => {
    if (isLocked) isDragging.current = false;
  }, [isLocked]);

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
    if (explorationPointerBlocksCameraOrbit(e.target)) return;
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
    if (explorationPointerBlocksCameraOrbit(e.target)) return;
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
      const delta = followCameraWheelDistanceDelta(e);
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
    const dt = clampPhysicsTimestep(delta);
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

    damp3(camera.position, simpleFrameCamRef.current, cameraPositionSmoothTime(smoothness), dt);

    simpleLookGoalRef.current.set(
      currentTarget.current.x,
      currentTarget.current.y + lookAtHeightOffset,
      currentTarget.current.z,
    );
    damp3(currentLookAt.current, simpleLookGoalRef.current, cameraPositionSmoothTime(smoothness), dt);
    camera.lookAt(currentLookAt.current);
  }, FOLLOW_CAMERA_R3F_PRIORITY);

  return null;
}
