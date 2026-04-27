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
} from '@/engine/physics/KCC';
import {
  computeMoveActiveFromHorizontalSpeed,
  introCutsceneLocomotionFlags,
  stepExplorationVisualYawTowardVelocity,
} from '@/game/simulation/explorationMovementPresentation';
import {
  explorationGlbSingleClipTimeScale,
  planExplorationGlbLocomotionClip,
} from '@/game/simulation/explorationGlbAnimation';
import { usePlayerFootsteps } from '@/hooks/usePlayerFootsteps';
import { getDefaultPlayerModelPath, isValidPlayerGlbPath, rewriteLegacyModelPath } from '@/config/modelUrls';
import { applyExplorationPlayerGlobalVisualScale } from '@/lib/playerScaleConstants';
import type { SceneId } from '@/data/types';
import { resolveCharacterMeshUniformScale } from '@/data/modelMeta';
import {
  logGltfLoadedFootprintDev,
  recordGltfGpuByteEstimateFromScene,
  retainGltfModelUrl,
  releaseGltfModelUrl,
} from '@/lib/gltfModelCache';
import { applyGltfExplorationCharacterMaterialPolicies } from '@/lib/gltfCharacterMaterialPolicy';
import { PLAYER_VISUAL_HEIGHT_M, validateCharacterScale } from '@/lib/characterScaleValidator';
import { ThreeCanvasSuspenseFallback } from '@/ui/3d/ThreeCanvasSuspenseFallback';
import { cloneAnimationClipsWithoutExplorationPlayerRootMotion } from '@/lib/stripExplorationPlayerRootMotionFromClips';
import { isExplorationPlayerDebugPrimitiveEnabled } from '@/lib/explorationPlayerDebugPrimitive';
import {
  isExplorationPlayerGlbScaleDebugEnabled,
  isExplorationPlayerLocomotionLogEnabled,
} from '@/lib/explorationDiagnostics';
import { getExplorationCameraOrbitYawRad } from '@/lib/explorationCameraOrbitBridge';
import { useGameStore } from '@/state';
import { useGamePhaseStore } from '@/state/gamePhaseStore';
import { getIntroCutscenePlayerPose } from '@/lib/introCutscenePlayerBridge';

// ============================================
// TYPES
// ============================================

export interface PhysicsPlayerProps {
  position?: [number, number, number];
  modelPath?: string;
  /**
   * Масштаб персонажа в помещении (`getExplorationCharacterModelScale`): капсула Rapier и множитель в `resolveCharacterMeshUniformScale`.
   * Процедурный fallback — `applyExplorationPlayerGlobalVisualScale(roomScale)` в `FallbackPlayerModel`.
   */
  visualModelScale?: number;
  /**
   * Сцена для clamp uniform GLB в узких интерьерах (`modelMeta`); в интро обычно `volodka_room`, как задаёт `RPGGameCanvas`.
   */
  playerScaleTuningSceneId?: SceneId;
  /** Фаза 3D-интро: ужимание uniform из `modelMeta` (`INTRO_CUTSCENE_*`). */
  introCutsceneActive?: boolean;
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
   * Жёсткий потолок uniform GLB в узких интерьерах (`modelMeta`), без влияния на улицы.
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
  /** Согласован с `visualModelScale` сцены (узкие комнаты — меньше заглушка); тот же глобальный ÷5, что у GLB (`applyExplorationPlayerGlobalVisualScale`). */
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

    // Improved idle breathing + subtle head bob; smoother walk cycle with opposite arm/leg swing
    if (groupRef.current) {
      groupRef.current.position.y = isMoving 
        ? Math.abs(Math.sin(t * 10)) * 0.025 
        : Math.sin(t * 1.8) * 0.012; // gentler idle bob
    }

    const walkSpeed = isMoving ? 11 : 0;
    const idleSway = Math.sin(t * 1.2) * 0.08;

