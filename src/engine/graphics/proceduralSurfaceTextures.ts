/**
 * Cached procedural surface detail maps (albedo micro-variation, normal, roughness).
 * Built as DataTextures so unit tests and headless boots do not need a full Canvas2D.
 */

import * as THREE from 'three';
import { seededRand } from '@/shared/utils/seededRand';

export type SurfaceDetailKind = 'asphalt' | 'concrete' | 'plaster' | 'wood' | 'sidewalk';

export interface SurfaceDetailMaps {
  map: THREE.DataTexture;
  normalMap: THREE.DataTexture;
  roughnessMap: THREE.DataTexture;
  /** Suggested tile repeat for a ~10m surface. */
  repeat: number;
}

const cache = new Map<string, SurfaceDetailMaps>();

function makeDataTexture(
  data: Uint8Array,
  size: number,
  colorSpace: THREE.ColorSpace,
): THREE.DataTexture {
  const tex = new THREE.DataTexture(data, size, size);
  tex.colorSpace = colorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function alloc(size: number): Uint8Array {
  return new Uint8Array(size * size * 4);
}

function writeNoise(
  out: Uint8Array,
  size: number,
  seed: number,
  amp: number,
  base: number,
): void {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n =
        seededRand(seed + x * 73856093 + y * 19349663) * amp
        + seededRand(seed + x * 83492791 + y * 297121507) * (amp * 0.45);
      const v = Math.max(0, Math.min(255, Math.round(base + n)));
      out[i] = v;
      out[i + 1] = v;
      out[i + 2] = v;
      out[i + 3] = 255;
    }
  }
}

function heightToNormal(height: Uint8Array, size: number, strength: number): Uint8Array {
  const out = alloc(size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const hL = height[((y * size + ((x - 1 + size) % size)) * 4)]!;
      const hR = height[((y * size + ((x + 1) % size)) * 4)]!;
      const hD = height[((((y - 1 + size) % size) * size + x) * 4)]!;
      const hU = height[((((y + 1) % size) * size + x) * 4)]!;
      const dx = ((hL - hR) / 255) * strength;
      const dy = ((hD - hU) / 255) * strength;
      out[i] = Math.round((dx + 1) * 0.5 * 255);
      out[i + 1] = Math.round((dy + 1) * 0.5 * 255);
      out[i + 2] = 255;
      out[i + 3] = 255;
    }
  }
  return out;
}

function buildAsphalt(size: number): SurfaceDetailMaps {
  const albedo = alloc(size);
  const height = alloc(size);
  const rough = alloc(size);
  writeNoise(height, size, 51001, 90, 128);
  writeNoise(rough, size, 61001, 70, 170);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = height[i]! - 128;
      albedo[i] = Math.max(20, Math.min(70, 40 + n * 0.22));
      albedo[i + 1] = Math.max(20, Math.min(72, 42 + n * 0.2));
      albedo[i + 2] = Math.max(28, Math.min(90, 58 + n * 0.28));
      albedo[i + 3] = 255;

      // Aggregate chip speckles
      if (seededRand(45000 + i) > 0.97) {
        const chip = 90 + seededRand(46000 + i) * 40;
        albedo[i] = chip;
        albedo[i + 1] = chip * 0.95;
        albedo[i + 2] = chip * 1.05;
      }

      const wetPatch = seededRand(62000 + i) > 0.93 ? 70 : 0;
      const r = Math.max(40, Math.min(230, rough[i]! - wetPatch));
      rough[i] = r;
      rough[i + 1] = r;
      rough[i + 2] = r;
      rough[i + 3] = 255;
    }
  }

  return {
    map: makeDataTexture(albedo, size, THREE.SRGBColorSpace),
    normalMap: makeDataTexture(heightToNormal(height, size, 0.55), size, THREE.NoColorSpace),
    roughnessMap: makeDataTexture(rough, size, THREE.NoColorSpace),
    repeat: 8,
  };
}

function buildConcrete(size: number): SurfaceDetailMaps {
  const albedo = alloc(size);
  const height = alloc(size);
  const rough = alloc(size);
  writeNoise(height, size, 73001, 70, 128);
  writeNoise(rough, size, 74001, 40, 200);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = height[i]! - 128;
      albedo[i] = Math.max(55, Math.min(120, 78 + n * 0.3));
      albedo[i + 1] = Math.max(55, Math.min(118, 76 + n * 0.28));
      albedo[i + 2] = Math.max(60, Math.min(130, 88 + n * 0.32));
      albedo[i + 3] = 255;
      rough[i + 3] = 255;
    }
  }

  // Hairline cracks
  for (let c = 0; c < 7; c++) {
    let x = Math.floor(seededRand(72200 + c) * size);
    let y = Math.floor(seededRand(72300 + c) * size);
    for (let s = 0; s < 40; s++) {
      x = (x + Math.floor((seededRand(72400 + c * 40 + s) - 0.5) * 6) + size) % size;
      y = (y + Math.floor((seededRand(72500 + c * 40 + s) - 0.5) * 6) + size) % size;
      const i = (y * size + x) * 4;
      albedo[i] = 30;
      albedo[i + 1] = 30;
      albedo[i + 2] = 40;
    }
  }

  return {
    map: makeDataTexture(albedo, size, THREE.SRGBColorSpace),
    normalMap: makeDataTexture(heightToNormal(height, size, 0.4), size, THREE.NoColorSpace),
    roughnessMap: makeDataTexture(rough, size, THREE.NoColorSpace),
    repeat: 6,
  };
}

