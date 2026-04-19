"use client";

import { useRef, useState, useEffect, memo, useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { TriggerZone, TriggerState } from "@/data/rpgTypes";
import type { SceneId } from "@/data/types";
import { eventBus } from "@/engine/EventBus";

// ============================================
// Коллизия игрока с AABB триггера
// ============================================

export function isPlayerInTriggerZone(
  pos: { x: number; y: number; z: number },
  trigger: TriggerZone,
): boolean {
  const dx = pos.x - trigger.position.x;
  const dy = pos.y - trigger.position.y;
  const dz = pos.z - trigger.position.z;
  return (
    Math.abs(dx) < trigger.size.x / 2 &&
    Math.abs(dy) < trigger.size.y / 2 &&
    Math.abs(dz) < trigger.size.z / 2
  );
}

// ============================================
// СИСТЕМА ТРИГГЕРОВ — коллизии в useFrame + throttling UI
// ============================================

const MARKER_THROTTLE_FRAMES = 2;

interface TriggerSystemProps {
  triggers: TriggerZone[];
  triggerStates: Record<string, TriggerState>;
  /** Актуальная позиция игрока (обновляется родителем каждый кадр логики) */
  playerPositionRef: RefObject<{ x: number; y: number; z: number }>;
  currentSceneId: SceneId;
  onTriggerEnter: (triggerId: string) => void;
  onTriggerStateChange: (triggerId: string, state: TriggerState) => void;
}

export const TriggerSystem = memo(function TriggerSystem({
  triggers,
  triggerStates,
  playerPositionRef,
  currentSceneId,
  onTriggerEnter,
  onTriggerStateChange,
}: TriggerSystemProps) {
  const sceneTriggers = triggers.filter((t) => t.sceneId === currentSceneId);

  const wasInsideRef = useRef<Record<string, boolean>>({});
  const markerInsideRef = useRef<Record<string, boolean>>({});
  const [markerInside, setMarkerInside] = useState<Record<string, boolean>>({});
  const frameCounterRef = useRef(0);
  const enterToastLastAtRef = useRef<Record<string, number>>({});

  useEffect(() => {
    wasInsideRef.current = {};
    markerInsideRef.current = {};
    enterToastLastAtRef.current = {};
    queueMicrotask(() => {
      setMarkerInside({});
    });
  }, [currentSceneId]);

  useFrame(() => {
    const pos = playerPositionRef.current;
    if (!pos) return;

    frameCounterRef.current += 1;
    const doMarkerTick = frameCounterRef.current % MARKER_THROTTLE_FRAMES === 0;

    const insideByTrigger: Record<string, boolean> = {};
    for (const trigger of sceneTriggers) {
      const state = triggerStates[trigger.id] || { id: trigger.id, triggered: false };
      const inside = isPlayerInTriggerZone(pos, trigger);
      insideByTrigger[trigger.id] = inside;
      const prevInside = wasInsideRef.current[trigger.id] ?? false;

      if (inside && !prevInside && trigger.enterToast) {
        const now = performance.now();
        const cooldown = trigger.enterToastCooldownMs ?? 22_000;
        const last = enterToastLastAtRef.current[trigger.id] ?? 0;
        if (now - last >= cooldown) {
          enterToastLastAtRef.current[trigger.id] = now;
          eventBus.emit("ui:exploration_message", { text: trigger.enterToast });
        }
      }

      if (inside && !prevInside && !state.triggered && !trigger.requiresInteraction) {
        onTriggerEnter(trigger.id);
        if (trigger.oneTime) {
          onTriggerStateChange(trigger.id, {
            id: trigger.id,
            triggered: true,
            triggeredAt: Date.now(),
          });
        }
      }

      wasInsideRef.current[trigger.id] = inside;
    }

    if (!doMarkerTick) return;

    const nextMarkers: Record<string, boolean> = {};
    for (const trigger of sceneTriggers) {
      const state = triggerStates[trigger.id] || { id: trigger.id, triggered: false };
      const inside = insideByTrigger[trigger.id];
      nextMarkers[trigger.id] = Boolean(
        inside && trigger.requiresInteraction && !state.triggered,
      );
    }

    let markerChanged = false;
    for (const t of sceneTriggers) {
      const next = nextMarkers[t.id] ?? false;
      const prev = markerInsideRef.current[t.id] ?? false;
      if (next !== prev) {
        markerChanged = true;
        break;
      }
    }
    if (markerChanged) {
      markerInsideRef.current = nextMarkers;
      setMarkerInside(nextMarkers);
    }
  });

  return (
    <>
      {sceneTriggers.map((trigger) => {
        if (!markerInside[trigger.id]) return null;
        return (
          <group
            key={`m-${trigger.id}`}
            position={[trigger.position.x, trigger.position.y + 1, trigger.position.z]}
          >
            <mesh>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshBasicMaterial color="#fbbf24" />
            </mesh>
          </group>
        );
      })}
    </>
  );
});

// ============================================
// ПРЕДМЕТ В МИРЕ (анимации — по одному useFrame на предмет;
// при большом числе предметов можно заменить на instancedMesh)
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
  const meshRef = useRef<THREE.Mesh>(null);

  const isNear = useMemo(() => {
    const dx = playerPosition.x - position[0];
    const dy = playerPosition.y - position[1];
    const dz = playerPosition.z - position[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return distance < 1.5;
  }, [playerPosition.x, playerPosition.y, playerPosition.z, position]);

  useFrame(({ clock }, delta) => {
    if (meshRef.current && !collected) {
      meshRef.current.rotation.y += delta * 2;
      meshRef.current.position.y = position[1] + 0.3 + Math.sin(clock.elapsedTime * 3) * 0.1;
    }
  });

  if (collected) return null;

  const getItemColor = (item: string): string => {
    if (item.includes("poem") || item.includes("verse")) return "#fbbf24";
    if (item.includes("letter") || item.includes("note")) return "#f5e6d3";
    if (item.includes("key")) return "#c0c0c0";
    return "#a855f7";
  };

  const color = getItemColor(itemId);

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
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

export default TriggerSystem;
