import { describe, expect, it, afterEach } from 'vitest';
import * as THREE from 'three';
import {
  createProceduralLut3DTexture,
  disposeProceduralLutCache,
  getCachedProceduralLut3DTexture,
  PROCEDURAL_LUT_SCENES,
  resolveProceduralLutKind,
} from './proceduralLutTextures';

describe('proceduralLutTextures', () => {
  afterEach(() => {
    disposeProceduralLutCache();
  });

  it('maps neon scenes to synthwave LUT kind', () => {
    expect(resolveProceduralLutKind('street_night')).toBe('synthwave_neon');
    expect(resolveProceduralLutKind('cafe_evening')).toBe('synthwave_neon');
    expect(resolveProceduralLutKind('sleep_dream')).toBe('synthwave_neon');
    expect(resolveProceduralLutKind('home_evening')).toBe('warm_interior');
    expect(resolveProceduralLutKind('library_day')).toBe('gothic_dust');
    expect(resolveProceduralLutKind('park_day')).toBeNull();
  });

  it('creates 16³ Data3DTexture with clamp wrapping', () => {
    const tex = createProceduralLut3DTexture('synthwave_neon');
    expect(tex).toBeInstanceOf(THREE.Data3DTexture);
    expect(tex.image.width).toBe(16);
    expect(tex.image.height).toBe(16);
    expect(tex.image.depth).toBe(16);
    expect(tex.wrapS).toBe(THREE.ClampToEdgeWrapping);
    tex.dispose();
  });

  it('boosts blue channel in synthwave shadow corners vs identity', () => {
    const tex = createProceduralLut3DTexture('synthwave_neon');
    const data = tex.image.data as Uint8Array;
    const cornerIdx = 0;
    expect(data[cornerIdx + 2]).toBeGreaterThan(0);
    tex.dispose();
  });

  it('caches LUT textures per kind', () => {
    const a = getCachedProceduralLut3DTexture('warm_interior');
    const b = getCachedProceduralLut3DTexture('warm_interior');
    expect(a).toBe(b);
  });

  it('covers hero interior scenes in registry', () => {
    expect(PROCEDURAL_LUT_SCENES.office_day).toBe('gothic_dust');
    expect(PROCEDURAL_LUT_SCENES.home_evening).toBe('warm_interior');
  });
});
