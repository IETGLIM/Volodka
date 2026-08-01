import * as THREE from 'three';

const LUT_SIZE = 16;

export type ProceduralLutKind = 'synthwave_neon' | 'warm_interior' | 'gothic_dust' | 'cyber_noir';

/** Scenes that receive a procedural 3D LUT pass (neon / mood grade). */
export const PROCEDURAL_LUT_SCENES: Record<string, ProceduralLutKind> = {
  street_night: 'synthwave_neon',
  cafe_evening: 'synthwave_neon',
  sleep_dream: 'synthwave_neon',
  home_evening: 'warm_interior',
  library_day: 'gothic_dust',
  office_day: 'gothic_dust',
  volodka_room: 'warm_interior',
  volodka_corridor: 'gothic_dust',
  abandoned_factory: 'gothic_dust',
  factory_basement: 'gothic_dust',
  zarema_albert_room: 'warm_interior',
  street_winter: 'gothic_dust',
  // Session 9: city_square gets a restrained cyber-noir grade (teal shadows / warm highlights).
  // Tasteful orange-teal, NOT candy — the plaza reads as wet filmic noir rather than flat neon.
  city_square: 'cyber_noir',
};

export function resolveProceduralLutKind(sceneId: string): ProceduralLutKind | null {
  return PROCEDURAL_LUT_SCENES[sceneId] ?? null;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function applyLutTransform(
  r: number,
  g: number,
  b: number,
  kind: ProceduralLutKind,
): [number, number, number] {
  switch (kind) {
    case 'synthwave_neon': {
      const lum = r * 0.299 + g * 0.587 + b * 0.114;
      const satBoost = 1 + (1 - lum) * 0.22;
      let nr = r + (r - lum) * 0.28 * satBoost + 0.04;
      let ng = g + (g - lum) * 0.12 * satBoost - 0.02;
      let nb = b + (b - lum) * 0.34 * satBoost + 0.06;
      nr += 0.06 * (1 - lum);
      nb += 0.08 * (1 - lum);
      ng += 0.02 * lum;
      return [clamp01(nr), clamp01(ng), clamp01(nb)];
    }
    case 'warm_interior': {
      const lum = r * 0.299 + g * 0.587 + b * 0.114;
      let nr = r * 1.04 + 0.04 * (1 - lum);
      let ng = g * 0.98 + 0.02 * lum;
      const nb = b * 0.88 + 0.03 * (1 - lum);
      nr += 0.05 * (1 - lum);
      ng += 0.03 * (1 - lum);
      return [clamp01(nr), clamp01(ng), clamp01(nb)];
    }
    case 'gothic_dust': {
      const lum = r * 0.299 + g * 0.587 + b * 0.114;
      const nr = r * 0.96 + 0.03 * lum;
      let ng = g * 0.94 + 0.04 * (1 - lum);
      const nb = b * 0.92 + 0.02 * lum;
      ng += 0.03 * (1 - lum);
      return [clamp01(nr), clamp01(ng), clamp01(nb)];
    }
    case 'cyber_noir': {
      // Restrained orange-teal: push shadows toward teal, lift highlights toward warm amber.
      // Keeps skin/amber neon believable; avoids the candy cyan look.
      const lum = r * 0.299 + g * 0.587 + b * 0.114;
      const shadow = 1 - lum;       // 1 in darks, 0 in lights
      const highlight = lum;        // 0 in darks, 1 in lights
      // Teal into the shadows (cool the darks without crushing them).
      let nr = r - 0.05 * shadow;
      let ng = g + 0.02 * shadow;
      let nb = b + 0.07 * shadow;
      // Warm amber into the highlights (lift lights toward amber, keep saturation restrained).
      nr += 0.05 * highlight;
      ng += 0.01 * highlight;
      nb -= 0.04 * highlight;
      // Gentle contrast/saturation nudge so the grade reads as authored, not flat.
      const sat = 1.08;
      nr = lum + (nr - lum) * sat;
      ng = lum + (ng - lum) * sat;
      nb = lum + (nb - lum) * sat;
      return [clamp01(nr), clamp01(ng), clamp01(nb)];
    }
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

/** Procedural 16³ LUT for post-FX color grade (cached per kind). */
export function createProceduralLut3DTexture(kind: ProceduralLutKind): THREE.Data3DTexture {
  const data = new Uint8Array(LUT_SIZE * LUT_SIZE * LUT_SIZE * 4);

  for (let z = 0; z < LUT_SIZE; z++) {
    for (let y = 0; y < LUT_SIZE; y++) {
      for (let x = 0; x < LUT_SIZE; x++) {
        const ir = x / (LUT_SIZE - 1);
        const ig = y / (LUT_SIZE - 1);
        const ib = z / (LUT_SIZE - 1);
        const [nr, ng, nb] = applyLutTransform(ir, ig, ib, kind);
        const i = (x + y * LUT_SIZE + z * LUT_SIZE * LUT_SIZE) * 4;
        data[i] = Math.round(nr * 255);
        data[i + 1] = Math.round(ng * 255);
        data[i + 2] = Math.round(nb * 255);
        data[i + 3] = 255;
      }
    }
  }

  const tex = new THREE.Data3DTexture(data, LUT_SIZE, LUT_SIZE, LUT_SIZE);
  tex.format = THREE.RGBAFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.wrapR = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

const lutCache = new Map<ProceduralLutKind, THREE.Data3DTexture>();

export function getCachedProceduralLut3DTexture(kind: ProceduralLutKind): THREE.Data3DTexture {
  const cached = lutCache.get(kind);
  if (cached) return cached;
  const tex = createProceduralLut3DTexture(kind);
  lutCache.set(kind, tex);
  return tex;
}

/** Test helper — dispose cached LUT textures. */
export function disposeProceduralLutCache(): void {
  for (const tex of lutCache.values()) {
    tex.dispose();
  }
  lutCache.clear();
}
