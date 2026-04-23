"use client";

import React, { useRef, useEffect, useLayoutEffect, useMemo, useState, memo, forwardRef, useImperativeHandle, Suspense, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { RigidBody, RapierRigidBody, CapsuleCollider, useRapier, useBeforePhysicsStep } from '@react-three/rapier';
import type { KinematicCharacterController } from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { usePlayerControls, type PlayerControls } from '@/hooks/useGamePhysics';
import {
  applyGroundingAfterCharacterProbe,
  clampPhysicsTimestep,
  computePlayerCapsule,
  createExplorationKinematicCharacterController,
  integrateKinematicLocomotionDelta,
} from '@/core/physics/CharacterController';
import { usePlayerFootsteps } from '@/hooks/usePlayerFootsteps';
import { getDefaultPlayerModelPath, isValidPlayerGlbPath, rewriteLegacyModelPath } from '@/config/modelUrls';
import {
  PLAYER_GLB_TARGET_VISUAL_METERS,
  EXPLORATION_PLAYER_GLOBAL_VISUAL_SCALE,
  applyExplorationPlayerGlbVisualUniformMultiplier,
  applyExplorationPlayerGlobalVisualScale,
  clampExplorationHumanoidGlbUniformForScene,
  computeExplorationPlayerGlbUniformFromBBox,
} from '@/lib/playerScaleConstants';
import type { SceneId } from '@/data/types';
import { getGltfSkinnedVisualHeightMeters } from '@/lib/gltfSkinnedBoundingHeight';
import { retainGltfModelUrl, releaseGltfModelUrl } from '@/lib/gltfModelCache';
import { applyGltfExplorationCharacterMaterialPolicies } from '@/lib/gltfCharacterMaterialPolicy';
import { ThreeCanvasSuspenseFallback } from '@/components/3d/ThreeCanvasSuspenseFallback';
import { cloneAnimationClipsWithoutExplorationPlayerRootMotion } from '@/lib/stripExplorationPlayerRootMotionFromClips';
import { isExplorationPlayerDebugPrimitiveEnabled } from '@/lib/explorationPlayerDebugPrimitive';
import { isExplorationPlayerLocomotionLogEnabled } from '@/lib/explorationDiagnostics';
import { getExplorationCameraOrbitYawRad } from '@/lib/explorationCameraOrbitBridge';
import { useGameStore } from '@/store/gameStore';
import { useGamePhaseStore } from '@/store/gamePhaseStore';
import { getIntroCutscenePlayerPose } from '@/lib/introCutscenePlayerBridge';

// ============================================
// TYPES
// ============================================

export interface PhysicsPlayerProps {
  position?: [number, number, number];
  modelPath?: string;
  /**
   * Масштаб персонажа в помещении (`getExplorationCharacterModelScale`):
   * умножает капсулу Rapier и множитель в формуле uniform GLB `(targetMeters / bboxH) * visualModelScale`.
   */
  visualModelScale?: number;
  /**
   * Целевая высота GLB в метрах сцены (`getExplorationPlayerGltfTargetMeters(sceneId)` из `RPGGameCanvas`).
   * По умолчанию `PLAYER_GLB_TARGET_VISUAL_METERS`.
   */
  playerGltfTargetMeters?: number;
  /**
   * Множитель к uniform GLB после bbox (`getExplorationPlayerGlbVisualUniformMultiplier(sceneId)`).
   * По умолчанию **1**; в `SCENE_CONFIG` — явное уменьшение меша в кадре.
   */
  playerGlbVisualUniformMultiplier?: number;
  /** Множитель ходьбы/бега/прыжка; см. `getExplorationLocomotionScale`. */
  locomotionScale?: number;
  /** Позиция и yaw модели каждый кадр (для камеры / ресета без отставания от стора). */
  onPositionChange?: (position: { x: number; y: number; z: number; rotation: number }) => void;
  onInteraction?: () => void;
  isLocked?: boolean;
  initialRotation?: number;
  /** Тач-панель (см. `ExplorationMobileHud`): движение объединяется с клавиатурой. */
  virtualControlsRef?: React.MutableRefObject<Partial<PlayerControls>>;
  /**
   * Диагностика: вместо GLB — красный бокс с размерами капсулы (тот же контроллер / коллайдер).
   * Обычно не задаётся вручную — см. **`NEXT_PUBLIC_EXPLORATION_PLAYER_DEBUG_PRIMITIVE`** и **`explorationPlayerDebugPrimitive`**.
   */
  debugPlayerPrimitive?: boolean;
  /**
   * Смена сцены без `key` на модели: при новом значении — телепорт на `position` + сброс скоростей
   * (например **`sceneId`** из **`RPGGameCanvas`**).
   */
  spawnSyncKey?: string;
  /**
   * Жёсткий потолок uniform GLB в узких интерьерах (bbox/кэш), без влияния на улицы.
   * Передаётся как **`sceneId`** из **`RPGGameCanvas`**.
   */
  explorationGlbClampSceneId?: SceneId;
}

export interface PhysicsPlayerRef {
  getPosition: () => { x: number; y: number; z: number };
  getRotation: () => number;
  teleport: (x: number, y: number, z: number) => void;
  getRigidBody: () => RapierRigidBody | null;
}

// ============================================
// FALLBACK PLAYER MODEL
// ============================================

const FallbackPlayerModel = memo(function FallbackPlayerModel({
  isMoving,
  isLocked,
  roomScale = 1,
}: {
  isMoving: boolean;
  isLocked: boolean;
  /** Согласован с `visualModelScale` сцены (узкие комнаты — меньше заглушка). */
  roomScale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.position.y = isMoving ? Math.abs(Math.sin(t * 8)) * 0.03 : Math.sin(t * 2) * 0.01;
    }

    if (isMoving) {
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * 12) * 0.4;
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * 12 + Math.PI) * 0.4;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 12 + Math.PI) * 0.3;
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(t * 12) * 0.3;
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0.2;
    }

    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.5) * 0.1;
    }
  });

  const rs = Math.max(0.28, Math.min(1.25, roomScale));
  const vis = rs * EXPLORATION_PLAYER_GLOBAL_VISUAL_SCALE;
  return (
    <group ref={groupRef} scale={[vis, vis, vis]}>
      {/* ТЕЛО */}
      <group position={[0, 0.9, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
          <meshStandardMaterial color="#2d3748" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.45, 0.35, 0.25]} />
          <meshStandardMaterial color="#4a5568" roughness={0.8} />
        </mesh>

        {/* Руки */}
        <group ref={leftArmRef} position={[-0.35, 0.15, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
            <meshStandardMaterial color="#4a5568" roughness={0.8} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.35, 0.15, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
            <meshStandardMaterial color="#4a5568" roughness={0.8} />
          </mesh>
          <group position={[0.05, -0.45, 0.1]}>
            <mesh castShadow>
              <boxGeometry args={[0.15, 0.02, 0.2]} />
              <meshStandardMaterial color="#f5e6d3" roughness={0.95} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ГОЛОВА */}
      <group ref={headRef} position={[0, 1.6, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#e8d5c4" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.08, -0.02]} castShadow>
          <sphereGeometry args={[0.23, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#2d3748" roughness={0.9} />
        </mesh>
        {/* Очки */}
        <group position={[0, 0, 0.2]}>
          <mesh position={[-0.07, 0.02, 0]}>
            <torusGeometry args={[0.04, 0.005, 8, 16]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.07, 0.02, 0]}>
            <torusGeometry args={[0.04, 0.005, 8, 16]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* НОГИ */}
      <group ref={leftLegRef} position={[-0.12, 0.4, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.35, 4, 8]} />
          <meshStandardMaterial color="#1a202c" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.48, 0.03]} castShadow>
          <boxGeometry args={[0.1, 0.08, 0.15]} />
          <meshStandardMaterial color="#2d3748" roughness={0.6} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.12, 0.4, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.35, 4, 8]} />
          <meshStandardMaterial color="#1a202c" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.48, 0.03]} castShadow>
          <boxGeometry args={[0.1, 0.08, 0.15]} />
          <meshStandardMaterial color="#2d3748" roughness={0.6} />
        </mesh>
      </group>

      {isLocked && (
        <group position={[0, 2.2, 0]}>
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        </group>
      )}
    </group>
  );
});

