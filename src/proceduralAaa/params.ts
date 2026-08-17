/**
 * Tunable params for the procedural AAA pipeline (Unity Inspector → React tweak panel).
 * Subscribe via onProceduralAaaParamsChange / getProceduralAaaParams.
 */

import { isSoftWorkAffordable } from '@/engine/graphics/softWorkBudget';

export type TextureResolutionTier = 512 | 1024 | 2048;

export interface ProceduralAaaParams {
  seed: number;
  /** SDF marching resolution (cells per axis). High ≥52; Ultra 56–60 soft boost. */
  sdfResolution: number;
  sdfSmoothK: number;
  terrainAmp: number;
  buildingDensity: number;
  rockDensity: number;
  ruinDensity: number;
  perlinDisplace: number;
  textureSize: TextureResolutionTier;
  parallaxLayers: number;
  parallaxScale: number;
  anisotropyStrength: number;
  wearAmount: number;
  dirtAmount: number;
  rainWash: number;
  skinScatter: number;
  walkSpeed: number;
  ikStepHeight: number;
  fogDensity: number;
  fogHeightFalloff: number;
  volumetricRays: number;
  autoLutStrength: number;
  audioGain: number;
  spectrumFlicker: number;
  characterScale: number;
  enabled: boolean;
}

export const DEFAULT_PROCEDURAL_AAA_PARAMS: ProceduralAaaParams = {
  seed: 4729,
  sdfResolution: 48,
  /** Lower K → sharper architecture (hardMin used for buildings; soft only on rocks). */
  sdfSmoothK: 0.55,
  terrainAmp: 1.65,
  buildingDensity: 0.78,
  rockDensity: 0.48,
  ruinDensity: 0.55,
  perlinDisplace: 0.12,
  textureSize: 1024,
  parallaxLayers: 16,
  parallaxScale: 0.055,
  anisotropyStrength: 0.72,
  wearAmount: 0.68,
  dirtAmount: 0.58,
  rainWash: 0.48,
  skinScatter: 0.48,
  walkSpeed: 1.28,
  ikStepHeight: 0.1,
  fogDensity: 0.028,
  fogHeightFalloff: 0.35,
  volumetricRays: 0.45,
  autoLutStrength: 0.55,
  audioGain: 0.35,
  spectrumFlicker: 0.6,
  characterScale: 1,
  enabled: false,
};

let params: ProceduralAaaParams = { ...DEFAULT_PROCEDURAL_AAA_PARAMS };
const listeners = new Set<(p: ProceduralAaaParams) => void>();

export function getProceduralAaaParams(): ProceduralAaaParams {
  return params;
}

export function setProceduralAaaParams(patch: Partial<ProceduralAaaParams>): ProceduralAaaParams {
  params = { ...params, ...patch };
  for (const l of listeners) l(params);
  return params;
}

export function resetProceduralAaaParams(): ProceduralAaaParams {
  params = { ...DEFAULT_PROCEDURAL_AAA_PARAMS };
  for (const l of listeners) l(params);
  return params;
}

export function onProceduralAaaParamsChange(
  fn: (p: ProceduralAaaParams) => void,
): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

const STORAGE_KEY = 'volodka.proceduralAaa.enabled';

/** URL ?proceduralAaa=1 | localStorage | params.enabled */
export function isProceduralAaaFlagActive(): boolean {
  if (typeof window === 'undefined') return params.enabled;
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get('proceduralAaa') === '1' || q.get('procedural_aaa') === '1') return true;
    if (window.localStorage.getItem(STORAGE_KEY) === '1') return true;
  } catch {
    /* ignore */
  }
  return params.enabled;
}

export function setProceduralAaaFlag(enabled: boolean): void {
  setProceduralAaaParams({ enabled });
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
    }
  } catch {
    /* ignore */
  }
}

/**
 * Estimate framebuffer pixel count for Ultra 2K affordability.
 * Mid-high desktop ~1080p–1440p @ 1–1.5 DPR stays under ~3.1M.
 */
