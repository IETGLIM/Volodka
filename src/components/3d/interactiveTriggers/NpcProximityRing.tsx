/* ─── Volodka RPG – NPC proximity glow ring ───
 *  A pulsing, color-coded ring that appears at the NPC's feet
 *  when the player is within interaction range. Color adapts to
 *  relationship level: green (ally), amber (neutral), red (enemy).
 *  Fades smoothly based on proximity factor.
 */

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';

interface NpcProximityRingProps {
  /** Imperative proximity factor (0–1) — 0 = hidden, 1 = full glow */
  proximityRef: React.RefObject<number>;
  /** Pulse phase synced from parent distance loop */
  pulsePhaseRef: React.RefObject<number>;
  /** Whether the ring should be visible */
  activeRef: React.RefObject<boolean>;
  /** Relationship-based color string */
  relationColor: string;
  /** Ring radius at NPC feet */
  radius?: number;
}

const RING_SEGMENTS = 64;
const RING_TUBE_RADIUS = 0.018;

/** Pulsing glow ring at NPC feet — relationship color-coded */
export function NpcProximityRing({
  proximityRef,
  pulsePhaseRef,
  activeRef,
  relationColor,
  radius = 0.55,
}: NpcProximityRingProps) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const ringGeometry = useMemo(
    () => new THREE.TorusGeometry(radius, RING_TUBE_RADIUS, 8, RING_SEGMENTS),
    [radius],
  );

  // R3F does NOT auto-dispose geometries passed via the `geometry` prop or
  // created imperatively in useMemo. Without this cleanup, every NPC mount
  // (26 NPCs × every scene visit) leaks a TorusGeometry (~5KB GPU buffer).
  useEffect(() => {
    return () => {
      ringGeometry.dispose();
    };
  }, [ringGeometry]);

  useFrameTick('interaction', () => {
    const mat = materialRef.current;
    const mesh = meshRef.current;
    if (!mat || !mesh) return;

    const active = activeRef.current ?? false;
    if (!active) {
      mat.opacity = 0;
      mesh.visible = false;
      return;
    }

    mesh.visible = true;
    const prox = proximityRef.current ?? 0;
    const phase = pulsePhaseRef.current ?? 0;
    const pulse = 0.85 + Math.sin(phase) * 0.15;
    mat.opacity = Math.min(1, prox * pulse * 0.9);
    mat.color.set(relationColor);
  });

  return (
    <mesh
      ref={meshRef}
      geometry={ringGeometry}
      position={[0, 0.02, 0]}
      rotation-x={-Math.PI / 2}
      visible={false}
    >
      <meshBasicMaterial
        ref={materialRef}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
