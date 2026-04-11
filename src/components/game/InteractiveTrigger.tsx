"use client";

import { useRef, useState, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TriggerZone, TriggerState } from '@/data/rpgTypes';
import type { SceneId } from '@/data/types';

// ============================================
// ТРИГГЕРНАЯ ЗОНА (без физики)
// ============================================

interface InteractiveTriggerProps {
  trigger: TriggerZone;
  state: TriggerState;
  playerPosition: { x: number; y: number; z: number };
  onEnter: (triggerId: string) => void;
  onInteract: (triggerId: string) => void;
  onStateChange: (state: TriggerState) => void;
}

export const InteractiveTrigger = memo(function InteractiveTrigger({
  trigger,
  state,
  playerPosition,
  onEnter,
  onInteract,
  onStateChange,
}: InteractiveTriggerProps) {
  const [isPlayerInside, setIsPlayerInside] = useState(false);
  const wasInside = useRef(false);

  useEffect(() => {
    const dx = playerPosition.x - trigger.position.x;
    const dy = playerPosition.y - trigger.position.y;
    const dz = playerPosition.z - trigger.position.z;

    const inside = 
      Math.abs(dx) < trigger.size.x / 2 &&
      Math.abs(dy) < trigger.size.y / 2 &&
      Math.abs(dz) < trigger.size.z / 2;

    if (inside && !wasInside.current && !state.triggered) {
      if (!trigger.requiresInteraction) {
        onEnter(trigger.id);
        if (trigger.oneTime) {
          onStateChange({ id: trigger.id, triggered: true, triggeredAt: Date.now() });
        }
      }
    }

    wasInside.current = inside;
    const timer = setTimeout(() => setIsPlayerInside(inside), 0);
    return () => clearTimeout(timer);
  }, [playerPosition, trigger, state.triggered, onEnter, onStateChange]);

  const showDebug = false;

  return (
    <>
      {/* Debug visualization */}
      {showDebug && (
        <mesh position={[trigger.position.x, trigger.position.y, trigger.position.z]}>
          <boxGeometry args={[trigger.size.x, trigger.size.y, trigger.size.z]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.3} />
        </mesh>
      )}

      {isPlayerInside && trigger.requiresInteraction && !state.triggered && (
        <group position={[trigger.position.x, trigger.position.y + 1, trigger.position.z]}>
          <mesh>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        </group>
      )}
    </>
  );
});

// ============================================
// СИСТЕМА ТРИГГЕРОВ
// ============================================

interface TriggerSystemProps {
  triggers: TriggerZone[];
  triggerStates: Record<string, TriggerState>;
  playerPosition: { x: number; y: number; z: number };
  currentSceneId: SceneId;
  onTriggerEnter: (triggerId: string) => void;
  onTriggerInteract: (triggerId: string) => void;
  onTriggerStateChange: (triggerId: string, state: TriggerState) => void;
}

export const TriggerSystem = memo(function TriggerSystem({
  triggers,
  triggerStates,
  playerPosition,
  currentSceneId,
  onTriggerEnter,
  onTriggerInteract,
  onTriggerStateChange,
}: TriggerSystemProps) {
  const sceneTriggers = triggers.filter(t => t.sceneId === currentSceneId);

  return (
    <>
      {sceneTriggers.map((trigger) => {
        const state = triggerStates[trigger.id] || {
          id: trigger.id,
          triggered: false,
        };

        return (
          <InteractiveTrigger
            key={trigger.id}
            trigger={trigger}
            state={state}
            playerPosition={playerPosition}
            onEnter={onTriggerEnter}
            onInteract={onTriggerInteract}
            onStateChange={(newState) => onTriggerStateChange(trigger.id, newState)}
          />
        );
      })}
    </>
  );
});

// ============================================
// ПРЕДМЕТ В МИРЕ
// ============================================

interface WorldItemProps {
  id: string;
  itemId: string;
  position: [number, number, number];
  collected: boolean;
  onCollect: (id: string) => void;
  playerPosition: { x: number; y: number; z: number };
}

export const WorldItem = memo(function WorldItem({
  id,
  itemId,
  position,
  collected,
  onCollect,
  playerPosition,
}: WorldItemProps) {
  const [isNear, setIsNear] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const dx = playerPosition.x - position[0];
    const dy = playerPosition.y - position[1];
    const dz = playerPosition.z - position[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const near = distance < 1.5;
    const timer = setTimeout(() => setIsNear(near), 0);
    return () => clearTimeout(timer);
  }, [playerPosition, position]);

  useFrame((_, delta) => {
    if (meshRef.current && !collected) {
      meshRef.current.rotation.y += delta * 2;
      meshRef.current.position.y = position[1] + 0.3 + Math.sin(Date.now() * 0.003) * 0.1;
    }
  });

  if (collected) return null;

  const getItemColor = (id: string): string => {
    if (id.includes('poem') || id.includes('verse')) return '#fbbf24';
    if (id.includes('letter') || id.includes('note')) return '#f5e6d3';
    if (id.includes('key')) return '#c0c0c0';
    return '#a855f7';
  };

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial
          color={getItemColor(itemId)}
          emissive={getItemColor(itemId)}
          emissiveIntensity={0.5}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      
      {isNear && (
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      )}
    </group>
  );
});

export default InteractiveTrigger;
