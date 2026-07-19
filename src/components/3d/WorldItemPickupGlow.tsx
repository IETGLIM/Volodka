/* ─── Volodka RPG – World item pickup glow ─── */
/* Visual highlight for trigger zones with interactionType: 'take'.
   Renders a pulsing glow ring + floating "[E] Взять" label above the item
   so players notice pickable objects in the world (Gothic-style focus). */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { useCurrentSceneId } from '@/store/selectors';
import { TRIGGER_ZONES, isTriggerZoneAvailable } from '@/data/triggerZones';
import { Html } from '@react-three/drei';
import { useSceneLoadedGate } from '@/hooks/useSceneLoadedGate';

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

  // Pre-allocated geometry/material — shared across all glows in this scene.
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

  // Dispose geometry on unmount — R3F does not auto-dispose geometries
  // attached via the `geometry` prop. (The `material` useMemo is overridden
  // by the JSX <meshBasicMaterial> child, so it never reaches the GPU, but
  // we dispose it anyway for cleanliness.)
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
      {/* Glow ring on the ground */}
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
      {/* Floating label */}
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

/** Renders pickup glows for all 'take' trigger zones in the active scene. */
export function WorldItemPickupGlows() {
  const sceneId = useCurrentSceneId();
  const sceneLoaded = useSceneLoadedGate(sceneId);
  const flags = useGameStore((s) => s.playerState.flags);
  const currentAct = useGameStore((s) => s.playerState.progression.currentAct);
  const activeTTLFlags = useGameStore((s) => s.activeTTLFlags);
  const interactiveObjectStates = useGameStore((s) => s.interactiveObjectStates);

  const pickupZones = useMemo(
    () =>
      TRIGGER_ZONES.filter(
        (z) =>
          z.sceneId === sceneId &&
          z.interactionType === 'take' &&
          isTriggerZoneAvailable(z, flags, currentAct, activeTTLFlags) &&
          // Hide glow if already picked up.
          !(z.isOneTime && interactiveObjectStates[z.id]),
      ),
    [sceneId, flags, currentAct, activeTTLFlags, interactiveObjectStates],
  );

  if (!sceneLoaded || pickupZones.length === 0) return null;

  return (
    <group key={`pickups:${sceneId}`}>
      {pickupZones.map((zone) => (
        <PickupGlow
          key={zone.id}
          position={zone.position}
          label={zone.interactionLabel ?? 'Взять'}
        />
      ))}
    </group>
  );
}
