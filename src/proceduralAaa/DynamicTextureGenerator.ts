/**
 * Pillar 3 — Dynamic realtime texture generation (Unity Compute Shader 2048²).
 * Web: Worker CPU gen of DataTextures (albedo/normal/rough/metal) + cache.
 * Default 1024; Ultra 2048 — document GPU fill-rate tradeoff vs 60fps.
 */

import * as THREE from 'three';
import { fbm2, worley2, hash2 } from './noise';
import type { TextureResolutionTier } from './params';

export type DynamicTextureKind = 'asphalt' | 'concrete' | 'metal_worn' | 'brick' | 'skin';

export interface DynamicTextureSet {
  albedo: THREE.DataTexture;
  normal: THREE.DataTexture;
  roughness: THREE.DataTexture;
  metalness: THREE.DataTexture;
  height: THREE.DataTexture;
  size: number;
  kind: DynamicTextureKind;
}

const cache = new Map<string, DynamicTextureSet>();

function makeTex(data: Uint8Array, size: number, colorSpace: THREE.ColorSpace): THREE.DataTexture {
  const tex = new THREE.DataTexture(data, size, size);
  tex.colorSpace = colorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function heightToNormal(height: Float32Array, size: number, strength: number): Uint8Array {
  const out = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const hL = height[y * size + ((x - 1 + size) % size)]!;
      const hR = height[y * size + ((x + 1) % size)]!;
      const hD = height[((y - 1 + size) % size) * size + x]!;
      const hU = height[((y + 1) % size) * size + x]!;
      const dx = (hL - hR) * strength;
      const dy = (hD - hU) * strength;
      const o = i * 4;
      out[o] = Math.round((dx * 0.5 + 0.5) * 255);
      out[o + 1] = Math.round((dy * 0.5 + 0.5) * 255);
      out[o + 2] = 255;
      out[o + 3] = 255;
    }
  }
  return out;
}

