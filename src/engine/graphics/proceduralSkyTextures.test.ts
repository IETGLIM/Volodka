import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createDreamGalaxySkyTexture,
  createDreamGalaxyStarGeometry,
} from './proceduralSkyTextures';

describe('proceduralSkyTextures', () => {
  it('creates dream galaxy sky canvas texture with clamp wrapping', () => {
    const tex = createDreamGalaxySkyTexture();
    expect(tex.image).toBeInstanceOf(HTMLCanvasElement);
    expect((tex.image as HTMLCanvasElement).width).toBe(64);
    expect((tex.image as HTMLCanvasElement).height).toBe(256);
    expect(tex.wrapS).toBe(THREE.ClampToEdgeWrapping);
    expect(tex.wrapT).toBe(THREE.ClampToEdgeWrapping);
    tex.dispose();
  });

  it('creates deterministic dream star geometry on upper hemisphere', () => {
    const a = createDreamGalaxyStarGeometry(64);
    const b = createDreamGalaxyStarGeometry(64);
    const posA = a.getAttribute('position').array as Float32Array;
    const posB = b.getAttribute('position').array as Float32Array;
    expect(posA.length).toBe(64 * 3);
    expect(Array.from(posA)).toEqual(Array.from(posB));
    for (let i = 0; i < 64; i++) {
      expect(posA[i * 3 + 1]).toBeGreaterThan(8);
    }
    a.dispose();
    b.dispose();
  });
});
