/**
 * Procedural humanoid impostor atlas for AmbientNPCs (DataTexture — headless-safe).
 * Soft alpha silhouette reads as a distant person, not capsule/sphere kitbash.
 */

import { ClampToEdgeWrapping, DataTexture, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } from 'three';

const WIDTH = 64;
const HEIGHT = 128;

function insideEllipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

function insideCapsule(x: number, y: number, x0: number, y0: number, x1: number, y1: number, r: number): boolean {
  const vx = x1 - x0;
  const vy = y1 - y0;
  const len2 = vx * vx + vy * vy || 1;
  let t = ((x - x0) * vx + (y - y0) * vy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = x0 + t * vx;
  const py = y0 + t * vy;
  const dx = x - px;
  const dy = y - py;
  return dx * dx + dy * dy <= r * r;
}

/** Soft humanoid alpha (0–1) in normalized UV (origin bottom-left). */
export function sampleAmbientCrowdSilhouette(u: number, v: number): number {
  // Head
  if (insideEllipse(u, v, 0.5, 0.82, 0.13, 0.11)) return 1;
  // Neck
  if (insideCapsule(u, v, 0.5, 0.72, 0.5, 0.66, 0.05)) return 0.95;
  // Torso
  if (insideEllipse(u, v, 0.5, 0.5, 0.2, 0.22)) return 1;
  // Arms
  if (insideCapsule(u, v, 0.28, 0.58, 0.18, 0.38, 0.055)) return 0.92;
  if (insideCapsule(u, v, 0.72, 0.58, 0.82, 0.38, 0.055)) return 0.92;
  // Legs
  if (insideCapsule(u, v, 0.4, 0.32, 0.36, 0.06, 0.07)) return 0.98;
  if (insideCapsule(u, v, 0.6, 0.32, 0.64, 0.06, 0.07)) return 0.98;
  // Soft edge fringe for AA-ish mip
  const fringe =
    (insideEllipse(u, v, 0.5, 0.82, 0.15, 0.13) ? 0.35 : 0)
    + (insideEllipse(u, v, 0.5, 0.5, 0.23, 0.25) ? 0.25 : 0);
  return Math.min(1, fringe);
}

let cached: DataTexture | null = null;

/** Shared white RGB + silhouette alpha map for instanced crowd billboards. */
export function getAmbientCrowdImpostorTexture(): DataTexture {
  if (cached) return cached;

  const data = new Uint8Array(WIDTH * HEIGHT * 4);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const u = (x + 0.5) / WIDTH;
      const v = (y + 0.5) / HEIGHT;
      const a = sampleAmbientCrowdSilhouette(u, v);
      const i = (y * WIDTH + x) * 4;
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.round(a * 255);
    }
  }

  const tex = new DataTexture(data, WIDTH, HEIGHT);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  cached = tex;
  return tex;
}
