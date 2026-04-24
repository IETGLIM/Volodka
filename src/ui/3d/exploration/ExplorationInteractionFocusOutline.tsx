'use client';

import { memo, useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { InteractiveObjectConfig } from '@/config/scenes';
import { getNearestInteractiveObjectWithDistance, INTERACT_RANGE } from '@/ui/game/InteractiveTriggers';

export type ExplorationInteractionFocusOutlineProps = {
  objects: InteractiveObjectConfig[];
  playerPositionRef: RefObject<{ x: number; y: number; z: number; rotation?: number } | null>;
  enabled: boolean;
};

const DEFAULT_SIZE: [number, number, number] = [0.55, 0.35, 0.45];

/**
 * Контур ближайшего интерактива в радиусе E — ориентир без raycast по декоративным мешам.
 */
export const ExplorationInteractionFocusOutline = memo(function ExplorationInteractionFocusOutline({
  objects,
  playerPositionRef,
  enabled,
}: ExplorationInteractionFocusOutlineProps) {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const geomRef = useRef<THREE.EdgesGeometry | null>(null);
  const lastKeyRef = useRef('');
  const materialRef = useRef<THREE.LineBasicMaterial | null>(null);

  const placeholderGeom = useMemo(() => {
    const b = new THREE.BoxGeometry(1, 1, 1);
    const e = new THREE.EdgesGeometry(b);
    b.dispose();
    return e;
  }, []);

  useEffect(() => {
    return () => {
      geomRef.current?.dispose();
      placeholderGeom.dispose();
    };
  }, [placeholderGeom]);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    const lines = linesRef.current;
    if (!g || !lines) return;

    if (!enabled || objects.length === 0) {
      g.visible = false;
      return;
    }

    const pos = playerPositionRef.current;
    if (!pos) {
      g.visible = false;
      return;
    }

    const hit = getNearestInteractiveObjectWithDistance({ x: pos.x, z: pos.z }, objects);
    if (!hit || hit.distance > INTERACT_RANGE) {
      g.visible = false;
      return;
    }

    const o = hit.object;
    const sz = (o.size ?? DEFAULT_SIZE) as [number, number, number];
    const key = `${o.id}-${sz[0]}-${sz[1]}-${sz[2]}`;
    if (lastKeyRef.current !== key) {
      lastKeyRef.current = key;
      geomRef.current?.dispose();
      const box = new THREE.BoxGeometry(sz[0] * 1.08, sz[1] * 1.12, sz[2] * 1.08);
      geomRef.current = new THREE.EdgesGeometry(box);
      box.dispose();
      lines.geometry = geomRef.current;
    }

    g.visible = true;
    g.position.set(o.position[0], o.position[1], o.position[2]);
    if (o.rotation) {
      g.rotation.set(o.rotation[0], o.rotation[1], o.rotation[2]);
    } else {
      g.rotation.set(0, 0, 0);
    }

    const pulse = 0.52 + 0.28 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 4.2));
    const material = materialRef.current;
    if (material) material.opacity = pulse;
  });

  return (
    <group ref={groupRef} name="ExplorationInteractionFocusOutline" userData={{ noCameraCollision: true }}>
      <lineSegments ref={linesRef} geometry={placeholderGeom} frustumCulled={false}>
        <lineBasicMaterial ref={materialRef} color="#38bdf8" transparent opacity={0.72} depthTest />
      </lineSegments>
    </group>
  );
});