// ============================================
// GLB PLAYER MODEL
// ============================================

const GLBPlayerModel = memo(function GLBPlayerModel({
  modelPath,
  isMoving,
  isRunning,
  isLocked,
  onError,
  roomScale,
  targetVisualMeters,
  visualUniformMultiplier = 1,
  glbUniformClampSceneId,
}: {
  modelPath: string;
  isMoving: boolean;
  isRunning: boolean;
  isLocked: boolean;
  onError: () => void;
  /** Множитель комнаты; итоговая высота ≈ `targetVisualMeters * roomScale` (после деления на bbox). */
  roomScale: number;
  /** Целевая высота визуала в метрах сцены (из `SCENE_CONFIG` или дефолт). */
  targetVisualMeters: number;
  /** Из `SCENE_CONFIG.explorationPlayerGlbVisualUniformMultiplier` — после bbox. */
  visualUniformMultiplier?: number;
  glbUniformClampSceneId?: SceneId;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene: loadedScene, animations } = useGLTF(modelPath) as any;
  /** Шаг 4: без root translation на клонах — не дублировать сдвиг с kinematic Rapier. */
  const mixerAnimations = useMemo(
    () => cloneAnimationClipsWithoutExplorationPlayerRootMotion(animations as THREE.AnimationClip[] | undefined),
    [animations],
  );
  const { actions } = useAnimations(mixerAnimations, groupRef);
  const rs = Math.max(0.28, Math.min(1.25, roomScale));
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const prevTargetAnimRef = useRef<string | null>(null);
  const idleKeyForTimeScaleRef = useRef<string>('');
  const singleClipModeRef = useRef(false);

  /** Стабильный ключ набора экшенов: ссылка `actions` от drei может меняться без смены клипов. */
  const actionKeysSig = useMemo(() => {
    if (!actions) return '';
    return Object.keys(actions)
      .filter((k) => actions[k])
      .sort()
      .join('\0');
  }, [actions]);

  useEffect(() => {
    retainGltfModelUrl(modelPath);
    return () => releaseGltfModelUrl(modelPath);
  }, [modelPath]);

  useEffect(() => {
    return () => {
      const act = actionsRef.current;
      if (!act) return;
      for (const key of Object.keys(act)) {
        const a = act[key];
        if (a) a.stop();
      }
    };
  }, []);

  /** Кэш `useGLTF` ограничен LRU в `gltfModelCache`; сцену из кэша не клонируем — для skinned GLB обычный clone ломает видимость. */
  const displayScene = useMemo(() => {
    if (!loadedScene) return null;
    try {
      loadedScene.traverse((child: THREE.Object3D) => {
        const m = child as THREE.Mesh & { isMesh?: boolean };
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
          /** Луч коллизий камеры поднимается от `target + collisionRayOriginY`; без флага на листьях GLB луч может зацепить скин. */
          m.userData.isPlayer = true;
        }
      });
      applyGltfExplorationCharacterMaterialPolicies(loadedScene);
      return loadedScene;
    } catch {
      onError();
      return null;
    }
  }, [loadedScene, onError]);

  const visualUniform = useMemo(() => {
    let base: number;
    if (!loadedScene) {
      base = 0.12 * rs;
    } else {
      const scratch = new THREE.Vector3();
      const h = getGltfSkinnedVisualHeightMeters(loadedScene, scratch);
      if (h < 1e-4) base = 0.12 * rs;
      else base = computeExplorationPlayerGlbUniformFromBBox(h, targetVisualMeters, rs);
    }
    const chained = applyExplorationPlayerGlobalVisualScale(
      applyExplorationPlayerGlbVisualUniformMultiplier(base, visualUniformMultiplier),
    );
    return clampExplorationHumanoidGlbUniformForScene(glbUniformClampSceneId, chained);
  }, [loadedScene, rs, targetVisualMeters, visualUniformMultiplier, glbUniformClampSceneId]);

  useEffect(() => {
    const act = actionsRef.current;
    if (!act || Object.keys(act).length === 0) return;

    const animationNames = Object.keys(act);
    const idleAnim =
      animationNames.find((n) => n.toLowerCase().includes('idle')) || animationNames[0];
    idleKeyForTimeScaleRef.current = idleAnim;
    singleClipModeRef.current = animationNames.length === 1;

    const runPrefer =
      animationNames.find((n) => {
        const l = n.toLowerCase();
        return l.includes('run') && !l.includes('walk');
      }) ??
      animationNames.find((n) => n.toLowerCase().includes('run')) ??
      null;

    const walkPrefer =
      animationNames.length === 1
        ? idleAnim
        : animationNames.find((n) => n.toLowerCase().includes('walk') && !n.toLowerCase().includes('run')) ??
          animationNames.find((n) => n.toLowerCase().includes('walk')) ??
          runPrefer ??
          null;

    let targetAnim = idleAnim;
    if (isMoving) {
      if (!singleClipModeRef.current && isRunning && runPrefer && act[runPrefer]) {
        targetAnim = runPrefer;
      } else if (walkPrefer && act[walkPrefer]) {
        targetAnim = walkPrefer;
      }
    }

    if (!targetAnim || !act[targetAnim]) return;
    if (targetAnim === prevTargetAnimRef.current) return;

    const prevKey = prevTargetAnimRef.current;
    const prevAction = prevKey && act[prevKey] ? act[prevKey]! : null;
    const nextAction = act[targetAnim]!;
    const duration = 0.3;
    nextAction.reset();
    nextAction.setEffectiveTimeScale(1);
    nextAction.play();
    if (prevAction && prevAction !== nextAction) {
      nextAction.crossFadeFrom(prevAction, duration, false);
    } else {
      nextAction.fadeIn(duration);
    }
    prevTargetAnimRef.current = targetAnim;
  }, [actionKeysSig, isMoving, isRunning]);

  useFrame(() => {
    if (!singleClipModeRef.current || isLocked) return;
    const act = actionsRef.current;
    const k = idleKeyForTimeScaleRef.current;
    const a = k && act?.[k];
    if (!a) return;
    a.setEffectiveTimeScale(isMoving ? 1.22 : 1);
  });

  if (!displayScene) return null;

  const u = visualUniform;
  return (
    <group ref={groupRef} scale={[u, u, u]}>
      <primitive object={displayScene} />
      {isLocked && (
        <group position={[0, 2.2, 0]}>
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        </group>
      )}
    </group>
  );
});

