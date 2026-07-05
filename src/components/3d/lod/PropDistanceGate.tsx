/* ─── Distance gate for environment props / clutter ─── */

import { useEffect, useRef, useState, type ReactNode, type MutableRefObject } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import {
  environmentDetailVisible,
  resolveEnvironmentLod,
  type EnvironmentLodLevel,
} from '@/engine/lod/distanceLod';
import { useEnvironmentLod } from './EnvironmentLodProvider';

/** Hysteresis band (world units) when hiding props by distance. */
export const PROP_DISTANCE_HYSTERESIS_M = 2;

interface PropDistanceGateProps {
  livePlayerPositionRef: MutableRefObject<THREE.Vector3>;
  /** World-space anchor for this prop group */
  position: [number, number, number];
  /** Max distance from player to anchor before hiding */
  maxDistance: number;
  children: ReactNode;
}

interface SceneClutterGateProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
  position: [number, number, number];
  maxDistance: number;
  children: ReactNode;
}

/** Prop gate with fallback when player ref is unavailable (SSR / tests). */
export function SceneClutterGate({
  livePlayerPositionRef,
  position,
  maxDistance,
  children,
}: SceneClutterGateProps) {
  if (!livePlayerPositionRef) {
    return <group position={position}>{children}</group>;
  }
  return (
    <PropDistanceGate
      livePlayerPositionRef={livePlayerPositionRef}
      position={position}
      maxDistance={maxDistance}
    >
      {children}
    </PropDistanceGate>
  );
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
  const hideDistanceRef = useRef(maxDistance);
  const showDistanceRef = useRef(Math.max(0, maxDistance - PROP_DISTANCE_HYSTERESIS_M));

  useEffect(() => {
    hideDistanceRef.current = maxDistance;
    showDistanceRef.current = Math.max(0, maxDistance - PROP_DISTANCE_HYSTERESIS_M);
  }, [maxDistance]);

  useFrameTick('misc', ({ delta }) => {
    timerRef.current += delta;
    if (timerRef.current < 0.12) return;
    timerRef.current = 0;

    const dist = livePlayerPositionRef.current.distanceTo(anchor.current);
    const next = visibleRef.current
      ? dist <= hideDistanceRef.current
      : dist <= showDistanceRef.current;
    if (next !== visibleRef.current) {
      visibleRef.current = next;
      setVisible(next);
    }
  });

  return (
    <group position={position} visible={visible}>
      {children}
    </group>
  );
}

interface EnvironmentDetailProps {
  /** Minimum LOD required to render these children */
  minLod: EnvironmentLodLevel;
  /**
   * World-space anchor for distance checks. When omitted, uses this component's
   * world position (place inside a positioned parent group).
   */
  position?: [number, number, number];
  children: ReactNode;
}

const ENV_LOD_TICK_S = 0.15;

/**
 * Renders children when per-prop environment LOD meets the minimum tier.
 * Distance is measured from the player to `position` (or parent world transform),
 * with hysteresis at clutter/decorative boundaries (~15% enter band).
 */
export function EnvironmentDetail({ minLod, position, children }: EnvironmentDetailProps) {
  const { livePlayerPositionRef, thresholds } = useEnvironmentLod();
  const anchorRef = useRef(new THREE.Vector3());
  const groupRef = useRef<THREE.Group>(null);

  const lodRef = useRef<EnvironmentLodLevel>('full');
  const visibleRef = useRef(true);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(0);

  useEffect(() => {
    lodRef.current = 'full';
    visibleRef.current = true;
    setVisible(true);
  }, [thresholds]);

  useFrameTick('misc', ({ delta }) => {
    if (!livePlayerPositionRef) return;

    timerRef.current += delta;
    if (timerRef.current < ENV_LOD_TICK_S) return;
    timerRef.current = 0;

    if (position) {
      anchorRef.current.set(position[0], position[1], position[2]);
    } else if (groupRef.current) {
      groupRef.current.getWorldPosition(anchorRef.current);
    } else {
      return;
    }

    const dist = livePlayerPositionRef.current.distanceTo(anchorRef.current);
    const nextLod = resolveEnvironmentLod(dist, lodRef.current, thresholds);
    const nextVisible = environmentDetailVisible(minLod, nextLod);

    if (nextLod !== lodRef.current) {
      lodRef.current = nextLod;
    }
    if (nextVisible !== visibleRef.current) {
      visibleRef.current = nextVisible;
      setVisible(nextVisible);
    }
  });

  if (!livePlayerPositionRef) {
    return <>{children}</>;
  }

  if (!visible) return null;

  return <group ref={groupRef}>{children}</group>;
}
