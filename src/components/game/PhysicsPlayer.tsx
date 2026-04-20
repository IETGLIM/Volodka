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
import { PLAYER_GLB_TARGET_VISUAL_METERS } from '@/lib/playerScaleConstants';
import { retainGltfModelUrl, releaseGltfModelUrl } from '@/lib/gltfModelCache';
import { applyGltfExplorationCharacterMaterialPolicies } from '@/lib/gltfCharacterMaterialPolicy';
import { ThreeCanvasSuspenseFallback } from '@/components/3d/ThreeCanvasSuspenseFallback';
import { cloneAnimationClipsWithoutExplorationPlayerRootMotion } from '@/lib/stripExplorationPlayerRootMotionFromClips';
import { isExplorationPlayerDebugPrimitiveEnabled } from '@/lib/explorationPlayerDebugPrimitive';
import { isExplorationPlayerLocomotionLogEnabled } from '@/lib/explorationDiagnostics';
import { useGameStore } from '@/store/gameStore';

// ============================================
// TYPES
// ============================================

export interface PhysicsPlayerProps {
  position?: [number, number, number];
  modelPath?: string;
  /**
   * Масштаб персонажа в помещении (`getExplorationCharacterModelScale`):
   * умножает капсулу Rapier и целевой размер GLB после автоподгонки по bounding box.
   */
  visualModelScale?: number;
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
  return (
    <group ref={groupRef} scale={[rs, rs, rs]}>
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

/**
 * Вертикальный размер bbox SkinnedMesh в **единицах файла** (часто ~170–240 «сантиметров» без node-scale).
 * Делитель в `TARGET/h` должен совпадать с этим числом — иначе модель раздувается (см. Volodka.glb: hRaw≈234).
 * Fallback только при слишком мелком/пустом bbox.
 */
const PLAYER_VISUAL_HEIGHT_FALLBACK_M = 1.72;

function getRootCharacterVisualHeightMeters(root: THREE.Object3D, scratch: THREE.Vector3): number {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  let foundSkinned = false;
  root.traverse((obj) => {
    if (obj instanceof THREE.SkinnedMesh && obj.geometry) {
      foundSkinned = true;
      if (!obj.geometry.boundingBox) {
        obj.geometry.computeBoundingBox();
      }
      const local = obj.geometry.boundingBox;
      if (!local || local.isEmpty()) return;
      const tmp = local.clone();
      tmp.applyMatrix4(obj.matrixWorld);
      box.union(tmp);
    }
  });
  if (!foundSkinned || box.isEmpty()) {
    box.setFromObject(root);
  }
  const hRaw = box.getSize(scratch).y;
  if (!Number.isFinite(hRaw) || hRaw < 1e-4) {
    return PLAYER_VISUAL_HEIGHT_FALLBACK_M;
  }
  // Слишком мелкий Y — битый bbox (делитель маленький → гигантский mesh).
  if (hRaw < 0.55) {
    return PLAYER_VISUAL_HEIGHT_FALLBACK_M;
  }
  return hRaw;
}

const GLBPlayerModel = memo(function GLBPlayerModel({
  modelPath,
  isMoving,
  isLocked,
  onError,
  roomScale,
}: {
  modelPath: string;
  isMoving: boolean;
  isLocked: boolean;
  onError: () => void;
  /** Множитель комнаты; итоговая высота ≈ `PLAYER_GLB_TARGET_VISUAL_METERS * roomScale`. */
  roomScale: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene: loadedScene, animations } = useGLTF(modelPath) as any;
  /** Шаг 4: без root translation на клонах — не дублировать сдвиг с kinematic Rapier. */
  const mixerAnimations = useMemo(
    () => cloneAnimationClipsWithoutExplorationPlayerRootMotion(animations as THREE.AnimationClip[] | undefined),
    [animations],
  );
  const { actions } = useAnimations(mixerAnimations, groupRef);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const rs = Math.max(0.28, Math.min(1.25, roomScale));
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

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
    if (!loadedScene) return 0.12 * rs;
    const scratch = new THREE.Vector3();
    const h = getRootCharacterVisualHeightMeters(loadedScene, scratch);
    if (h < 1e-4) return 0.12 * rs;
    return (PLAYER_GLB_TARGET_VISUAL_METERS / h) * rs;
  }, [loadedScene, rs]);

  useEffect(() => {
    const act = actionsRef.current;
    if (!act || Object.keys(act).length === 0) return;

    const animationNames = Object.keys(act);
    const idleAnim =
      animationNames.find((n) => n.toLowerCase().includes('idle')) || animationNames[0];
    /** Один клип в GLB (напр. `Volodka.glb` — «Basic Sing Serious»): и idle, и «ходьба» без отдельного Walk. */
    const walkAnim =
      animationNames.length === 1
        ? idleAnim
        : animationNames.find(
            (n) => n.toLowerCase().includes('walk') || n.toLowerCase().includes('run'),
          );

    const targetAnim = isMoving && walkAnim ? walkAnim : idleAnim;

    if (targetAnim && act[targetAnim] && currentAction !== targetAnim) {
      if (currentAction && act[currentAction]) {
        act[currentAction].fadeOut(0.2);
      }
      act[targetAnim].reset().fadeIn(0.2).play();
      // Defer setState to avoid cascading renders
      const timer = setTimeout(() => setCurrentAction(targetAnim), 0);
      return () => clearTimeout(timer);
    }
  }, [actionKeysSig, isMoving, currentAction]);

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
    locomotionScale = 1,
    onPositionChange,
    onInteraction,
    isLocked = false,
    initialRotation = 0,
    virtualControlsRef,
    debugPlayerPrimitive = isExplorationPlayerDebugPrimitiveEnabled(),
    spawnSyncKey,
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
   * Стартовая позиция капсулы при монтировании; смена локации — **`spawnSyncKey`** + телепорт в **`useEffect`**,
   * без `key` на всём дереве GLB (см. **`RPGGameCanvas`**).
   * Нельзя прокидывать сюда координаты из Zustand каждый кадр: RigidBody синхронизирует prop с телом
   * и ломает kinematic + `setNextKinematicTranslation` (мигание, залипание, прыжок не срабатывает).
   */
  const [rigidSpawnPosition] = useState<[number, number, number]>(() => [
    position[0],
    position[1],
    position[2],
  ]);

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

    // W/A/S/D относительно текущего «вперёд» модели (`rotationRef`), а не мировых осей и не застывшего угла спавна.
    moveYawRef.current = rotationRef.current;

    const { dx, dy, dz } = integrateKinematicLocomotionDelta({
      dt,
      controls,
      locomotionScale: locomotionScaleRef.current,
      moveYaw: moveYawRef.current,
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
  useFrame((_state, _delta) => {
    const rb = rigidBodyRef.current;
    if (!rb) {
      if (isMovingSyncRef.current) {
        isMovingSyncRef.current = false;
        setIsMoving(false);
      }
      return;
    }

    if (isLockedRef.current) {
      if (isMovingSyncRef.current) {
        isMovingSyncRef.current = false;
        setIsMoving(false);
      }
      if (modelRef.current) {
        modelRef.current.rotation.y = rotationRef.current;
      }
      moveYawRef.current = rotationRef.current;
      if (onPositionChange) {
        const p = rb.translation();
        onPositionChange({ x: p.x, y: p.y, z: p.z, rotation: rotationRef.current });
      }
      return;
    }

    const hx = horizVelXRef.current;
    const hz = horizVelZRef.current;
    const moving = Math.hypot(hx, hz) > 0.12;
    if (moving !== isMovingSyncRef.current) {
      isMovingSyncRef.current = moving;
      setIsMoving(moving);
    }

    if (moving) {
      const targetRotation = Math.atan2(hx, hz);
      let prev = rotationRef.current;
      let diff = targetRotation - prev;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      rotationRef.current = prev + diff * 0.1;
    }

    if (modelRef.current) {
      modelRef.current.rotation.y = rotationRef.current;
    }

    moveYawRef.current = rotationRef.current;

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
                modelPath={modelPathToUse}
                isMoving={isMoving}
                isLocked={isLocked}
                onError={handleModelError}
                roomScale={roomScale}
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