// ============================================
// PHYSICS PLAYER COMPONENT
// ============================================
//
// Шаг 2 (мерцание / двойная позиция): визуал (group + GLB) — **дочерний** `<RigidBody>`.
// Его world-matrix выставляет `@react-three/rapier` из симуляции. Не подписывайте этот group
// на `exploration.playerPosition` из Zustand и не делайте `group.position.copy(store)` в useEffect —
// иначе конфликт с kinematic + `setNextKinematicTranslation` (гипотеза №2).
// `onPositionChange` ниже — только для ref + моста в родителе (`livePlayerPositionRef` / `explorationLivePlayerBridge`), не для сдвига меша из стора.
//
export const PhysicsPlayer = memo(forwardRef<PhysicsPlayerRef, PhysicsPlayerProps>(function PhysicsPlayer(
  {
    position = [0, 0.06, 3],
    modelPath,
    visualModelScale = 1,
    playerGltfTargetMeters = PLAYER_GLB_TARGET_VISUAL_METERS,
    playerGlbVisualUniformMultiplier = 1,
    locomotionScale = 1,
    onPositionChange,
    onInteraction,
    isLocked = false,
    initialRotation = 0,
    virtualControlsRef,
    debugPlayerPrimitive = isExplorationPlayerDebugPrimitiveEnabled(),
    spawnSyncKey,
    explorationGlbClampSceneId,
  },
  ref
) {
  const { world } = useRapier();
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const characterControllerRef = useRef<KinematicCharacterController | null>(null);
  const modelRef = useRef<THREE.Group>(null);
  /** Зона кармы для подсветки — без подписки на каждое микроизменение числа. */
  const karmaZone = useGameStore((s) =>
    s.playerState.karma > 70 ? 'high' : s.playerState.karma < 30 ? 'low' : 'mid',
  );
  const canJumpRef = useRef(true);
  const groundedRef = useRef(false);
  const isRunningRef = useRef(false);
  const verticalVelRef = useRef(0);
  const horizVelXRef = useRef(0);
  const horizVelZRef = useRef(0);
  const moveYawRef = useRef(initialRotation);
  /** Поворот визуала — только ref, без setState в useFrame (иначе ~60 React commit/сек). */
  const rotationRef = useRef(initialRotation);
  /** Для анимаций GLB / заглушки: обновляем React только при смене true/false. */
  const [isMoving, setIsMoving] = useState(false);
  const isMovingSyncRef = useRef(false);
  /** Гистерезис по горизонтальной скорости — меньше дёрганья idle/walk на границе. */
  const moveActiveRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);
  const isRunningSyncRef = useRef(false);
  const locomotionLogCounterRef = useRef(0);
  const [modelError, setModelError] = useState(false);
  const onInteractionRef = useRef(onInteraction);
  const isLockedRef = useRef(isLocked);
  const locomotionScaleRef = useRef(locomotionScale);
  useLayoutEffect(() => {
    locomotionScaleRef.current = locomotionScale;
  }, [locomotionScale]);

  const roomScale = Math.max(0.28, Math.min(1.25, visualModelScale));
  /**
   * Позиция для пропа `<RigidBody position={…}>`: должна совпадать с нарративным телепортом.
   * Раньше здесь был `useState(начальная)` — после смены сцены Rapier снова подтягивал тело к **первому**
   * спавну (комната), пока мир уже коридор → игрок снаружи пола и «пустота» / ломаный масштаб визуала.
   * Живые координаты ходьбы из стора сюда не попадают (`handlePositionChange` не пишет стор каждый кадр),
   * поэтому `useMemo` по `position` безопасен: обновление только при телепорте / смене `spawnSyncKey`.
   */
  const rigidSpawnPosition = useMemo(
    (): [number, number, number] => [position[0], position[1], position[2]],
    [spawnSyncKey, position[0], position[1], position[2]],
  );

  const capsule = useMemo(() => computePlayerCapsule(roomScale), [roomScale]);

  useEffect(() => {
    onInteractionRef.current = onInteraction;
  }, [onInteraction]);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  useEffect(() => {
    rotationRef.current = initialRotation;
    moveYawRef.current = initialRotation;
    if (modelRef.current) {
      modelRef.current.rotation.y = initialRotation;
    }
  }, [initialRotation]);

  /**
   * Смена сцены: телепорт без `key` на дереве GLB. `useLayoutEffect` — после commit Rapier, до paint.
   * Варп: `setTranslation` + `setNextKinematicTranslation`; в игровом KCC-шаге — только `setNextKinematicTranslation`.
   */
  useLayoutEffect(() => {
    if (spawnSyncKey === undefined) return;
    const rb = rigidBodyRef.current;
    if (!rb) return;
    const x = position[0];
    const y = position[1];
    const z = position[2];
    rb.setTranslation({ x, y, z }, true);
    rb.setNextKinematicTranslation({ x, y, z });
    verticalVelRef.current = 0;
    horizVelXRef.current = 0;
    horizVelZRef.current = 0;
    moveActiveRef.current = false;
    isMovingSyncRef.current = false;
    isRunningSyncRef.current = false;
    const r0 = initialRotation;
    rotationRef.current = r0;
    moveYawRef.current = r0;
    if (modelRef.current) {
      modelRef.current.rotation.y = r0;
    }
  }, [spawnSyncKey, position[0], position[1], position[2], initialRotation]);

  const handleInteractPress = useCallback(() => {
    if (onInteractionRef.current && !isLockedRef.current) {
      onInteractionRef.current();
    }
  }, []);

  const { getControls } = usePlayerControls({
    onInteractPress: handleInteractPress,
    virtualControlsRef,
  });

  const getControlsRef = useRef(getControls);
  useLayoutEffect(() => {
    getControlsRef.current = getControls;
  }, [getControls]);

  useEffect(() => {
    const cc = createExplorationKinematicCharacterController(world);
    characterControllerRef.current = cc;
    return () => {
      world.removeCharacterController(cc);
      characterControllerRef.current = null;
    };
  }, [world]);

  // Экспозиция методов через ref
  useImperativeHandle(ref, () => ({
    getPosition: () => {
      if (rigidBodyRef.current) {
        const pos = rigidBodyRef.current.translation();
        return { x: pos.x, y: pos.y, z: pos.z };
      }
      return { x: position[0], y: position[1], z: position[2] };
    },
    getRotation: () => rotationRef.current,
    /** Явный варп: `setTranslation` допустим только здесь (не в игровом KCC-кадре). */
    teleport: (x: number, y: number, z: number) => {
      if (rigidBodyRef.current) {
        const p = { x, y, z };
        rigidBodyRef.current.setTranslation(p, true);
        rigidBodyRef.current.setNextKinematicTranslation(p);
        verticalVelRef.current = 0;
        horizVelXRef.current = 0;
        horizVelZRef.current = 0;
        moveActiveRef.current = false;
        isMovingSyncRef.current = false;
        isRunningSyncRef.current = false;
      }
    },
    getRigidBody: () => rigidBodyRef.current,
  }), [position]);

  usePlayerFootsteps({
    rigidBodyRef,
    groundedRef,
    horizVelXRef,
    horizVelZRef,
    isLockedRef,
    isRunningRef,
    locomotionScaleRef,
    enabled: true,
  });

  useBeforePhysicsStep((stepWorld) => {
    const rb = rigidBodyRef.current;
    const cc = characterControllerRef.current;
    if (!rb || !cc) return;

    if (useGamePhaseStore.getState().phase === 'intro_cutscene') {
      const cut = getIntroCutscenePlayerPose();
      if (cut) {
        const t0 = rb.translation();
        let dx = cut.x - t0.x;
        let dy = cut.y - t0.y;
        let dz = cut.z - t0.z;
        const len = Math.hypot(dx, dy, dz);
        const maxStep = 0.32;
        if (len > maxStep && len > 1e-8) {
          const s = maxStep / len;
          dx *= s;
          dy *= s;
          dz *= s;
        }
        const n = rb.numColliders();
        if (n >= 1) {
          const collider = rb.collider(0);
          cc.computeColliderMovement(collider, { x: dx, y: dy, z: dz });
          const m = cc.computedMovement();
          const t = rb.translation();
          rb.setNextKinematicTranslation({ x: t.x + m.x, y: t.y + m.y, z: t.z + m.z });
          groundedRef.current = cc.computedGrounded();
        } else {
          rb.setNextKinematicTranslation({ x: cut.x, y: cut.y, z: cut.z });
        }
        rotationRef.current = cut.rotation;
        return;
      }
    }

    if (isLockedRef.current) {
      const t = rb.translation();
      rb.setNextKinematicTranslation({ x: t.x, y: t.y, z: t.z });
      return;
    }

    const dt = clampPhysicsTimestep(stepWorld.timestep);
    const controls = getControlsRef.current();
    const n = rb.numColliders();
    if (n < 1) return;
    const collider = rb.collider(0);

    // W/A/S/D относительно горизонтальной орбиты камеры (классический TPS), а не только поворота модели.
    const orbit = getExplorationCameraOrbitYawRad();
    const moveYawCameraRelative = -orbit;

    const { dx, dy, dz } = integrateKinematicLocomotionDelta({
      dt,
      controls,
      locomotionScale: locomotionScaleRef.current,
      moveYaw: moveYawCameraRelative,
      gravityY: stepWorld.gravity.y,
      grounded: groundedRef.current,
      verticalVel: verticalVelRef,
      horizVelX: horizVelXRef,
      horizVelZ: horizVelZRef,
      canJump: canJumpRef,
      isRunning: isRunningRef,
      horizontalWorldSpace: false,
    });

    cc.computeColliderMovement(collider, { x: dx, y: dy, z: dz });
    const m = cc.computedMovement();
    const t0 = rb.translation();
    rb.setNextKinematicTranslation({ x: t0.x + m.x, y: t0.y + m.y, z: t0.z + m.z });

    const grounded = cc.computedGrounded();
    groundedRef.current = grounded;
    applyGroundingAfterCharacterProbe({
      grounded,
      jumpHeld: controls.jump,
      verticalVel: verticalVelRef,
      canJump: canJumpRef,
    });

    if (isExplorationPlayerLocomotionLogEnabled()) {
      locomotionLogCounterRef.current += 1;
      if (locomotionLogCounterRef.current % 48 === 0) {
        const p = rb.translation();
        // eslint-disable-next-line no-console -- gated by NEXT_PUBLIC_EXPLORATION_PLAYER_LOCOMOTION_LOG
        console.info('[ExplorationPlayerLocomotion]', {
          grounded,
          vy: verticalVelRef.current,
          hx: horizVelXRef.current,
          hz: horizVelZRef.current,
          x: p.x,
          y: p.y,
          z: p.z,
        });
      }
    }
  });

  // Визуал: поворот модели и колбэк позиции (после шага Rapier mesh уже интерполирован).
  // Важно: не вызывать setState каждый кадр — иначе весь поддерево игрока (GLB + физика) уходит в React commit ~60 Гц.
  useFrame((_state, frameDelta) => {
    const rb = rigidBodyRef.current;
    if (!rb) {
      if (isMovingSyncRef.current) {
        isMovingSyncRef.current = false;
        moveActiveRef.current = false;
        setIsMoving(false);
      }
      if (isRunningSyncRef.current) {
        isRunningSyncRef.current = false;
        setIsRunning(false);
      }
      return;
    }

    if (isLockedRef.current) {
      if (useGamePhaseStore.getState().phase === 'intro_cutscene') {
        const cut = getIntroCutscenePlayerPose();
        if (cut) {
          const walk = cut.horizontalSpeed > 0.12;
          const run = cut.horizontalSpeed > 2.35;
          if (walk !== isMovingSyncRef.current) {
            isMovingSyncRef.current = walk;
            moveActiveRef.current = walk;
            setIsMoving(walk);
          }
          if (run !== isRunningSyncRef.current) {
            isRunningSyncRef.current = run;
            setIsRunning(run);
          }
          if (modelRef.current) {
            modelRef.current.rotation.y = rotationRef.current;
          }
          moveYawRef.current = -getExplorationCameraOrbitYawRad();
          if (onPositionChange) {
            const p = rb.translation();
            onPositionChange({
              x: p.x,
              y: p.y,
              z: p.z,
              rotation: rotationRef.current,
            });
          }
          return;
        }
      }

      if (isMovingSyncRef.current) {
        isMovingSyncRef.current = false;
        moveActiveRef.current = false;
        setIsMoving(false);
      }
      if (isRunningSyncRef.current) {
        isRunningSyncRef.current = false;
        setIsRunning(false);
      }
      if (modelRef.current) {
        modelRef.current.rotation.y = rotationRef.current;
      }
      moveYawRef.current = -getExplorationCameraOrbitYawRad();
      if (onPositionChange) {
        const p = rb.translation();
        onPositionChange({ x: p.x, y: p.y, z: p.z, rotation: rotationRef.current });
      }
      return;
    }

    const hx = horizVelXRef.current;
    const hz = horizVelZRef.current;
    const speed = Math.hypot(hx, hz);
    const MOVE_ENTER = 0.14;
    const MOVE_EXIT = 0.055;
    const wasActive = moveActiveRef.current;
    const nextActive = wasActive ? speed > MOVE_EXIT : speed > MOVE_ENTER;
    moveActiveRef.current = nextActive;
    if (nextActive !== isMovingSyncRef.current) {
      isMovingSyncRef.current = nextActive;
      setIsMoving(nextActive);
    }

    const running = isRunningRef.current;
    if (running !== isRunningSyncRef.current) {
      isRunningSyncRef.current = running;
      setIsRunning(running);
    }

    if (nextActive) {
      const ctrl = getControlsRef.current();
      /** S без W: движение назад относительно камеры — не разворачивать модель «лицом в скорость», иначе орбита камеры догоняет yaw и кажется «кручением». */
      const backNoForward = ctrl.backward && !ctrl.forward;
      let targetRotation = Math.atan2(hx, hz);
      if (backNoForward) {
        targetRotation = Math.atan2(-hx, -hz);
      }
      let prev = rotationRef.current;
      let diff = targetRotation - prev;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const dt = clampPhysicsTimestep(frameDelta);
      /** Экспоненциальное сглаживание к направлению ходьбы, независимо от FPS (раньше фиксированный 0.16/кадр давал рывки). */
      const k = 10.5;
      const blend = 1 - Math.exp(-k * dt);
      rotationRef.current = prev + diff * blend;
    }

    if (modelRef.current) {
      modelRef.current.rotation.y = rotationRef.current;
    }

    moveYawRef.current = -getExplorationCameraOrbitYawRad();

    if (onPositionChange) {
      const p = rb.translation();
      onPositionChange({ x: p.x, y: p.y, z: p.z, rotation: rotationRef.current });
    }
  });

  const handleModelError = useCallback(() => {
    setModelError(true);
  }, []);

  const modelPathToUse = useMemo(() => {
    const raw = isValidPlayerGlbPath(modelPath) ? modelPath! : getDefaultPlayerModelPath();
    return rewriteLegacyModelPath(raw);
  }, [modelPath]);

  if (modelPath && !isValidPlayerGlbPath(modelPath)) {
    console.warn('[PhysicsPlayer] Invalid modelPath provided, using default:', modelPath);
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={rigidSpawnPosition}
      type="kinematicPosition"
      colliders={false}
      canSleep={false}
      enabledRotations={[false, false, false]}
      userData={{ isPlayer: true }}
    >
      <CapsuleCollider args={[capsule.halfH, capsule.r]} position={[0, capsule.capCenterY, 0]} />

      {/*
        Визуал отдельно от коллайдера: один активный меш (GLB или fallback), без наслоения процедурки на модель.
        Пустой fallback при загрузке — чтобы не рисовать две фигуры в одном месте.
        Шаг 3 (стабилизация позиции): эта группа не синхронизируется с exploration.playerPosition из Zustand
        в useEffect — позиция только у RigidBody / Rapier; modelRef — вращение и т.п., не XYZ из стора.
      */}
      <group ref={modelRef} name="PlayerVisualRoot" userData={{ isPlayer: true }}>
        {debugPlayerPrimitive ? (
          <mesh
            name="PlayerDebugPrimitive"
            position={[0, capsule.capCenterY, 0]}
            castShadow
            receiveShadow
            userData={{ isPlayer: true }}
          >
            <boxGeometry args={[capsule.r * 2, 2 * capsule.halfH + 2 * capsule.r, capsule.r * 2]} />
            <meshStandardMaterial color="#cc2222" roughness={0.45} metalness={0.08} />
          </mesh>
        ) : (
          <Suspense fallback={<ThreeCanvasSuspenseFallback />}>
            {!modelError ? (
              <GLBPlayerModel
                key={spawnSyncKey ?? modelPathToUse}
                modelPath={modelPathToUse}
                isMoving={isMoving}
                isRunning={isRunning}
                isLocked={isLocked}
                onError={handleModelError}
                roomScale={roomScale}
                targetVisualMeters={playerGltfTargetMeters}
                visualUniformMultiplier={playerGlbVisualUniformMultiplier}
                glbUniformClampSceneId={explorationGlbClampSceneId}
              />
            ) : (
              <FallbackPlayerModel isMoving={isMoving} isLocked={isLocked} roomScale={roomScale} />
            )}
          </Suspense>
        )}
      </group>

      {karmaZone === 'high' && (
        <pointLight
          position={[0, 1.4 * roomScale, 0]}
          intensity={0.55}
          distance={4 * roomScale}
          color="#fcd34d"
          decay={2}
        />
      )}
      {karmaZone === 'low' && (
        <>
          <pointLight
            position={[0.08 * roomScale, 1.55 * roomScale, 0.18 * roomScale]}
            intensity={0.35}
            distance={1.2}
            color="#b91c1c"
            decay={2}
          />
          <pointLight
            position={[-0.08 * roomScale, 1.55 * roomScale, 0.18 * roomScale]}
            intensity={0.35}
            distance={1.2}
            color="#b91c1c"
            decay={2}
          />
        </>
      )}

      {/* Тень под игроком: чуть выше пола + без depthWrite, чтобы не бороться с полом (Z / «пропадание»). */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]} renderOrder={2}>
        <circleGeometry args={[Math.max(0.22, 0.5 * roomScale), 32]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.28}
          depthWrite={false}
          depthTest
        />
      </mesh>
    </RigidBody>
  );
}));

export default PhysicsPlayer;
