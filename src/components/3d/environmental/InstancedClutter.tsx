'use client';

import { useRef, useEffect, useMemo } from 'react';
import { InstancedMesh, Object3D, type BufferGeometry, type Material } from 'three';

/** Per-instance transform data for an InstancedClutter item. */
export interface InstancedClutterItem {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}

export interface InstancedClutterProps {
  /** Array of items to render. Max 500. */
  items: readonly InstancedClutterItem[];
  /** Shared geometry for all instances. */
  geometry: BufferGeometry;
  /** Shared material for all instances. */
  material: Material;
  /** Optional per-instance color (hex number). Must match items length. */
  colors?: readonly number[];
  /** Override instance count (useful when geometry supports it natively). */
  count?: number;
}

const MAX_INSTANCES = 500;
const dummy = new Object3D();

/**
 * Renders an array of items as a single InstancedMesh (1 draw call instead of N).
 * Each instance can have individual position, rotation, and scale.
 * Supports up to 500 instances.
 */
export function InstancedClutter({ items, geometry, material, colors }: InstancedClutterProps) {
  const meshRef = useRef<InstancedMesh>(null);

  const instanceCount = Math.min(items.length, MAX_INSTANCES);

  const key = useMemo(
    () => `${geometry.uuid}:${material.uuid}:${instanceCount}`,
    [geometry.uuid, material.uuid, instanceCount],
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < instanceCount; i++) {
      const item = items[i];
      if (!item) break;

      dummy.position.set(item.position[0], item.position[1], item.position[2]);

      if (item.rotation) {
        dummy.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
      } else {
        dummy.rotation.set(0, 0, 0);
      }

      if (item.scale !== undefined) {
        if (Array.isArray(item.scale)) {
          dummy.scale.set(item.scale[0], item.scale[1], item.scale[2]);
        } else {
          dummy.scale.setScalar(item.scale);
        }
      } else {
        dummy.scale.setScalar(1);
      }

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, instanceCount, key]);

  // Apply per-instance colors
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !colors || colors.length === 0) return;

    for (let i = 0; i < Math.min(colors.length, instanceCount); i++) {
      mesh.setColorAt(i, colors[i]);
    }

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [colors, instanceCount]);

  if (instanceCount === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, instanceCount]}
      frustumCulled={false}
    />
  );
}