export function estimateFramebufferPixelCount(): number {
  if (typeof window === 'undefined') return 2_073_600;
  try {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return Math.round(window.innerWidth * window.innerHeight * dpr * dpr);
  } catch {
    return 2_073_600;
  }
}

/**
 * Texture size: High stays 1024 (strong). Ultra defaults 1024 for 60fps;
 * 2048 only when framebuffer is affordable (≤ ~2.5M pixels) or override forces it
 * under the same affordability gate.
 */
export function resolveTextureSizeForQuality(
  presetId: string,
  override?: TextureResolutionTier,
  options?: { pixelCount?: number },
): TextureResolutionTier {
  if (presetId === 'low') return 512;
  if (presetId === 'ultra') {
    const pixels = options?.pixelCount ?? estimateFramebufferPixelCount();
    const can2k = pixels > 0 && pixels <= 2_500_000;
    if (override === 2048) return can2k ? 2048 : 1024;
    return override ?? 1024;
  }
  return override ?? 1024;
}

/**
 * SDF resolution: High ≥52. Ultra soft-boosts to 56–60 (never force ≥72 — Session 7 Ultra fail).
 */
export function resolveSdfResolutionForQuality(
  presetId: string,
  baseResolution: number,
): number {
  if (presetId === 'ultra') return Math.min(Math.max(baseResolution, 56), 60);
  if (presetId === 'high') return Math.max(baseResolution, 52);
  if (presetId === 'low') return Math.min(baseResolution, 32);
  return baseResolution;
}

/**
 * Parallax layers: High/Ultra share a 16-step cap (was Ultra≥24 — fill-rate spike).
 */
export function resolveParallaxLayersForQuality(
  presetId: string,
  base: number,
): number {
  if (presetId === 'ultra' || presetId === 'high') {
    return Math.min(Math.max(base, 12), 16);
  }
  if (presetId === 'low') return Math.min(base, 8);
  return Math.min(base, 12);
}

/**
 * Soft GPU work under quality budget — Ultra is proactive-light by default
 * (Session 8 60fps): fewer rays / softer dirt fill even on mid-res frames.
 * Heavy FB or FPS pressure tightens further.
 */
export function resolveSoftWorkForQuality(
  presetId: string,
  params: Pick<ProceduralAaaParams, 'volumetricRays' | 'dirtAmount' | 'rainWash'>,
  options?: { pixelCount?: number; forceSkip?: boolean },
): { volumetricRays: number; dirtAmount: number; rainWash: number; skipSoftVolumetrics: boolean } {
  const pixels = options?.pixelCount ?? estimateFramebufferPixelCount();
  const fpsPressure = !isSoftWorkAffordable();
  const heavyFb = presetId === 'ultra' && pixels > 2_500_000;
  const heavy = options?.forceSkip === true || fpsPressure || heavyFb;

  if (presetId === 'ultra') {
    // Proactive Ultra trim — still looks strong; avoids Session-7 fill-rate spike
    const baseRays = Math.min(params.volumetricRays, heavy ? 0.18 : 0.28);
    return {
      volumetricRays: baseRays,
      dirtAmount: Math.min(params.dirtAmount, heavy ? 0.35 : 0.48),
      rainWash: Math.min(params.rainWash, heavy ? 0.28 : 0.38),
      skipSoftVolumetrics: heavy || baseRays < 0.2,
    };
  }

  if (!heavy) {
    return {
      volumetricRays: params.volumetricRays,
      dirtAmount: params.dirtAmount,
      rainWash: params.rainWash,
      skipSoftVolumetrics: false,
    };
  }
  return {
    volumetricRays: Math.min(params.volumetricRays, 0.22),
    dirtAmount: Math.min(params.dirtAmount, 0.4),
    rainWash: Math.min(params.rainWash, 0.32),
    skipSoftVolumetrics: true,
  };
}
