/* ─── Volodka RPG – 3D Quest Marker Pillar ─── */
/* Glowing pillar/column of light above quest objectives.
 *  - Yellow for active (incomplete) objectives
 *  - Green for completed objectives
 *  - Can be placed above items, NPCs, or locations
 *  - 3 units above target with subtle pulsing animation
 */

'use client';

import { useRef } from 'react';
import { DoubleSide, Mesh, MeshStandardMaterial } from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';

/* ─── Constants ─── */
const PILLAR_HEIGHT = 3.0;
const CORE_RADIUS = 0.025;
const GLOW_RADIUS = 0.07;
const BASE_RADIUS = 0.2;
const BASE_Y = 0.02;

export type QuestMarker3DVariant = 'active' | 'completed';

const VARIANT_COLORS: Record<QuestMarker3DVariant, { color: string; emissive: string }> = {
  active:    { color: '#ffdd00', emissive: '#ffdd00' }, // Yellow
  completed: { color: '#00ff66', emissive: '#00ff66' }, // Green
};

interface QuestMarker3DProps {
  /** Position in world space where the pillar base is placed */
  position?: [number, number, number];
  /** 'active' (yellow) or 'completed' (green) */
  variant?: QuestMarker3DVariant;
}

/** Glowing pillar of light above a quest objective */
export function QuestMarker3D({
  position = [0, 0, 0],
  variant = 'active',
}: QuestMarker3DProps) {
  return (
    <QuestMarkerPillar
      position={position}
      color={VARIANT_COLORS[variant].color}
      emissive={VARIANT_COLORS[variant].emissive}
    />
  );
}

/* ─── Internal pillar implementation ─── */

function QuestMarkerPillar({
  position,
  color,
  emissive,
}: {
  position: [number, number, number];
  color: string;
  emissive: string;
}) {
  const glowRef = useRef<Mesh>(null);
  const baseGlowRef = useRef<Mesh>(null);
  const timeRef = useRef(0);

  // Pulsing animation via the frame budget system
  useFrameTick('interaction', ({ delta }) => {
    timeRef.current += delta;
    const t = timeRef.current;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.5);

    // Outer glow pulse
    if (glowRef.current) {
      const mat = glowRef.current.material as MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + pulse * 0.7;
      mat.opacity = 0.15 + pulse * 0.15;
    }

    // Base disc pulse
    if (baseGlowRef.current) {
      const mat = baseGlowRef.current.material as MeshStandardMaterial;
      mat.emissiveIntensity = 0.4 + pulse * 0.6;
      mat.opacity = 0.2 + pulse * 0.15;
      const s = 1 + pulse * 0.2;
      baseGlowRef.current.scale.set(s, 0.3, s);
    }
  });

  return (
    <group position={position}>
      {/* Core beam — thin bright cylinder */}
      <mesh position={[0, PILLAR_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[CORE_RADIUS, CORE_RADIUS, PILLAR_HEIGHT, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={1.2}
          transparent
          opacity={0.6}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow — slightly wider, more translucent */}
      <mesh ref={glowRef} position={[0, PILLAR_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[GLOW_RADIUS, GLOW_RADIUS, PILLAR_HEIGHT, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.5}
          transparent
          opacity={0.15}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Base glow — disc on the ground */}
      <mesh
        ref={baseGlowRef}
        rotation-x={-Math.PI / 2}
        position={[0, BASE_Y, 0]}
      >
        <circleGeometry args={[BASE_RADIUS, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.35}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
