"use client";

import React, { useRef, useEffect, useMemo, useState, memo, forwardRef, useImperativeHandle, Suspense, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { usePlayerControls, PHYSICS_CONSTANTS, type PlayerControls } from '@/hooks/useGamePhysics';
import { getDefaultPlayerModelPath, isValidPlayerGlbPath, rewriteLegacyModelPath } from '@/config/modelUrls';

// ============================================
// TYPES
// ============================================

export interface PhysicsPlayerProps {
  position?: [number, number, number];
  modelPath?: string;
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

  const clonedScene = useMemo(() => {
    if (!loadedScene) {
      onError();
      return null;
    }
    try {
      const clone = loadedScene.clone(true);
      clone.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      return clone;
    } catch {
      onError();
      return null;
    }
  }, [loadedScene, onError]);

  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;

    const animationNames = Object.keys(actions);
    const idleAnim = animationNames.find(n => n.toLowerCase().includes('idle')) || animationNames[0];
    const walkAnim = animationNames.find(n => n.toLowerCase().includes('walk') || n.toLowerCase().includes('run'));

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

  if (!clonedScene) return null;

  return (
    <group ref={groupRef} scale={[1, 1, 1]}>
      <primitive object={clonedScene} />
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

export const PhysicsPlayer = memo(forwardRef<PhysicsPlayerRef, PhysicsPlayerProps>(function PhysicsPlayer(
  {
    position = [0, 1, 3],
    modelPath,
    onPositionChange,
    onInteraction,
    isLocked = false,
    initialRotation = 0,
    virtualControlsRef,
  },
  ref
) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const modelRef = useRef<THREE.Group>(null);
  const canJumpRef = useRef(true);
  const [rotation, setRotation] = useState(initialRotation);
  const [isMoving, setIsMoving] = useState(false);
  const [modelError, setModelError] = useState(false);
  const onInteractionRef = useRef(onInteraction);
  const isLockedRef = useRef(isLocked);
  onInteractionRef.current = onInteraction;
  isLockedRef.current = isLocked;

  const handleInteractPress = useCallback(() => {
    if (onInteractionRef.current && !isLockedRef.current) {
      onInteractionRef.current();
    }
  }, []);

  const { getControls } = usePlayerControls({
    onInteractPress: handleInteractPress,
    virtualControlsRef,
  });

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
        rigidBodyRef.current.setTranslation({ x, y, z }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }
    },
    getRigidBody: () => rigidBodyRef.current,
  }), [rotation, position]);

  // Обновление физики
  useFrame((_, delta) => {
    if (!rigidBodyRef.current || isLocked) {
      setIsMoving(false);
      return;
    }

    const controls = getControls();
    const currentVel = rigidBodyRef.current.linvel();
    const currentPos = rigidBodyRef.current.translation();

    // Вычисляем направление движения
    let moveX = 0;
    let moveZ = 0;

    if (controls.forward) moveZ -= 1;
    if (controls.backward) moveZ += 1;
    if (controls.left) moveX -= 1;
    if (controls.right) moveX += 1;

    // Нормализация диагонального движения
    const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (length > 0) {
      moveX /= length;
      moveZ /= length;
    }

    const speed = controls.run ? PHYSICS_CONSTANTS.RUN_SPEED : PHYSICS_CONSTANTS.WALK_SPEED;

    // Применяем поворот камеры к движению
    const sin = Math.sin(rotation);
    const cos = Math.cos(rotation);
    const rotatedX = moveX * cos - moveZ * sin;
    const rotatedZ = moveX * sin + moveZ * cos;

    // Целевая скорость
    const targetVelX = rotatedX * speed;
    const targetVelZ = rotatedZ * speed;

    // Плавное изменение скорости
    const friction = 0.15;
    const newVelX = THREE.MathUtils.lerp(currentVel.x, targetVelX, friction);
    const newVelZ = THREE.MathUtils.lerp(currentVel.z, targetVelZ, friction);

    const groundedNear =
      currentPos.y <= PHYSICS_CONSTANTS.PLAYER_HEIGHT * 0.65 + 0.15 && currentVel.y <= 0.35;
    if (groundedNear) {
      canJumpRef.current = true;
    }

    let newVelY = currentVel.y;
    if (controls.jump && canJumpRef.current && !isLocked) {
      newVelY = PHYSICS_CONSTANTS.JUMP_FORCE;
      canJumpRef.current = false;
    }

    rigidBodyRef.current.setLinvel({ x: newVelX, y: newVelY, z: newVelZ }, true);

    // Определяем движение
    const moving = Math.abs(newVelX) > 0.1 || Math.abs(newVelZ) > 0.1;
    setIsMoving(moving);

    // Поворот модели в сторону движения
    if (moving) {
      const targetRotation = Math.atan2(newVelX, newVelZ);
      setRotation(prev => {
        let diff = targetRotation - prev;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return prev + diff * 0.1;
      });
    }

    // Обновляем поворот модели
    if (modelRef.current) {
      modelRef.current.rotation.y = rotation;
    }

    // Уведомляем об изменении позиции
    if (onPositionChange) {
      onPositionChange({ x: currentPos.x, y: currentPos.y, z: currentPos.z });
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
      type="dynamic"
      colliders={false}
      enabledRotations={[false, false, false]}
      linearDamping={0.5}
      angularDamping={1}
      gravityScale={1}
    >
      <CapsuleCollider
        args={[PHYSICS_CONSTANTS.PLAYER_HEIGHT / 2 - PHYSICS_CONSTANTS.PLAYER_RADIUS, PHYSICS_CONSTANTS.PLAYER_RADIUS]}
        position={[0, PHYSICS_CONSTANTS.PLAYER_HEIGHT / 2, 0]}
      />

      <group ref={modelRef}>
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

      {/* Тень под игроком */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </RigidBody>
  );
}));

export default PhysicsPlayer;
