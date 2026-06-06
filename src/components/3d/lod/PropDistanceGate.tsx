/* ─── Distance gate for environment props / clutter ─── */

import { useRef, useState, type ReactNode, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EnvironmentLodLevel } from '@/engine/lod/distanceLod';
import { environmentDetailVisible } from '@/engine/lod/distanceLod';

interface PropDistanceGateProps {
  livePlayerPositionRef: MutableRefObject<THREE.Vector3>;
  /** World-space anchor for this prop group */
  position: [number, number, number];
  /** Max distance from player to anchor before hiding */
  maxDistance: number;
  children: ReactNode;
}

/**
 * Hides decorative geometry when the player is far from a prop anchor.
 * Uses throttled React updates (~8 Hz) to stay out of the hot path.
 */
export function PropDistanceGate({
  livePlayerPositionRef,
  position,
  maxDistance,
  children,
}: PropDistanceGateProps) {
  const anchor = useRef(new THREE.Vector3(...position));
  anchor.current.set(...position);

  const visibleRef = useRef(true);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(0);

  useFrame((_, delta) => {
    timerRef.current += delta;
    if (timerRef.current < 0.12) return;
    timerRef.current = 0;

    const dist = livePlayerPositionRef.current.distanceTo(anchor.current);
    const next = dist <= maxDistance;
    if (next !== visibleRef.current) {
      visibleRef.current = next;
      setVisible(next);
    }
  });

  if (!visible) return null;
  return <group position={position}>{children}</group>;
}

interface EnvironmentDetailProps {
  /** Current scene environment LOD from provider or parent */
  currentLod: EnvironmentLodLevel;
  /** Minimum LOD required to render these children */
  minLod: EnvironmentLodLevel;
  children: ReactNode;
}

/** Renders children only when scene environment LOD meets the minimum tier. */
export function EnvironmentDetail({ currentLod, minLod, children }: EnvironmentDetailProps) {
  if (!environmentDetailVisible(minLod, currentLod)) return null;
  return <>{children}</>;
}
