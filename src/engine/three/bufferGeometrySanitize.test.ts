import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  finitePositive,
  sanitizeBufferGeometryPositions,
  sanitizePositionArray,
} from './bufferGeometrySanitize';

describe('bufferGeometrySanitize', () => {
  it('finitePositive rejects non-finite and sub-minimum values', () => {
    expect(finitePositive(NaN, 2)).toBe(2);
    expect(finitePositive(0, 2)).toBe(2);
    expect(finitePositive(-1, 2)).toBe(2);
    expect(finitePositive(1.5, 2)).toBe(1.5);
  });

  it('sanitizePositionArray zeroes invalid components', () => {
    const arr = new Float32Array([1, NaN, Infinity, -3]);
    expect(sanitizePositionArray(arr)).toBe(true);
    expect(Array.from(arr)).toEqual([1, 0, 0, -3]);
  });

  it('sanitizeBufferGeometryPositions fixes geometry bounds', () => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, NaN, 0]), 3));
    expect(sanitizeBufferGeometryPositions(geo)).toBe(true);
    expect(Number.isFinite(geo.boundingSphere?.radius ?? NaN)).toBe(true);
  });
});