function buildPlaster(size: number): SurfaceDetailMaps {
  const albedo = alloc(size);
  const height = alloc(size);
  const rough = alloc(size);
  writeNoise(height, size, 82001, 48, 128);
  writeNoise(rough, size, 83001, 28, 210);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = height[i]! - 128;
      albedo[i] = Math.max(90, Math.min(150, 118 + n * 0.22));
      albedo[i + 1] = Math.max(86, Math.min(145, 112 + n * 0.2));
      albedo[i + 2] = Math.max(78, Math.min(135, 100 + n * 0.18));
      albedo[i + 3] = 255;
      rough[i + 3] = 255;
    }
  }

  return {
    map: makeDataTexture(albedo, size, THREE.SRGBColorSpace),
    normalMap: makeDataTexture(heightToNormal(height, size, 0.28), size, THREE.NoColorSpace),
    roughnessMap: makeDataTexture(rough, size, THREE.NoColorSpace),
    repeat: 4,
  };
}

function buildWood(size: number): SurfaceDetailMaps {
  const albedo = alloc(size);
  const height = alloc(size);
  const rough = alloc(size);
  writeNoise(height, size, 92001, 55, 128);
  writeNoise(rough, size, 93001, 35, 165);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const band = Math.sin(x * 0.35 + seededRand(90000 + x) * 0.8) * 18;
      const shade = 88 + band + (height[i]! - 128) * 0.08;
      albedo[i] = Math.max(40, Math.min(160, shade));
      albedo[i + 1] = Math.max(30, Math.min(130, shade * 0.72));
      albedo[i + 2] = Math.max(20, Math.min(90, shade * 0.42));
      albedo[i + 3] = 255;
      rough[i + 3] = 255;
    }
  }

  return {
    map: makeDataTexture(albedo, size, THREE.SRGBColorSpace),
    normalMap: makeDataTexture(heightToNormal(height, size, 0.35), size, THREE.NoColorSpace),
    roughnessMap: makeDataTexture(rough, size, THREE.NoColorSpace),
    repeat: 3,
  };
}

function buildSidewalk(size: number): SurfaceDetailMaps {
  const base = buildConcrete(size);
  const src = base.map.image.data as Uint8Array;
  const albedo = new Uint8Array(src);
  const tile = Math.max(8, Math.floor(size / 4));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x % tile === 0 || y % tile === 0) {
        const i = (y * size + x) * 4;
        albedo[i] = 35;
        albedo[i + 1] = 35;
        albedo[i + 2] = 48;
      }
    }
  }
  // Own textures so cache disposal never double-frees concrete entries.
  base.map.dispose();
  return {
    map: makeDataTexture(albedo, size, THREE.SRGBColorSpace),
    normalMap: base.normalMap,
    roughnessMap: base.roughnessMap,
    repeat: 5,
  };
}

function buildKind(kind: SurfaceDetailKind, size: number): SurfaceDetailMaps {
  switch (kind) {
    case 'asphalt':
      return buildAsphalt(size);
    case 'concrete':
      return buildConcrete(size);
    case 'plaster':
      return buildPlaster(size);
    case 'wood':
      return buildWood(size);
    case 'sidewalk':
      return buildSidewalk(size);
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

/** Resolution by quality — keep GPU memory modest for browser 60 FPS. */
export function resolveSurfaceTextureSize(textureScale: 0.25 | 0.5 | 1): number {
  if (textureScale <= 0.25) return 64;
  if (textureScale <= 0.5) return 128;
  return 512; // high/ultra — 512² detail maps for hero surfaces
}

export function getCachedSurfaceDetailMaps(
  kind: SurfaceDetailKind,
  textureScale: 0.25 | 0.5 | 1 = 1,
): SurfaceDetailMaps {
  const size = resolveSurfaceTextureSize(textureScale);
  const key = `${kind}:${size}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const maps = buildKind(kind, size);
  cache.set(key, maps);
  return maps;
}

export function clearSurfaceDetailCache(): void {
  for (const maps of cache.values()) {
    maps.map.dispose();
    maps.normalMap.dispose();
    maps.roughnessMap.dispose();
  }
  cache.clear();
}

/** Apply tiled detail maps to a standard/physical material (mutates in place). */
export function applySurfaceDetailMaps(
  material: THREE.MeshStandardMaterial,
  kind: SurfaceDetailKind,
  textureScale: 0.25 | 0.5 | 1 = 1,
  repeatScale = 1,
): void {
  const maps = getCachedSurfaceDetailMaps(kind, textureScale);
  const repeat = maps.repeat * repeatScale;

  const cloneMap = (src: THREE.DataTexture) => {
    const t = src.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.needsUpdate = true;
    return t;
  };

  material.map = cloneMap(maps.map);
  material.normalMap = cloneMap(maps.normalMap);
  material.normalScale = new THREE.Vector2(0.55, 0.55);
  material.roughnessMap = cloneMap(maps.roughnessMap);
  material.needsUpdate = true;
}
