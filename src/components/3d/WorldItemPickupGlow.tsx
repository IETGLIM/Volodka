/* ─── Volodka RPG – World item pickup glow ─── */
/* Visual highlight for trigger zones with interactionType: 'take'.
   Renders a pulsing glow ring + floating "[E] Взять" label above the item
   so players notice pickable objects in the world (Gothic-style focus).
   On collect, spawns a short amber sparkle burst. */

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { useCurrentSceneId } from '@/store/selectors';
import { TRIGGER_ZONES, isTriggerZoneAvailable } from '@/data/triggerZones';
import { Html } from '@react-three/drei';
import { useSceneLoadedGate } from '@/hooks/useSceneLoadedGate';
import {
  buildPickupCollectBurst,
  PICKUP_COLLECT_BURST_COLOR,
  PICKUP_COLLECT_BURST_DURATION_MS,
  type CollectBurstParticle,
} from '@/engine/interaction/pickupCollectBurst';
import { getSharedCircleGeometry } from '@/engine/three/moduleGeometryRegistry';

const GLOW_COLOR = '#fbbf24'; // amber
const GLOW_RADIUS = 0.35;
const GLOW_HEIGHT_OFFSET = 0.8;
const PULSE_SPEED = 2.0;

interface PickupGlowProps {
  position: [number, number, number];
  label: string;
}

/** Single pulsing glow ring + label for one pickable item. */
function PickupGlow({ position, label }: PickupGlowProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  const geometry = useMemo(() => new THREE.RingGeometry(GLOW_RADIUS * 0.8, GLOW_RADIUS, 32), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: GLOW_COLOR,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthTest: false,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * PULSE_SPEED;
    const pulse = 0.5 + 0.5 * Math.sin(t);
    if (matRef.current) {
      matRef.current.opacity = 0.25 + 0.35 * pulse;
    }
    if (ringRef.current) {
      const scale = 1 + 0.1 * pulse;
      ringRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={ringRef}
        geometry={geometry}
        material={material}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
      >
        <meshBasicMaterial
          ref={matRef}
          color={GLOW_COLOR}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>
      <Html
        position={[0, GLOW_HEIGHT_OFFSET, 0]}
        center
        distanceFactor={4}
        zIndexRange={[10, 0]}
        pointerEvents="none"
      >
        <div
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(0,0,0,0.7)',
            border: `1px solid ${GLOW_COLOR}`,
            color: GLOW_COLOR,
            fontSize: '11px',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            textShadow: `0 0 4px ${GLOW_COLOR}40`,
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

type BurstState = {
  id: string;
  position: [number, number, number];
  particles: CollectBurstParticle[];
  bornAt: number;
};

function CollectBurst({ burst, onDone }: { burst: BurstState; onDone: (id: string) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const matsRef = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  useFrame((_, delta) => {
    const age = (performance.now() - burst.bornAt) / 1000;
    const maxLife = Math.max(...burst.particles.map((p) => p.life), 0.4);
    if (age >= maxLife) {
      onDone(burst.id);
      return;
    }
    const g = groupRef.current;
    if (!g) return;
    for (let i = 0; i < burst.particles.length; i++) {
      const p = burst.particles[i];
      const child = g.children[i] as THREE.Mesh | undefined;
      if (!child || !p) continue;
      const t = Math.min(1, age / p.life);
      const dist = p.speed * age * (1 - t * 0.35);
      child.position.set(
        Math.cos(p.angle) * dist,
        0.15 + age * 0.9,
        Math.sin(p.angle) * dist,
      );
      const s = p.size * (1.2 - t);
      child.scale.setScalar(Math.max(0.01, s / 0.06));
      const mat = matsRef.current[i];
      if (mat) mat.opacity = (1 - t) * 0.85;
    }
    void delta;
  });

  return (
    <group ref={groupRef} position={burst.position}>
      {burst.particles.map((p, i) => (
        <mesh key={i} geometry={getSharedCircleGeometry(0.06, 8)} rotation-x={-Math.PI / 2}>
          <meshBasicMaterial
            ref={(m) => {
              matsRef.current[i] = m;
            }}
            color={PICKUP_COLLECT_BURST_COLOR}
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Renders pickup glows for all 'take' trigger zones in the active scene. */
export function WorldItemPickupGlows() {
  const sceneId = useCurrentSceneId();
  const sceneLoaded = useSceneLoadedGate(sceneId);
  const flags = useGameStore((s) => s.playerState.flags);
  const currentAct = useGameStore((s) => s.playerState.progression.currentAct);
  const activeTTLFlags = useGameStore((s) => s.activeTTLFlags);
  const interactiveObjectStates = useGameStore((s) => s.interactiveObjectStates);
  const [bursts, setBursts] = useState<BurstState[]>([]);
  const prevZoneIdsRef = useRef<Set<string>>(new Set());
  const zonePosRef = useRef<Map<string, [number, number, number]>>(new Map());

  const pickupZones = useMemo(
    () =>
      TRIGGER_ZONES.filter(
        (z) =>
          z.sceneId === sceneId &&
          z.interactionType === 'take' &&
          isTriggerZoneAvailable(z, flags, currentAct, activeTTLFlags) &&
          !(z.isOneTime && interactiveObjectStates[z.id]),
      ),
    [sceneId, flags, currentAct, activeTTLFlags, interactiveObjectStates],
  );

  useEffect(() => {
    const nextIds = new Set(pickupZones.map((z) => z.id));
    for (const z of pickupZones) {
      zonePosRef.current.set(z.id, z.position);
    }
    const prev = prevZoneIdsRef.current;
    if (prev.size > 0) {
      for (const id of prev) {
        if (!nextIds.has(id)) {
          const position = zonePosRef.current.get(id) ?? ([0, 0, 0] as [number, number, number]);
          const bornAt = performance.now();
          setBursts((list) => [
            ...list,
            {
              id: `${id}:${bornAt}`,
              position,
              particles: buildPickupCollectBurst(id),
              bornAt,
            },
          ]);
          window.setTimeout(() => {
            setBursts((list) => list.filter((b) => !b.id.startsWith(`${id}:`)));
          }, PICKUP_COLLECT_BURST_DURATION_MS + 120);
        }
      }
    }
    prevZoneIdsRef.current = nextIds;
  }, [pickupZones]);

  useEffect(() => {
    prevZoneIdsRef.current = new Set();
    setBursts([]);
  }, [sceneId]);

  if (!sceneLoaded) return null;

  return (
    <group key={`pickups:${sceneId}`}>
      {pickupZones.map((zone) => (
        <PickupGlow
          key={zone.id}
          position={zone.position}
          label={zone.interactionLabel ?? 'Взять'}
        />
      ))}
      {bursts.map((burst) => (
        <CollectBurst
          key={burst.id}
          burst={burst}
          onDone={(id) => setBursts((list) => list.filter((b) => b.id !== id))}
        />
      ))}
    </group>
  );
}
