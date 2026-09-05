/**
 * InstancedProp — Render multiple copies of a GLB model as InstancedMesh.
 *
 * Reduces draw calls from N × (mesh parts) to just (mesh parts) by sharing
 * a single draw call per geometry/material pair across all instances.
 *
 * Example savings (fire escape, ~4 mesh parts):
 *   Before: 5 instances × 4 parts = 20 draw calls
 *   After:  4 InstancedMesh draw calls  = 80% reduction
 *
 * Quality gates:
 *   - low (procedural): returns null (callers already gate on this)
 *   - single instance (< minInstances): renders a single <primitive> clone
 *     to avoid InstancedMesh overhead for unique props
 *   - medium/ultra: full InstancedMesh batching
 *
 * LOD: The caller provides the URL for the desired LOD variant.
 * All instances share the same variant (per-instance LOD not supported).
 */

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import {
  Box3,
  BufferGeometry,
  InstancedMesh,
  Material,
  Matrix4,
  Mesh,
  Object3D,
  SkinnedMesh,
} from 'three';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';
import { useInstancedProps, type InstancedPropTransform } from '@/hooks/useInstancedProps';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

/* ── Types ─────────────────────────────────────────────────── */

export type { InstancedPropTransform } from '@/hooks/useInstancedProps';

export interface InstancedPropProps {
  /** GLB URL — pass the LOD-appropriate URL (caller's responsibility). */
  url: string;
  /** Instance transforms. Empty array renders nothing. */
  instances: readonly InstancedPropTransform[];
  /** Cast shadows (default: false). */
  castShadow?: boolean;
  /** Receive shadows (default: true). */
  receiveShadow?: boolean;
  /**
   * Minimum instance count before using InstancedMesh.
   * Below this, a single <primitive> clone is used (default: 2).
   */
  minInstances?: number;
  /**
   * Lift the model so its lowest baked point sits at each instance's y=0
   * (default: false). Fix v4.14.0 for multi-node props whose AABB dips below
   * the origin (modular_fire_escape: minY −3.65 m → 3.65 м под землёй).
   */
  normalizeFootY?: boolean;
}

/* ── Mesh part extraction ───────────────────────────────────── */

interface MeshPart {
  geometry: BufferGeometry;
  material: Material | Material[];
  /** true — geometry is a baked clone owned by this mount (dispose on unmount). */
  baked: boolean;
}

/**
 * Collect unique (geometry, material) pairs from a GLTF scene.
 * Multi-material meshes produce one part per material.
 *
 * FIX v4.14.0: previously only the (geometry, material) pair was kept and each
 * mesh node's own translation/rotation/scale were DISCARDED — every part of a
 * multi-node prop rendered stacked at the instance origin (modular_fire_escape:
 * railing/platform nodes at y 4.05/5.76 collapsed to ground level;
 * metal_trash_can: handle node at [0.23, 0.65, 0] superimposed on the can).
 * Now each mesh's world matrix is baked into a geometry clone (source
 * geometries stay untouched in the useGLTF cache).
 */
function extractMeshParts(root: Object3D): MeshPart[] {
  root.updateMatrixWorld(true);
  const parts: MeshPart[] = [];
  root.traverse((child) => {
    if (child instanceof SkinnedMesh) {
      // Skinned geometry deforms via bones — baking its matrix would freeze it.
      if (child.geometry) {
        parts.push({ geometry: child.geometry, material: child.material, baked: false });
      }
      return;
    }
    if (child instanceof Mesh && child.geometry) {
      const baked = child.geometry.clone();
      baked.applyMatrix4(child.matrixWorld);
      parts.push({ geometry: baked, material: child.material, baked: true });
    }
  });
  return parts;
}

/* ── Single-instanced InstancedMesh part ────────────────────── */

interface InstancedMeshPartProps {
  geometry: BufferGeometry;
  material: Material | Material[];
  count: number;
  matrices: readonly Matrix4[];
  castShadow: boolean;
  receiveShadow: boolean;
}

function InstancedMeshPart({
  geometry,
  material,
  count,
  matrices,
  castShadow,
  receiveShadow,
}: InstancedMeshPartProps) {
  const meshRef = useRef<InstancedMesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Apply instance transforms
    for (let i = 0; i < count; i++) {
      mesh.setMatrixAt(i, matrices[i]);
    }
    mesh.instanceMatrix.needsUpdate = true;

    // No cleanup needed: instanceMatrix is an InstancedBufferAttribute owned
    // by this InstancedMesh. It will be GC'd when the mesh unmounts.
    // The shared geometry/material belong to the useGLTF cache — never dispose those.
    return undefined;
  }, [matrices, count]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled={false}
    />
  );
}

/* ── Single instance fallback (< minInstances) ─────────────── */

