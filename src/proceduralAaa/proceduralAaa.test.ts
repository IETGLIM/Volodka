import { describe, expect, it } from 'vitest';
import {
  smin,
  hardMin,
  hardMax,
  generateWorldLayout,
  buildSdfWorldGeometry,
  sdArch,
} from './ProceduralSdfWorld';
import {
  DEFAULT_PROCEDURAL_AAA_PARAMS,
  resolveSdfResolutionForQuality,
  resolveTextureSizeForQuality,
  resolveParallaxLayersForQuality,
  resolveSoftWorkForQuality,
} from './params';
import { solveFabrik, createChain, updateIdleBreathe } from './ProceduralFabrikIk';
import { generateDynamicTexturesSync, clearDynamicTextureCache } from './DynamicTextureGenerator';
import * as THREE from 'three';

describe('proceduralAaa pipeline', () => {
  it('smooth-min blends overlapping distances', () => {
    expect(smin(0.5, 0.6, 1)).toBeLessThan(0.5);
  });

  it('hard min/max stay crisp', () => {
    expect(hardMin(0.2, 0.5)).toBe(0.2);
    expect(hardMax(0.2, 0.5)).toBe(0.5);
  });

  it('builds unique world layout with arches/bridges from seed', () => {
    const a = generateWorldLayout({ ...DEFAULT_PROCEDURAL_AAA_PARAMS, seed: 1 });
    const b = generateWorldLayout({ ...DEFAULT_PROCEDURAL_AAA_PARAMS, seed: 2 });
    expect(a.length).toBeGreaterThan(3);
    expect(a.some((p) => p.kind === 'arch' || p.kind === 'bridge' || p.kind === 'ruin_tier')).toBe(true);
    expect(a[1]!.center.x).not.toBeCloseTo(b[1]!.center.x, 1);
  });

  it('arch SDF carves a tunnel (negative inside opening)', () => {
    const c = new THREE.Vector3(0, 2, 0);
    const half = new THREE.Vector3(1.5, 2, 0.6);
    // Outside solid wall should be positive-ish or less negative than tunnel center
    const inTunnel = sdArch(new THREE.Vector3(0, 1.2, 0), c, half, 1.0, 'z');
    const inWall = sdArch(new THREE.Vector3(1.4, 2, 0), c, half, 1.0, 'z');
    expect(inTunnel).toBeGreaterThan(inWall);
  });

  it('surface-nets produces welded indexed geometry', () => {
    const geo = buildSdfWorldGeometry({
      ...DEFAULT_PROCEDURAL_AAA_PARAMS,
      sdfResolution: 24,
    });
    const pos = geo.getAttribute('position');
    expect(pos).toBeTruthy();
    expect(pos!.count).toBeGreaterThan(100);
    expect(geo.getIndex()).toBeTruthy();
    expect(geo.getAttribute('normal')).toBeTruthy();
    geo.dispose();
  });

  it('Ultra quality uses 60fps-safe caps (not ≥72 / forced 2048 / 24 parallax)', () => {
    expect(resolveSdfResolutionForQuality('ultra', 48)).toBeGreaterThanOrEqual(56);
    expect(resolveSdfResolutionForQuality('ultra', 48)).toBeLessThanOrEqual(60);
    expect(resolveSdfResolutionForQuality('ultra', 96)).toBe(60);
    expect(resolveTextureSizeForQuality('ultra', undefined, { pixelCount: 3_000_000 })).toBe(1024);
    expect(resolveTextureSizeForQuality('ultra', 2048, { pixelCount: 1_800_000 })).toBe(2048);
    expect(resolveTextureSizeForQuality('ultra', 2048, { pixelCount: 4_000_000 })).toBe(1024);
    expect(resolveParallaxLayersForQuality('ultra', 16)).toBeLessThanOrEqual(16);
    expect(resolveParallaxLayersForQuality('high', 16)).toBe(16);
  });

  it('skips soft volumetrics under heavy Ultra framebuffer', () => {
    const soft = resolveSoftWorkForQuality(
      'ultra',
      { volumetricRays: 0.45, dirtAmount: 0.58, rainWash: 0.48 },
      { pixelCount: 4_000_000 },
    );
    expect(soft.skipSoftVolumetrics).toBe(true);
    expect(soft.volumetricRays).toBeLessThanOrEqual(0.22);
  });

  it('Ultra proactively trims soft work even on mid-res frames', () => {
    const soft = resolveSoftWorkForQuality(
      'ultra',
      { volumetricRays: 0.45, dirtAmount: 0.58, rainWash: 0.48 },
      { pixelCount: 1_800_000 },
    );
    expect(soft.volumetricRays).toBeLessThanOrEqual(0.28);
    expect(soft.dirtAmount).toBeLessThanOrEqual(0.48);
  });

  it('FABRIK reaches target within chain length', () => {
    const chain = createChain([
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const target = new THREE.Vector3(0.3, 0.1, 0);
    solveFabrik(chain, target, 12);
    expect(chain.joints[chain.joints.length - 1]!.distanceTo(target)).toBeLessThan(0.05);
  });

  it('idle breathe phase advances', () => {
    expect(updateIdleBreathe(0, 0.5)).toBeGreaterThan(0);
  });

  it('caches dynamic textures', () => {
    clearDynamicTextureCache();
    const a = generateDynamicTexturesSync('asphalt', 512, 1);
    const b = generateDynamicTexturesSync('asphalt', 512, 1);
    expect(a).toBe(b);
    clearDynamicTextureCache();
  });
});
