"use client";

import React, { useRef, useEffect, useMemo, useState, memo, forwardRef, useImperativeHandle, Suspense, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { RigidBody, RapierRigidBody, CapsuleCollider, useRapier, useBeforePhysicsStep } from '@react-three/rapier';
import type { KinematicCharacterController } from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { usePlayerControls, PHYSICS_CONSTANTS, type PlayerControls } from '@/hooks/useGamePhysics';
import { usePlayerFootsteps } from '@/hooks/usePlayerFootsteps';
import { getDefaultPlayerModelPath, isValidPlayerGlbPath, rewriteLegacyModelPath } from '@/config/modelUrls';
import { useGameStore } from '@/store/gameStore';

// ============================================
// TYPES
// ============================================

export interface PhysicsPlayerProps {
  position?: [number, number, number];
  modelPath?: string;
  /** Визуальный масштаб GLB/заглушки игрока (коллайдер Rapier без изменений). См. `getExplorationCharacterModelScale`. */
  visualModelScale?: number;
  onPositionChange?: (position: { x: number; y: number; z: number }) => void;
  onInteraction?: () => void;
  isLocked?: boolean;
  initialRotation?: number;
  /** Тач-панель (см. `ExplorationMobileHud`): движение объединяется с клавиатурой. */
  virtualControlsRef?: React.MutableRefObject<Partial<PlayerControls>>;
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
  isLocked
}: {
  isMoving: boolean;
  isLocked: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

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

  return (
    <group ref={groupRef}>
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
  isLocked,
  onError,
}: {
  modelPath: string;
  isMoving: boolean;
  isLocked: boolean;
  onError: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene: loadedScene, animations } = useGLTF(modelPath) as any;
  const { actions } = useAnimations(animations || [], groupRef);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  // Очистка кэша при размонтировании для предотвращения утечек памяти
  useEffect(() => {
    return () => {
      useGLTF.clear(modelPath);
    };
  }, [modelPath]);

  /** Без `Object3D.clone(true)` для skinned GLB: клон часто оставляет меш невидимым (видна только декаль тени). */
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
      return loadedScene;
    } catch {
      onError();
      return null;
    }
  }, [loadedScene, onError]);

  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;

    const animationNames = Object.keys(actions);
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

    if (targetAnim && actions[targetAnim] && currentAction !== targetAnim) {
      if (currentAction && actions[currentAction]) {
        actions[currentAction].fadeOut(0.2);
      }
      actions[targetAnim].reset().fadeIn(0.2).play();
      // Defer setState to avoid cascading renders
      const timer = setTimeout(() => setCurrentAction(targetAnim), 0);
      return () => clearTimeout(timer);
    }
  }, [actions, isMoving, currentAction]);

  if (!displayScene) return null;

  return (
    <group ref={groupRef} scale={[1, 1, 1]}>
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

const DEFAULT_PHYSICS_DT = 1 / 60;

export const PhysicsPlayer = memo(forwardRef<PhysicsPlayerRef, PhysicsPlayerProps>(function PhysicsPlayer(
  {
    position = [0, 1, 3],
    modelPath,
    visualModelScale = 1,
    onPositionChange,
    onInteraction,
    isLocked = false,
    initialRotation = 0,
    virtualControlsRef,
  },
  ref
) {
  const { world } = useRapier();
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const characterControllerRef = useRef<KinematicCharacterController | null>(null);
  const modelRef = useRef<THREE.Group>(null);
  const karma = useGameStore((s) => s.playerState.karma);
  const canJumpRef = useRef(true);
  const groundedRef = useRef(false);
  const isRunningRef = useRef(false);
  const verticalVelRef = useRef(0);
  const horizVelXRef = useRef(0);
  const horizVelZRef = useRef(0);
  const moveYawRef = useRef(initialRotation);
  const [rotation, setRotation] = useState(initialRotation);
  const [isMoving, setIsMoving] = useState(false);
  const [modelError, setModelError] = useState(false);
  const onInteractionRef = useRef(onInteraction);
  const isLockedRef = useRef(isLocked);

  useEffect(() => {
    onInteractionRef.current = onInteraction;
  }, [onInteraction]);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

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
  getControlsRef.current = getControls;

  useEffect(() => {
    const cc = world.createCharacterController(0.06);
    cc.setSlideEnabled(true);
    cc.setUp({ x: 0, y: 1, z: 0 });
    cc.enableAutostep(0.35, 0.25, false);
    cc.enableSnapToGround(0.45);
    cc.setMaxSlopeClimbAngle(Math.PI * 0.45);
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
    getRotation: () => rotation,
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
  }), [rotation, position]);

  usePlayerFootsteps({
    rigidBodyRef,
    groundedRef,
    horizVelXRef,
    horizVelZRef,
    isLockedRef,
    isRunningRef,
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

    const dtRaw = stepWorld.timestep;
    const dt = dtRaw > 1e-6 && dtRaw < 0.25 ? dtRaw : DEFAULT_PHYSICS_DT;
    const controls = getControlsRef.current();
    const n = rb.numColliders();
    if (n < 1) return;
    const collider = rb.collider(0);

    let moveX = 0;
    let moveZ = 0;
    if (controls.forward) moveZ -= 1;
    if (controls.backward) moveZ += 1;
    if (controls.left) moveX -= 1;
    if (controls.right) moveX += 1;

    const len = Math.hypot(moveX, moveZ);
    if (len > 0) {
      moveX /= len;
      moveZ /= len;
    }

    const speed = controls.run ? PHYSICS_CONSTANTS.RUN_SPEED : PHYSICS_CONSTANTS.WALK_SPEED;
    isRunningRef.current = controls.run;
    const yaw = moveYawRef.current;
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    const rotatedX = moveX * cos - moveZ * sin;
    const rotatedZ = moveX * sin + moveZ * cos;
    const targetVelX = rotatedX * speed;
    const targetVelZ = rotatedZ * speed;

    const accel = 14;
    const t = 1 - Math.exp(-accel * dt);
    horizVelXRef.current = THREE.MathUtils.lerp(horizVelXRef.current, targetVelX, t);
    horizVelZRef.current = THREE.MathUtils.lerp(horizVelZRef.current, targetVelZ, t);

    const g = stepWorld.gravity.y;
    verticalVelRef.current += g * dt;

    if (groundedRef.current && controls.jump && canJumpRef.current) {
      verticalVelRef.current = PHYSICS_CONSTANTS.JUMP_FORCE;
      canJumpRef.current = false;
    }

    const dx = horizVelXRef.current * dt;
    const dy = verticalVelRef.current * dt;
    const dz = horizVelZRef.current * dt;

    cc.computeColliderMovement(collider, { x: dx, y: dy, z: dz });
    const m = cc.computedMovement();
    const t0 = rb.translation();
    rb.setNextKinematicTranslation({ x: t0.x + m.x, y: t0.y + m.y, z: t0.z + m.z });

    const grounded = cc.computedGrounded();
    groundedRef.current = grounded;
    if (grounded) {
      if (verticalVelRef.current < 0) {
        verticalVelRef.current = 0;
      }
      if (!controls.jump) {
        canJumpRef.current = true;
      }
    }
  });

  // Визуал: поворот модели и колбэк позиции (после шага Rapier mesh уже интерполирован).
  useFrame(() => {
    if (!rigidBodyRef.current) {
      setIsMoving(false);
      return;
    }

    if (isLocked) {
      setIsMoving(false);
      if (modelRef.current) {
        modelRef.current.rotation.y = rotation;
      }
      moveYawRef.current = rotation;
      if (onPositionChange) {
        const p = rigidBodyRef.current.translation();
        onPositionChange({ x: p.x, y: p.y, z: p.z });
      }
      return;
    }

    const hx = horizVelXRef.current;
    const hz = horizVelZRef.current;
    const moving = Math.hypot(hx, hz) > 0.12;
    setIsMoving(moving);

    if (moving) {
      const targetRotation = Math.atan2(hx, hz);
      setRotation((prev) => {
        let diff = targetRotation - prev;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return prev + diff * 0.1;
      });
    }

    if (modelRef.current) {
      modelRef.current.rotation.y = rotation;
    }

    moveYawRef.current = rotation;

    if (onPositionChange) {
      const p = rigidBodyRef.current.translation();
      onPositionChange({ x: p.x, y: p.y, z: p.z });
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
      position={position}
      type="kinematicPosition"
      colliders={false}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider
        args={[PHYSICS_CONSTANTS.PLAYER_HEIGHT / 2 - PHYSICS_CONSTANTS.PLAYER_RADIUS, PHYSICS_CONSTANTS.PLAYER_RADIUS]}
        position={[0, PHYSICS_CONSTANTS.PLAYER_HEIGHT / 2, 0]}
      />

      <group ref={modelRef} scale={visualModelScale}>
        <Suspense fallback={<FallbackPlayerModel isMoving={isMoving} isLocked={isLocked} />}>
          {!modelError ? (
            <GLBPlayerModel
              modelPath={modelPathToUse}
              isMoving={isMoving}
              isLocked={isLocked}
              onError={handleModelError}
            />
          ) : (
            <FallbackPlayerModel isMoving={isMoving} isLocked={isLocked} />
          )}
        </Suspense>
      </group>

      {karma > 70 && (
        <pointLight position={[0, 1.4, 0]} intensity={0.55} distance={4} color="#fcd34d" decay={2} />
      )}
      {karma < 30 && (
        <>
          <pointLight position={[0.08, 1.55, 0.18]} intensity={0.35} distance={1.2} color="#b91c1c" decay={2} />
          <pointLight position={[-0.08, 1.55, 0.18]} intensity={0.35} distance={1.2} color="#b91c1c" decay={2} />
        </>
      )}

      {/* Тень под игроком */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </RigidBody>
  );
}));

export default PhysicsPlayer;
