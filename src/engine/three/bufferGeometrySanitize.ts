import type * as THREE from 'three';

const MIN_POSITIVE = 1e-4;
const DEFAULT_NORMAL = { x: 0, y: 1, z: 0 } as const;

type IndexArray = Uint16Array | Uint32Array | Int32Array;

/** Coerce to a finite positive number, or return fallback. */
export function finitePositive(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < MIN_POSITIVE) return fallback;
  return n;
}

/** Replace NaN/Infinity in a Float32Array; returns true if any value was invalid. */
export function sanitizeFiniteFloat32Array(values: Float32Array): boolean {
  let hadInvalid = false;
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i])) {
      values[i] = 0;
      hadInvalid = true;
    }
  }
  return hadInvalid;
}

/** Replace NaN/Infinity in a position Float32Array; returns true if any value was invalid. */
export function sanitizePositionArray(positions: Float32Array): boolean {
  return sanitizeFiniteFloat32Array(positions);
}

/** Fix non-finite and zero-length normals; returns true if any normal was invalid. */
export function sanitizeNormalArray(normals: Float32Array): boolean {
  let hadInvalid = false;
  for (let i = 0; i + 2 < normals.length; i += 3) {
    let x = normals[i];
    let y = normals[i + 1];
    let z = normals[i + 2];

    if (!Number.isFinite(x)) {
      x = DEFAULT_NORMAL.x;
      hadInvalid = true;
    }
    if (!Number.isFinite(y)) {
      y = DEFAULT_NORMAL.y;
      hadInvalid = true;
    }
    if (!Number.isFinite(z)) {
      z = DEFAULT_NORMAL.z;
      hadInvalid = true;
    }

    const lengthSq = x * x + y * y + z * z;
    if (lengthSq < MIN_POSITIVE * MIN_POSITIVE) {
      x = DEFAULT_NORMAL.x;
      y = DEFAULT_NORMAL.y;
      z = DEFAULT_NORMAL.z;
      hadInvalid = true;
    }

    normals[i] = x;
    normals[i + 1] = y;
    normals[i + 2] = z;
  }
  return hadInvalid;
}

/** Replace NaN/Infinity in UV coordinates; returns true if any value was invalid. */
export function sanitizeUvArray(uvs: Float32Array): boolean {
  return sanitizeFiniteFloat32Array(uvs);
}

/** Clamp out-of-range indices to 0; returns true if any index was invalid. */
export function sanitizeIndexArray(indices: IndexArray, vertexCount: number): boolean {
  if (vertexCount <= 0) return false;

  const maxIndex = vertexCount - 1;
  let hadInvalid = false;
  for (let i = 0; i < indices.length; i++) {
    const index = indices[i];
    if (index < 0 || index > maxIndex) {
      indices[i] = 0;
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

/** Sanitize BufferGeometry normal attribute in-place. */
export function sanitizeBufferGeometryNormals(geometry: THREE.BufferGeometry): boolean {
  const attr = geometry.getAttribute('normal');
  if (!attr || !(attr.array instanceof Float32Array)) return false;

  const hadInvalid = sanitizeNormalArray(attr.array);
  if (hadInvalid) attr.needsUpdate = true;
  return hadInvalid;
}

/** Sanitize BufferGeometry uv/uv2 attributes in-place. */
export function sanitizeBufferGeometryUvs(geometry: THREE.BufferGeometry): boolean {
  let hadInvalid = false;

  for (const name of ['uv', 'uv2'] as const) {
    const attr = geometry.getAttribute(name);
    if (!attr || !(attr.array instanceof Float32Array)) continue;

    if (sanitizeUvArray(attr.array)) {
      attr.needsUpdate = true;
      hadInvalid = true;
    }
  }

  return hadInvalid;
}

/** Sanitize BufferGeometry index buffer in-place. */
export function sanitizeBufferGeometryIndex(geometry: THREE.BufferGeometry): boolean {
  const index = geometry.index;
  const position = geometry.getAttribute('position');
  if (!index || !position) return false;

  const array = index.array;
  if (
    !(array instanceof Uint16Array)
    && !(array instanceof Uint32Array)
    && !(array instanceof Int32Array)
  ) {
    return false;
  }

  const hadInvalid = sanitizeIndexArray(array, position.count);
  if (hadInvalid) index.needsUpdate = true;
  return hadInvalid;
}

/** Sanitize position, normal, UV, and index attributes in-place. */
export function sanitizeBufferGeometry(geometry: THREE.BufferGeometry): boolean {
  let hadInvalid = false;
  hadInvalid = sanitizeBufferGeometryPositions(geometry) || hadInvalid;
  hadInvalid = sanitizeBufferGeometryNormals(geometry) || hadInvalid;
  hadInvalid = sanitizeBufferGeometryUvs(geometry) || hadInvalid;
  hadInvalid = sanitizeBufferGeometryIndex(geometry) || hadInvalid;
  return hadInvalid;
}