interface SingleInstanceProps {
  url: string;
  instance: InstancedPropTransform;
  castShadow: boolean;
  receiveShadow: boolean;
}

function SingleInstance({ url, instance, castShadow, receiveShadow }: SingleInstanceProps) {
  const gltf = useGLTF(url, true, true, extendLoader);
  const cloneRef = useRef<Object3D | null>(null);

  useEffect(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;
      }
    });
    cloneRef.current = clone;
    return () => {
 cloneRef.current = null;
    };
  }, [gltf.scene, castShadow, receiveShadow]);

  if (!cloneRef.current) return null;

  const { position, rotation, scale } = instance;
  const rot = rotation ?? [0, 0, 0];
  const s = scale ?? 1;
  const sArr = typeof s === 'number' ? [s, s, s] : s;

  return (
    <group position={position} rotation={rot as [number, number, number]} scale={sArr as [number, number, number]}>
      <primitive object={cloneRef.current} />
    </group>
  );
}

/* ── Main component ────────────────────────────────────────── */

/**
 * Render multiple copies of a GLB model efficiently via InstancedMesh.
 *
 * Reduces draw calls from `N × meshParts` to just `meshParts`.
 *
 * ```tsx
 * // BEFORE: 5 fire escapes = 5 separate GltfProp mounts (~20 draw calls)
 * <Suspense><GltfProp url={url} position={[...]} /></Suspense>
 * <Suspense><GltfProp url={url} position={[...]} /></Suspense>
 * ...
 *
 * // AFTER: 1 InstancedProp = 1 GLB load + ~4 draw calls
 * <InstancedProp
 *   url={url}
 *   instances={fireEscapes.map(p => ({
 *     position: p.position,
 *     rotation: [0, p.rotationY, 0],
 *     scale: p.scale,
 *   }))}
 * />
 * ```
 */
export function InstancedProp({
  url,
  instances,
  castShadow = false,
  receiveShadow = true,
  minInstances = 2,
  normalizeFootY = false,
}: InstancedPropProps) {
  const { preset } = useGraphicsQuality();

  // ── Quality gate: procedural mode renders no GLB props ──
  if (!allowsGlbAssetRendering(preset.environmentRenderMode)) {
    return null;
  }

  // ── Empty / single-instance fast paths ──
  if (instances.length === 0) return null;

  if (instances.length < minInstances) {
    return (
      <SingleInstance
        url={url}
        instance={instances[0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      />
    );
  }

  // ── Full instanced path ──
  return (
    <Suspense fallback={null}>
      <InstancedPropInner
        url={url}
        instances={instances}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        normalizeFootY={normalizeFootY}
      />
    </Suspense>
  );
}

/* ── Inner: loads GLB, extracts parts, renders InstancedMeshes ── */

interface InstancedPropInnerProps {
  url: string;
  instances: readonly InstancedPropTransform[];
  castShadow: boolean;
  receiveShadow: boolean;
  normalizeFootY: boolean;
}

function InstancedPropInner({
  url,
  instances,
  castShadow,
  receiveShadow,
  normalizeFootY,
}: InstancedPropInnerProps) {
  const gltf = useGLTF(url, true, true, extendLoader);
  const { matrices, count } = useInstancedProps(instances);

  const meshParts = useMemo(() => {
    const parts = extractMeshParts(gltf.scene);
    if (normalizeFootY && parts.length > 0) {
      // Union baked bounds and lift so the lowest point sits at y=0 —
      // matches the min-anchoring policy of ScenePropDressing/GltfNPCModel.
      const box = new Box3();
      for (const part of parts) {
        part.geometry.computeBoundingBox();
        if (part.geometry.boundingBox) box.union(part.geometry.boundingBox);
      }
      if (Number.isFinite(box.min.y) && Math.abs(box.min.y) > 1e-4) {
        const lift = new Matrix4().makeTranslation(0, -box.min.y, 0);
        for (const part of parts) {
          if (part.baked) part.geometry.applyMatrix4(lift);
        }
      }
    }
    return parts;
  }, [gltf.scene, normalizeFootY]);

  // Baked geometry clones are owned by this mount — dispose on unmount.
  // Source geometries (baked: false) stay in the useGLTF cache — never disposed.
  useEffect(
    () => () => {
      for (const part of meshParts) {
        if (part.baked) part.geometry.dispose();
      }
    },
    [meshParts],
  );

  if (meshParts.length === 0) return null;

  return (
    <group>
      {meshParts.map((part, i) => (
        <InstancedMeshPart
          key={i}
          geometry={part.geometry}
          material={part.material}
          count={count}
          matrices={matrices}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      ))}
    </group>
  );
}

/* ── Preload helper ─────────────────────────────────────────── */

/** Preload a GLB for InstancedProp (call from GPU lifecycle). */
export function preloadInstancedProp(url: string): void {
  useGLTF.preload(url, true, true, extendLoader);
}
