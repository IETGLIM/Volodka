import type * as THREE from 'three';

const MIN_POSITIVE = 1e-4;

/** Coerce to a finite positive number, or return fallback. */
export function finitePositive(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < MIN_POSITIVE) return fallback;
  return n;
}

/** Replace NaN/Infinity in a position Float32Array; returns true if any value was invalid. */
export function sanitizePositionArray(positions: Float32Array): boolean {
  let hadInvalid = false;
  for (let i = 0; i < positions.length; i++) {
    if (!Number.isFinite(positions[i])) {
      positions[i] = 0;
      hadInvalid = true;
    }
  }
  return hadInvalid;
}

/** Sanitize BufferGeometry position attribute in-place; recomputes bounds when dirty. */
export function sanitizeBufferGeometryPositions(geometry: THREE.BufferGeometry): boolean {
  const attr = geometry.getAttribute('position');
  if (!attr || !(attr.array instanceof Float32Array)) return false;

  const hadInvalid = sanitizePositionArray(attr.array);
  if (hadInvalid) {
    attr.needsUpdate = true;
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
  }
  return hadInvalid;
}