    if (isMoving) {
      // Natural opposite-phase walk (left leg + right arm forward)
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * walkSpeed) * 0.55;
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * walkSpeed + Math.PI) * 0.55;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * walkSpeed + Math.PI) * 0.45;
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(t * walkSpeed) * 0.45;
    } else {
      // Relaxed idle: slight natural arm droop, micro-sway, no stiff T-pose arms
      if (leftLegRef.current) leftLegRef.current.rotation.x = idleSway * 0.1;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -idleSway * 0.1;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0.15 + idleSway * 0.2; // slight forward droop
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0.25 - idleSway * 0.15; // natural asymmetry
    }

    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.6) * 0.07; // gentler, more natural head turn
      headRef.current.rotation.x = isMoving ? 0 : Math.sin(t * 0.8) * 0.03; // subtle nod in idle
    }
  });

  const rs = Math.max(0.28, Math.min(1.25, roomScale));
  /** Один глобальный визуальный шаг, как у GLB — не дублировать ÷5 на `visualModelScale` (он без ÷5). */
  const vis = applyExplorationPlayerGlobalVisualScale(rs);
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

        {/* Руки — improved proportions and slight natural bend for better idle (no T-pose) */}
        <group ref={leftArmRef} position={[-0.28, 0.22, 0.02]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.28, 4, 12]} />
            <meshStandardMaterial color="#4a5568" roughness={0.75} metalness={0.1} />
          </mesh>
          {/* subtle elbow */}
          <mesh position={[0.02, -0.38, 0.04]} castShadow>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshStandardMaterial color="#3a4558" roughness={0.8} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.28, 0.22, 0.02]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.28, 4, 12]} />
            <meshStandardMaterial color="#4a5568" roughness={0.75} metalness={0.1} />
          </mesh>
          {/* subtle elbow + techsupport notepad hint */}
          <mesh position={[-0.02, -0.38, -0.03]} castShadow>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshStandardMaterial color="#3a4558" roughness={0.8} />
          </mesh>
          <group position={[0.08, -0.48, 0.12]}>
            <mesh castShadow>
              <boxGeometry args={[0.14, 0.02, 0.19]} />
              <meshStandardMaterial color="#e8d5c4" roughness={0.9} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ГОЛОВА — improved cyber-poet look with better neck, subtle hair shadow, refined glasses */}
      <group ref={headRef} position={[0, 1.58, 0]}>
        {/* Neck connector */}
        <mesh position={[0, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.18, 12]} />
          <meshStandardMaterial color="#2d3748" roughness={0.85} />
        </mesh>
        <mesh castShadow>
          <sphereGeometry args={[0.23, 20, 20]} />
          <meshStandardMaterial color="#e8d5c4" roughness={0.78} metalness={0.05} />
        </mesh>
        {/* Hair/beard shadow layer */}
        <mesh position={[0, 0.09, -0.04]} castShadow>
          <sphereGeometry args={[0.245, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
          <meshStandardMaterial color="#1f2a38" roughness={0.9} transparent opacity={0.75} />
        </mesh>
        {/* Refined glasses with slight reflection */}
        <group position={[0, 0.05, 0.21]}>
          <mesh position={[-0.09, 0.01, 0]}>
            <torusGeometry args={[0.055, 0.006, 8, 20]} />
            <meshStandardMaterial color="#111" metalness={0.9} roughness={0.15} />
          </mesh>
          <mesh position={[0.09, 0.01, 0]}>
            <torusGeometry args={[0.055, 0.006, 8, 20]} />
            <meshStandardMaterial color="#111" metalness={0.9} roughness={0.15} />
          </mesh>
          {/* bridge */}
          <mesh position={[0, 0.015, -0.01]}>
            <boxGeometry args={[0.08, 0.008, 0.015]} />
            <meshStandardMaterial color="#222" metalness={0.85} roughness={0.2} />
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
  tuningSceneId,
  introCutsceneActive = false,
  glbUniformClampSceneId,
}: {
  modelPath: string;
  isMoving: boolean;
  isRunning: boolean;
  isLocked: boolean;
  onError: () => void;
  /** Множитель комнаты (`explorationCharacterModelScale`); вход в `resolveCharacterMeshUniformScale`. */
  roomScale: number;
  tuningSceneId: SceneId;
  introCutsceneActive?: boolean;
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
  const prevTargetAnimRef = useRef<string | null>(null);
  const idleKeyForTimeScaleRef = useRef<string>('');
  const singleClipModeRef = useRef(false);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  /** Стабильный ключ набора экшенов: ссылка `actions` от drei может меняться без смены клипов. */
  const actionKeysSig = useMemo(() => {
    if (!actions) return '';
    return Object.keys(actions)
      .filter((k) => actions[k])
      .sort()
      .join('\0');
  }, [actions]);

  const visualUniform = useMemo(
    () =>
      resolveCharacterMeshUniformScale(modelPath, {
        roomModelScale: rs,
        definitionModelScale: 1,
        introCutsceneActive,
        clampSceneId: glbUniformClampSceneId ?? tuningSceneId,
      }),
    [modelPath, rs, introCutsceneActive, glbUniformClampSceneId, tuningSceneId],
  );

  /**
   * Пара к `useGLTF(modelPath)`: `retain` при монтироване / смене пути, `release` в cleanup — и при смене
   * `modelPath` (React сначала cleanup старого URL), и при **размонтировании** (в т.ч. из‑за `key` на родителе).
   * Выгрузка из кэша drei — в `releaseGltfModelUrl` (`gltfModelCache.ts`, отложенный clear с grace).
   */
  useEffect(() => {
    retainGltfModelUrl(modelPath);
    return () => releaseGltfModelUrl(modelPath);
  }, [modelPath]);

  useEffect(() => {
    if (!loadedScene) return;
    recordGltfGpuByteEstimateFromScene(modelPath, loadedScene);
    logGltfLoadedFootprintDev(modelPath, loadedScene);
  }, [modelPath, loadedScene]);

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
      /** Кривой экспорт: ненулевой `scale` на корне сцены умножается с нашим uniform → «нога на весь экран». */
      if (loadedScene.scale.x !== 1 || loadedScene.scale.y !== 1 || loadedScene.scale.z !== 1) {
        console.warn('[GLBPlayerModel] GLB root had non-unit scale; reset to (1,1,1) before policies.', {
          modelPath,
          scale: [loadedScene.scale.x, loadedScene.scale.y, loadedScene.scale.z],
        });
        loadedScene.scale.set(1, 1, 1);
        loadedScene.updateMatrixWorld(true);
      }
      applyGltfExplorationCharacterMaterialPolicies(loadedScene, {
        explorationVisualUniform: visualUniform,
      });
      return loadedScene;
    } catch {
      onError();
      return null;
    }
  }, [
    loadedScene,
    onError,
    modelPath,
    visualUniform,
  ]);

  useEffect(() => {
    if (!loadedScene) return;
    if (!isExplorationPlayerGlbScaleDebugEnabled()) return;
    const u = visualUniform;
    const bbox = loadedScene.userData.characterBoundingVerticalM as number | undefined;
    const hM = loadedScene.userData.characterHeightM as number | undefined;
    const scaleOk = bbox != null && Number.isFinite(bbox) ? validateCharacterScale(modelPath, bbox, u) : 'ok';
    const ok = scaleOk === 'ok';
    const detail = scaleOk === 'ok' ? {} : { validation: scaleOk };
    const rawLabel =
      hM != null && Number.isFinite(hM)
        ? `сырой bbox×uniform ${hM.toFixed(2)} (ориентир «~${PLAYER_VISUAL_HEIGHT_M} м» на экране — по политике сцены)`
        : '(нет оценки bbox×uniform)';
    console.info(
      `%c[GLBPlayerModel scale debug]%c ${rawLabel} · uniform ${u.toFixed(4)}`,
      ok ? 'color:#16a34a;font-weight:bold' : 'color:#dc2626;font-weight:bold',
      'color:inherit;font-weight:normal',
      { modelPath, tuningSceneId, ...detail },
    );
  }, [modelPath, loadedScene, tuningSceneId, visualUniform]);

  useEffect(() => {
    const act = actionsRef.current;
    if (!act || Object.keys(act).length === 0) return;

    const animationNames = Object.keys(act);
    const plan = planExplorationGlbLocomotionClip(animationNames, isMoving, isRunning);
    if (!plan) return;

    idleKeyForTimeScaleRef.current = plan.idleAnim;
    singleClipModeRef.current = plan.singleClipMode;

    const targetAnim = plan.targetAnim;
    if (!act[targetAnim]) return;
    if (targetAnim === prevTargetAnimRef.current) return;

    const prevKey = prevTargetAnimRef.current;
    const prevAction = prevKey && act[prevKey] ? act[prevKey]! : null;
    const nextAction = act[targetAnim]!;
    for (const key of Object.keys(act)) {
      const a = act[key];
      if (!a || a === nextAction) continue;
      if (a === prevAction) continue;
      if (a.isRunning()) a.stop();
    }
    const duration = 0.26;
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
    a.setEffectiveTimeScale(explorationGlbSingleClipTimeScale(isMoving));
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
    playerScaleTuningSceneId = 'volodka_room',
    introCutsceneActive = false,
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
   * Только `setNextKinematicTranslation`: `setTranslation(..., wake=true)` на кинематике даёт лишний wake и
   * может конфликтовать с `useBeforePhysicsStep` в том же кадре; Rapier применит позицию на шаге симуляции.
   */
  useLayoutEffect(() => {
    if (spawnSyncKey === undefined) return;
    const rb = rigidBodyRef.current;
    if (!rb) return;
    const x = position[0];
    const y = position[1];
    const z = position[2];
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
    /** Явный варп: как при смене `spawnSyncKey` — только `setNextKinematicTranslation` (кинематическое тело). */
    teleport: (x: number, y: number, z: number) => {
      if (rigidBodyRef.current) {
        const p = { x, y, z };
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
          const { walk, run } = introCutsceneLocomotionFlags(cut.horizontalSpeed);
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
    const wasActive = moveActiveRef.current;
    const nextActive = computeMoveActiveFromHorizontalSpeed(speed, wasActive);
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
      /**
       * Поворот визуала к направлению **мировой** горизонтальной скорости (`hx`,`hz` из KCC), не к орбите камеры.
       *
       * **Только S (без W):** вектор скорости указывает «куда уезжаем» — назад относительно камеры.
       * `atan2(hx, hz)` развернул бы модель лицом в эту скорость (~180° к привычному «взгляду в сторону камеры»),
       * и при TPS-орбите получается ощущение лишнего кручения. Инверсия `(-hx,-hz)` даёт yaw на **противоположный**
       * к скорости азимут: модель остаётся ориентированнее к направлению «вперёд по сцене», пока ноги уезжают назад.
       *
       * Альтернатива «как в классическом TPS»: зафиксировать `rotationRef` на `-orbit` (как при `isLocked`) и
       * различать назад только анимацией (walk back) — отдельная задача; текущий вариант осознанный компромисс.
       */
      rotationRef.current = stepExplorationVisualYawTowardVelocity({
        prevYaw: rotationRef.current,
        hx,
        hz,
        controls: ctrl,
        frameDeltaSec: frameDelta,
      });
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
                tuningSceneId={playerScaleTuningSceneId}
                introCutsceneActive={introCutsceneActive}
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
