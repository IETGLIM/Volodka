import { describe, expect, it, afterEach } from 'vitest';
import * as THREE from 'three';
import {
  applySurfaceDetailMaps,
  clearSurfaceDetailCache,
  getCachedSurfaceDetailMaps,
  resolveSurfaceTextureSize,
} from './proceduralSurfaceTextures';

describe('proceduralSurfaceTextures', () => {
  afterEach(() => {
    clearSurfaceDetailCache();
  });

  it('resolves texture size from quality scale', () => {
    expect(resolveSurfaceTextureSize(0.25)).toBe(64);
    expect(resolveSurfaceTextureSize(0.5)).toBe(128);
    expect(resolveSurfaceTextureSize(1)).toBe(512);
  });

  it('caches asphalt detail maps and applies them to a material', () => {
    const a = getCachedSurfaceDetailMaps('asphalt', 0.5);
    const b = getCachedSurfaceDetailMaps('asphalt', 0.5);
    expect(a).toBe(b);
    expect(a.map).toBeInstanceOf(THREE.DataTexture);
    expect(a.normalMap).toBeInstanceOf(THREE.DataTexture);
    expect(a.roughnessMap).toBeInstanceOf(THREE.DataTexture);

    const mat = new THREE.MeshStandardMaterial();
    applySurfaceDetailMaps(mat, 'asphalt', 0.5, 1);
    expect(mat.map).toBeTruthy();
    expect(mat.normalMap).toBeTruthy();
    expect(mat.roughnessMap).toBeTruthy();
    mat.dispose();
  });

  it('builds sidewalk tile maps', () => {
    const maps = getCachedSurfaceDetailMaps('sidewalk', 0.25);
    expect(maps.repeat).toBeGreaterThan(0);
    expect((maps.map.image.data as Uint8Array).byteLength).toBeGreaterThan(0);
  });
});