/** Sync CPU generator — used on main thread for small sizes / fallback. */
export function generateDynamicTexturesSync(
  kind: DynamicTextureKind,
  size: TextureResolutionTier,
  seed = 0,
): DynamicTextureSet {
  const key = `${kind}:${size}:${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const n = size * size;
  const height = new Float32Array(n);
  const albedo = new Uint8Array(n * 4);
  const rough = new Uint8Array(n * 4);
  const metal = new Uint8Array(n * 4);
  const heightRgba = new Uint8Array(n * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const u = x / size;
      const v = y / size;
      const fx = u * 8;
      const fy = v * 8;

      let h = 0;
      let r = 40;
      let g = 40;
      let b = 48;
      let roughness = 0.7;
      let metalness = 0;

      if (kind === 'asphalt') {
        h = fbm2(fx, fy, 5, 2, 0.55, seed) * 0.55 + worley2(fx * 2, fy * 2, seed) * 0.2;
        const chip = hash2(x, y, seed) > 0.97 ? 40 : 0;
        r = Math.round(28 + h * 40 + chip);
        g = Math.round(30 + h * 38 + chip * 0.8);
        b = Math.round(42 + h * 50 + chip);
        roughness = 0.78 - h * 0.2;
        // Rain wash darker in valleys
        if (h < 0.35) {
          r = Math.round(r * 0.75);
          g = Math.round(g * 0.78);
          b = Math.round(b * 0.9);
          roughness *= 0.7;
        }
      } else if (kind === 'concrete') {
        h = fbm2(fx * 0.8, fy * 0.8, 4, 2, 0.5, seed + 3);
        const cracks = worley2(fx * 1.5, fy * 1.5, seed + 1);
        r = Math.round(110 + h * 50 - cracks * 30);
        g = Math.round(108 + h * 48 - cracks * 28);
        b = Math.round(100 + h * 40 - cracks * 20);
        roughness = 0.85 - h * 0.15;
        h = h * 0.4 + (1 - cracks) * 0.15;
      } else if (kind === 'metal_worn') {
        h = fbm2(fx * 1.2, fy * 1.2, 4, 2.1, 0.5, seed + 7);
        const wear = worley2(fx * 3, fy * 3, seed + 5);
        r = Math.round(90 + h * 80 - wear * 40);
        g = Math.round(95 + h * 70 - wear * 30);
        b = Math.round(105 + h * 90 - wear * 20);
        roughness = 0.25 + wear * 0.55;
        metalness = 0.85 - wear * 0.4;
        h = h * 0.25 + wear * 0.2;
      } else if (kind === 'brick') {
        const bx = Math.floor(u * 12);
        const by = Math.floor(v * 8 + (bx % 2) * 0.5);
        const lx = (u * 12) % 1;
        const ly = (v * 8 + (bx % 2) * 0.5) % 1;
        const mortar = lx < 0.08 || ly < 0.1;
        h = mortar ? 0.1 : 0.4 + hash2(bx, by, seed) * 0.35;
        if (mortar) {
          r = 70; g = 68; b = 62;
          roughness = 0.9;
        } else {
          const tint = hash2(bx, by, seed + 2);
          r = Math.round(120 + tint * 60);
          g = Math.round(55 + tint * 25);
          b = Math.round(45 + tint * 20);
          roughness = 0.75;
        }
      } else {
        // skin
        h = fbm2(fx * 2, fy * 2, 3, 2, 0.5, seed + 11) * 0.15;
        r = Math.round(210 + h * 30);
        g = Math.round(160 + h * 20);
        b = Math.round(140 + h * 15);
        roughness = 0.45;
        metalness = 0;
      }

      height[i] = h;
      const o = i * 4;
      albedo[o] = Math.max(0, Math.min(255, r));
      albedo[o + 1] = Math.max(0, Math.min(255, g));
      albedo[o + 2] = Math.max(0, Math.min(255, b));
      albedo[o + 3] = 255;

      const rv = Math.round(Math.max(0, Math.min(1, roughness)) * 255);
      rough[o] = rv;
      rough[o + 1] = rv;
      rough[o + 2] = rv;
      rough[o + 3] = 255;

      const mv = Math.round(Math.max(0, Math.min(1, metalness)) * 255);
      metal[o] = mv;
      metal[o + 1] = mv;
      metal[o + 2] = mv;
      metal[o + 3] = 255;

      const hv = Math.round(Math.max(0, Math.min(1, h)) * 255);
      heightRgba[o] = hv;
      heightRgba[o + 1] = hv;
      heightRgba[o + 2] = hv;
      heightRgba[o + 3] = 255;
    }
  }

  const normal = heightToNormal(height, size, 4.5);
  const set: DynamicTextureSet = {
    albedo: makeTex(albedo, size, THREE.SRGBColorSpace),
    normal: makeTex(normal, size, THREE.NoColorSpace),
    roughness: makeTex(rough, size, THREE.NoColorSpace),
    metalness: makeTex(metal, size, THREE.NoColorSpace),
    height: makeTex(heightRgba, size, THREE.NoColorSpace),
    size,
    kind,
  };
  cache.set(key, set);
  return set;
}

export function clearDynamicTextureCache(): void {
  for (const set of cache.values()) {
    set.albedo.dispose();
    set.normal.dispose();
    set.roughness.dispose();
    set.metalness.dispose();
    set.height.dispose();
  }
  cache.clear();
}

export function getDynamicTextureCacheSize(): number {
  return cache.size;
}

/** Apply maps to MeshStandardMaterial (main-thread apply after worker/sync gen). */
export function applyDynamicTexturesToMaterial(
  mat: THREE.MeshStandardMaterial,
  set: DynamicTextureSet,
  repeat = 4,
): void {
  mat.map = set.albedo;
  mat.normalMap = set.normal;
  mat.roughnessMap = set.roughness;
  mat.metalnessMap = set.metalness;
  mat.displacementMap = set.height;
  mat.displacementScale = 0.02;
  for (const t of [set.albedo, set.normal, set.roughness, set.metalness, set.height]) {
    t.repeat.set(repeat, repeat);
  }
  mat.needsUpdate = true;
}
