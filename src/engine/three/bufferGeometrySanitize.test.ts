import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  finitePositive,
  sanitizeBufferGeometry,
  sanitizeBufferGeometryIndex,
  sanitizeBufferGeometryNormals,
  sanitizeBufferGeometryPositions,
  sanitizeBufferGeometryUvs,
  sanitizeIndexArray,
  sanitizeNormalArray,
  sanitizePositionArray,
  sanitizeUvArray,
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

  it('sanitizeNormalArray fixes non-finite and zero-length normals', () => {
    const arr = new Float32Array([
      NaN, 0, 0,
      0, 0, 0,
      0, 1, 0,
    ]);
    expect(sanitizeNormalArray(arr)).toBe(true);
    expect(Array.from(arr.slice(0, 3))).toEqual([0, 1, 0]);
    expect(Array.from(arr.slice(3, 6))).toEqual([0, 1, 0]);
    expect(Array.from(arr.slice(6, 9))).toEqual([0, 1, 0]);
  });

  it('sanitizeUvArray zeroes invalid components', () => {
    const arr = new Float32Array([0.5, NaN, Infinity, -1]);
    expect(sanitizeUvArray(arr)).toBe(true);
    expect(Array.from(arr)).toEqual([0.5, 0, 0, -1]);
  });

  it('sanitizeIndexArray clamps out-of-range indices', () => {
    const arr = new Uint16Array([0, 2, 5, 1]);
    expect(sanitizeIndexArray(arr, 3)).toBe(true);
    expect(Array.from(arr)).toEqual([0, 2, 0, 1]);
  });

  it('sanitizeBufferGeometryPositions fixes geometry bounds', () => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, NaN, 0]), 3));
    expect(sanitizeBufferGeometryPositions(geo)).toBe(true);
    expect(Number.isFinite(geo.boundingSphere?.radius ?? NaN)).toBe(true);
  });

  it('sanitizeBufferGeometryNormals updates invalid normals', () => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
    expect(sanitizeBufferGeometryNormals(geo)).toBe(true);
    expect(Array.from(geo.getAttribute('normal').array)).toEqual([0, 1, 0]);
  });

  it('sanitizeBufferGeometryUvs updates uv and uv2', () => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([NaN, 0.5]), 2));
    geo.setAttribute('uv2', new THREE.BufferAttribute(new Float32Array([0.25, Infinity]), 2));
    expect(sanitizeBufferGeometryUvs(geo)).toBe(true);
    expect(Array.from(geo.getAttribute('uv').array)).toEqual([0, 0.5]);
    expect(Array.from(geo.getAttribute('uv2').array)).toEqual([0.25, 0]);
  });

  it('sanitizeBufferGeometryIndex fixes invalid index buffers', () => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), 3));
    geo.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 1, 99]), 1));
    expect(sanitizeBufferGeometryIndex(geo)).toBe(true);
    expect(Array.from(geo.index!.array)).toEqual([0, 1, 0]);
  });

  it('sanitizeBufferGeometry sanitizes all supported attributes', () => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, NaN, 0]), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([NaN, 0.5]), 2));
    geo.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 0, 9]), 1));

    expect(sanitizeBufferGeometry(geo)).toBe(true);
    expect(Array.from(geo.getAttribute('position').array)).toEqual([0, 0, 0]);
    expect(Array.from(geo.getAttribute('normal').array)).toEqual([0, 1, 0]);
    expect(Array.from(geo.getAttribute('uv').array)).toEqual([0, 0.5]);
    expect(Array.from(geo.index!.array)).toEqual([0, 0, 0]);
  });
});
