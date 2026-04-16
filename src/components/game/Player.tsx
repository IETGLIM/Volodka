// components/game/Player.tsx
"use client";

import React, { useRef, useEffect, useState, memo, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

// ============================================
// КОНСТАНТЫ
// ============================================
const MOVE_SPEED = 4;
const JUMP_FORCE = 6;

// ============================================
// FALLBACK МОДЕЛЬ (ВСЕГДА ВИДИМА)
// ============================================
interface PlayerModelProps {
  isLocked: boolean;
  isMoving: boolean;
}

const FallbackPlayerModel = memo(function FallbackPlayerModel({ isLocked, isMoving }: PlayerModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = isMoving ? Math.abs(Math.sin(t * 8)) * 0.05 : Math.sin(t * 2) * 0.02;
    }
    if (isMoving) {
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * 12) * 0.4;
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * 12 + Math.PI) * 0.4;
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Тело */}
      <group position={[0, 0.9, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
          <meshStandardMaterial color="#2d3748" roughness={0.7} />
        </mesh>
      </group>
      {/* Голова */}
      <group position={[0, 1.6, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#e8d5c4" roughness={0.85} />
        </mesh>
      </group>
      {/* Левая нога */}
      <group ref={leftLegRef} position={[-0.12, 0.4, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.35, 4, 8]} />
          <meshStandardMaterial color="#1a202c" roughness={0.8} />
        </mesh>
      </group>
      {/* Правая нога */}
      <group ref={rightLegRef} position={[0.12, 0.4, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.35, 4, 8]} />
          <meshStandardMaterial color="#1a202c" roughness={0.8} />
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
// КОМПОНЕНТ ИГРОКА С ФИЗИКОЙ
// ============================================
export interface PlayerProps {
  position?: [number, number, number];
  onPositionChange?: (position: { x: number; y: number; z: number }) => void;
  onInteraction?: () => void;
  isLocked?: boolean;
}

export interface PlayerRef {
  getPosition: () => { x: number; y: number; z: number };
  getRotation: () => number;
  teleport: (x: number, y: number, z: number) => void;
}

export const Player = memo(forwardRef<PlayerRef, PlayerProps>(function Player(
  {
    position = [0, 2, 3],
    onPositionChange,
    onInteraction,
    isLocked = false
  },
  ref
) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const modelRef = useRef<THREE.Group>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const canJumpRef = useRef(true);
  const [rotation, setRotation] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const isMovingRef = useRef(false);

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
  }), [rotation, position]);

  // Обработка клавиатуры
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);

      if (e.code === 'Space' && canJumpRef.current && !isLocked) {
        e.preventDefault();
        if (rigidBodyRef.current) {
          const vel = rigidBodyRef.current.linvel();
          rigidBodyRef.current.setLinvel({ x: vel.x, y: JUMP_FORCE, z: vel.z }, true);
          canJumpRef.current = false;
        }
      }

      if (e.code === 'KeyE' && onInteraction && !isLocked) {
        onInteraction();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onInteraction, isLocked]);

  // Обновление физики каждый кадр
  useFrame(() => {
    if (!rigidBodyRef.current || isLocked) {
      if (isMovingRef.current) {
        isMovingRef.current = false;
        setIsMoving(false);
      }
      return;
    }

    const keys = keysRef.current;
    let vx = 0, vz = 0;

    if (keys.has('KeyW') || keys.has('ArrowUp')) vz = -MOVE_SPEED;
    if (keys.has('KeyS') || keys.has('ArrowDown')) vz = MOVE_SPEED;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) vx = -MOVE_SPEED;
    if (keys.has('KeyD') || keys.has('ArrowRight')) vx = MOVE_SPEED;

    if (vx !== 0 && vz !== 0) {
      const factor = 1 / Math.sqrt(2);
      vx *= factor;
      vz *= factor;
    }

    const moving = Math.abs(vx) > 0.1 || Math.abs(vz) > 0.1;

    if (moving !== isMovingRef.current) {
      isMovingRef.current = moving;
      setIsMoving(moving);
    }

    const currentVel = rigidBodyRef.current.linvel();
    const currentPos = rigidBodyRef.current.translation();

    // Проверка земли (грубая, по высоте)
    if (currentPos.y <= 1.1 && currentVel.y <= 0.1) {
      canJumpRef.current = true;
    }

    rigidBodyRef.current.setLinvel({ x: vx, y: currentVel.y, z: vz }, true);

    // Ограничение позиции (чтобы не вылететь за пределы комнаты)
    const clampedX = Math.max(-8, Math.min(8, currentPos.x));
    const clampedZ = Math.max(-8, Math.min(8, currentPos.z));

    if (clampedX !== currentPos.x || clampedZ !== currentPos.z) {
      rigidBodyRef.current.setTranslation({ x: clampedX, y: currentPos.y, z: clampedZ }, true);
    }

    // Поворот в сторону движения
    if (moving) {
      const targetRotation = Math.atan2(vx, vz);
      setRotation(prev => {
        let diff = targetRotation - prev;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return prev + diff * 0.1;
      });
    }

    if (onPositionChange) {
      const finalPos = rigidBodyRef.current.translation();
      onPositionChange({ x: finalPos.x, y: finalPos.y, z: finalPos.z });
    }

    if (modelRef.current) {
      modelRef.current.rotation.y = rotation;
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      type="dynamic"
      colliders={false}
      mass={1}
      lockRotations
      linearDamping={0.5}
    >
      <CapsuleCollider args={[0.5, 0.3]} position={[0, 0.8, 0]} />

      <group ref={modelRef}>
        <FallbackPlayerModel isLocked={isLocked} isMoving={isMoving} />
      </group>

      {/* Тень */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </RigidBody>
  );
}));

export default Player;
