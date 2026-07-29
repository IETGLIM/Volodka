/**
 * Worker — heavy texture / SDF field generation off main thread (Job System + Burst).
 * Main thread applies transferable buffers into DataTextures.
 */

import { fbm2, worley2, hash2 } from '../noise';

export type TextureGenRequest = {
  op: 'genTexture';
  id: number;
  kind: 'asphalt' | 'concrete' | 'metal_worn' | 'brick' | 'skin';
  size: number;
  seed: number;
};

export type TextureGenResponse = {
  op: 'genTexture';
  id: number;
  size: number;
  kind: string;
  /** interleaved RGBA buffers */
  albedo: ArrayBuffer;
  normal: ArrayBuffer;
  roughness: ArrayBuffer;
  metalness: ArrayBuffer;
  height: ArrayBuffer;
};

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

function gen(kind: TextureGenRequest['kind'], size: number, seed: number): TextureGenResponse['albedo'][] {
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
      let h = fbm2(fx, fy, 4, 2, 0.5, seed);
      let r = 40;
      let g = 40;
      let b = 48;
      let roughness = 0.7;
      let metalness = 0;

      if (kind === 'asphalt') {
        h = h * 0.55 + worley2(fx * 2, fy * 2, seed) * 0.2;
        r = Math.round(28 + h * 40);
        g = Math.round(30 + h * 38);
        b = Math.round(42 + h * 50);
        roughness = 0.78 - h * 0.2;
      } else if (kind === 'concrete') {
        const cracks = worley2(fx * 1.5, fy * 1.5, seed + 1);
        r = Math.round(110 + h * 50 - cracks * 30);
        g = Math.round(108 + h * 48 - cracks * 28);
        b = Math.round(100 + h * 40 - cracks * 20);
        roughness = 0.85;
      } else if (kind === 'metal_worn') {
        const wear = worley2(fx * 3, fy * 3, seed + 5);
        r = Math.round(90 + h * 80 - wear * 40);
        g = Math.round(95 + h * 70 - wear * 30);
        b = Math.round(105 + h * 90 - wear * 20);
        roughness = 0.25 + wear * 0.55;
        metalness = 0.85 - wear * 0.4;
      } else if (kind === 'brick') {
        const bx = Math.floor(u * 12);
        const by = Math.floor(v * 8);
        const mortar = ((u * 12) % 1) < 0.08 || ((v * 8) % 1) < 0.1;
        if (mortar) {
          r = 70; g = 68; b = 62; roughness = 0.9; h = 0.1;
        } else {
          const tint = hash2(bx, by, seed);
          r = Math.round(120 + tint * 60);
          g = Math.round(55 + tint * 25);
          b = Math.round(45 + tint * 20);
          roughness = 0.75;
          h = 0.45;
        }
      } else {
        r = Math.round(210 + h * 20);
        g = Math.round(160 + h * 15);
        b = Math.round(140 + h * 10);
        roughness = 0.45;
        h *= 0.15;
      }

      height[i] = h;
      const o = i * 4;
      albedo[o] = r; albedo[o + 1] = g; albedo[o + 2] = b; albedo[o + 3] = 255;
      const rv = Math.round(roughness * 255);
      rough[o] = rv; rough[o + 1] = rv; rough[o + 2] = rv; rough[o + 3] = 255;
      const mv = Math.round(metalness * 255);
      metal[o] = mv; metal[o + 1] = mv; metal[o + 2] = mv; metal[o + 3] = 255;
      const hv = Math.round(Math.max(0, Math.min(1, h)) * 255);
      heightRgba[o] = hv; heightRgba[o + 1] = hv; heightRgba[o + 2] = hv; heightRgba[o + 3] = 255;
    }
  }

  const normal = heightToNormal(height, size, 4.5);
  return [
    albedo.buffer as ArrayBuffer,
    normal.buffer as ArrayBuffer,
    rough.buffer as ArrayBuffer,
    metal.buffer as ArrayBuffer,
    heightRgba.buffer as ArrayBuffer,
  ];
}

self.onmessage = (event: MessageEvent<TextureGenRequest>) => {
  const msg = event.data;
  if (msg.op !== 'genTexture') return;
  const buffers = gen(msg.kind, msg.size, msg.seed);
  const response: TextureGenResponse = {
    op: 'genTexture',
    id: msg.id,
    size: msg.size,
    kind: msg.kind,
    albedo: buffers[0]!,
    normal: buffers[1]!,
    roughness: buffers[2]!,
    metalness: buffers[3]!,
    height: buffers[4]!,
  };
  (self as unknown as Worker).postMessage(response, buffers);
};
