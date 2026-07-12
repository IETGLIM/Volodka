import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  computeAnimatedTerrainWaveOffset,
  createAnimatedTerrainMaterial,
  setAnimatedTerrainTime,
} from './animatedTerrainMaterial';

describe('animatedTerrainMaterial', () => {
  it('computeAnimatedTerrainWaveOffset matches the shader wave formula', () => {
    const x = 2.5;
    const z = -1.25;
    const elapsed = 3.7;
    const scale = 0.15;
    const t = elapsed * scale;
    const expected = Math.sin(x * 0.1 + t) * 0.3 + Math.cos(z * 0.08 + t * 0.7) * 0.2;
    expect(computeAnimatedTerrainWaveOffset(x, z, elapsed, scale)).toBe(expected);
  });

  it('createAnimatedTerrainMaterial stores anim uniforms for frame updates', () => {
    const material = createAnimatedTerrainMaterial({ timeScale: 0.2, roughness: 0.9 });
    expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(material.userData.animUniforms.uAnimTimeScale.value).toBe(0.2);
    expect(material.userData.animUniforms.uAnimTime.value).toBe(0);
    setAnimatedTerrainTime(material, 12.5);
    expect(material.userData.animUniforms.uAnimTime.value).toBe(12.5);
    material.dispose();
  });
});
