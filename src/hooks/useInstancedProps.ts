/**
 * useInstancedProps — Efficiently manages instance transform matrices for InstancedMesh.
 *
 * Converts an array of InstancedPropTransform (position/rotation/scale) into
 * a stable array of Matrix4 suitable for InstancedMesh.setMatrixAt().
 * Handles dynamic add/remove of instances and provides utilities for
 * scene dressers.
 */

import { useMemo, useCallback } from 'react';
import { Euler, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';

/* ── Public API ─────────────────────────────────────────────── */

export interface InstancedPropTransform {
  position: [number, number, number];
  /** Euler rotation XYZ in radians (defaults to [0, 0, 0]). */
  rotation?: [number, number, number];
  /** Uniform scale (number) or per-axis scale [x, y, z]. Defaults to 1. */
  scale?: number | [number, number, number];
}

export interface UseInstancedPropsResult {
  /** Computed 4×4 matrices, one per instance. Recomputed when `transforms` changes. */
  readonly matrices: readonly Matrix4[];
  /** Shortcut for transforms.length — stable reference. */
  readonly count: number;
  /**
   * Apply all matrices to an InstancedMesh and flag the GPU buffer for upload.
   * Call after creating the InstancedMesh or when matrices change.
   */
  applyTo: (mesh: InstancedMesh) => void;
  /**
   * Build a single Matrix4 from a transform (useful for ad-hoc computation).
   * Uses module-level scratch objects — NOT safe across async boundaries.
   */
  buildMatrix: (transform: InstancedPropTransform) => Matrix4;
}

/* ── Scratch objects (module-level, never exposed) ───────────── */

const _mat = new Matrix4();
const _pos = new Vector3();
const _quat = new Quaternion();
const _euler = new Euler();
const _scl = new Vector3();

function composeMatrix(transform: InstancedPropTransform, out: Matrix4): void {
  _pos.set(transform.position[0], transform.position[1], transform.position[2]);
  const rot = transform.rotation;
  _euler.set(rot?.[0] ?? 0, rot?.[1] ?? 0, rot?.[2] ?? 0);
  _quat.setFromEuler(_euler);
  const s = transform.scale ?? 1;
  if (typeof s === 'number') {
    _scl.setScalar(s);
  } else {
    _scl.set(s[0], s[1], s[2]);
  }
  out.compose(_pos, _quat, _scl);
}

/* ── Hook ───────────────────────────────────────────────────── */

/**
 * Convert a list of prop transforms into instanced-mesh-ready matrices.
 *
 * ```tsx
 * const { matrices, count, applyTo } = useInstancedProps([
 *   { position: [0, 0, 0], rotation: [0, 1.2, 0], scale: 1.1 },
 *   { position: [3, 0, -2] },
 * ]);
 * // matrices.length === 2, count === 2
 * // applyTo(instancedMeshRef.current) pushes matrices to GPU
 * ```
 */
export function useInstancedProps(
  transforms: readonly InstancedPropTransform[],
): UseInstancedPropsResult {
  // Memoize the matrix array — rebuilt only when the transforms reference
  // or length changes. We intentionally do NOT deep-compare each element;
  // callers should wrap their static transform arrays in useMemo themselves.
  const matrices = useMemo(() => {
    if (transforms.length === 0) return EMPTY_MATRICES;
    const arr = new Array<Matrix4>(transforms.length);
    for (let i = 0; i < transforms.length; i++) {
      arr[i] = new Matrix4();
      composeMatrix(transforms[i], arr[i]);
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transforms]);

  const count = transforms.length;

  const applyTo = useCallback((mesh: InstancedMesh) => {
    for (let i = 0; i < count; i++) {
      mesh.setMatrixAt(i, matrices[i]);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [matrices, count]);

  const buildMatrix = useCallback((transform: InstancedPropTransform) => {
    composeMatrix(transform, _mat);
    return _mat;
  }, []);

  return { matrices, count, applyTo, buildMatrix };
}

/* ── Singleton empty array (avoids re-alloc for zero-instance case) ── */

const EMPTY_MATRICES: readonly Matrix4[] = [];

/* ── Dynamic instance manager ────────────────────────────────── */

export interface InstancedPropManager {
  /** Current list of transforms. */
  transforms: InstancedPropTransform[];
  /** Add a new instance and return its index. */
  add: (transform: InstancedPropTransform) => number;
  /** Remove an instance by index (O(n) shift). */
  remove: (index: number) => void;
  /** Update the transform of an existing instance. */
  update: (index: number, transform: InstancedPropTransform) => void;
  /** Get a matrix for an instance (uses scratch object — copy if needed). */
  getMatrix: (index: number) => Matrix4;
  /** Rebuild all matrices into a typed array for GPU upload. */
  buildAllMatrices: () => Matrix4[];
}

/**
 * Mutable instance manager for dynamic scenes (e.g., pickups, destroyable props).
 * For static scene dressing, prefer the simpler `useInstancedProps` hook.
 *
 * ```tsx
 * const manager = useRef(createInstancedPropManager()).current;
 * manager.add({ position: [1, 0, 2] });
 * const matrices = manager.buildAllMatrices();
 * ```
 */
export function createInstancedPropManager(
  initial?: readonly InstancedPropTransform[],
): InstancedPropManager {
  const transforms: InstancedPropTransform[] = initial
    ? [...initial]
    : [];

  return {
    get transforms() {
      return transforms;
    },
    add(transform) {
      transforms.push(transform);
      return transforms.length - 1;
    },
    remove(index) {
      if (index >= 0 && index < transforms.length) {
        transforms.splice(index, 1);
      }
    },
    update(index, transform) {
      if (index >= 0 && index < transforms.length) {
        transforms[index] = transform;
      }
    },
    getMatrix(index) {
      composeMatrix(transforms[index], _mat);
      return _mat;
    },
    buildAllMatrices() {
      const arr = new Array<Matrix4>(transforms.length);
      for (let i = 0; i < transforms.length; i++) {
        arr[i] = new Matrix4();
        composeMatrix(transforms[i], arr[i]);
      }
      return arr;
    },
  };
}
