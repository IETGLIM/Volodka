import type { QualityPresetId } from './qualityPresets';

export type HeavyGfxFeature = 'n8ao' | 'reflector' | 'galaxySky' | 'godRays';

export interface HeavyGfxFeatureOptions {
  /** Touch / coarse-pointer devices — caps ultra-tier overdraw features. */
  coarsePointer?: boolean;
}

/**
 * Ultra-tier GPU features require an explicit preset — auto never enables them
 * even when heuristics resolve to high/ultra (post-deploy perf audit P1).
 */
export function allowsHeavyGfxFeature(
  selectedPreset: QualityPresetId,
  feature: HeavyGfxFeature,
  options?: HeavyGfxFeatureOptions,
): boolean {
  if (selectedPreset === 'auto') return false;

  if (options?.coarsePointer && selectedPreset === 'ultra') {
    if (feature === 'reflector' || feature === 'godRays') return false;
  }

  switch (feature) {
    case 'n8ao':
      return selectedPreset === 'high' || selectedPreset === 'ultra';
    case 'reflector':
      return selectedPreset === 'ultra';
    case 'galaxySky':
      return selectedPreset === 'high' || selectedPreset === 'ultra';
    case 'godRays':
      return selectedPreset === 'high' || selectedPreset === 'ultra';
    default: {
      const _exhaustive: never = feature;
      return _exhaustive;
    }
  }
}
