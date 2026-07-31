import { getSceneVisualProfile, isHeroScene } from '@/config/sceneVisualProfiles';
import { allowsHeavyGfxFeature } from '@/engine/graphics/qualityFeatureGates';
import type { QualityPreset, QualityPresetId } from '@/engine/graphics/qualityPresets';
import type { SceneId } from '@/shared/types/game';

export interface SceneRenderingPipeline {
  /** Reduced bloom/vignette/grade stack for low-end GPUs. */
  useLitePostFx: boolean;
  /** Screen-space ambient occlusion (N8AO). */
  useAmbientOcclusion: boolean;
  aoIntensity: number;
  aoRadius: number;
  bloomIntensityScale: number;
  shadowMapScale: number;
  isHero: boolean;
}

const DEFAULT_AO_INTENSITY = 2.5;
const DEFAULT_AO_RADIUS = 0.45;
const HERO_AO_INTENSITY = 3.1;
const HERO_AO_RADIUS = 0.55;

/**
 * Resolves post-FX / shadow tier for a scene + quality preset.
 *
 * PostFX policy (single table):
 * | tier / flag                         | useLitePostFx |
 * |-------------------------------------|---------------|
 * | selected/preset `low`               | true (always) |
 * | visualLite + !forceFullPostFx       | true          |
 * | visualLite + forceFullPostFx (hero) | false (full)  |
 * | !visualLite                         | false (full)  |
 *
 * AO still requires high/ultra + profile + `allowsHeavyGfxFeature`.
 */
export function resolveSceneRenderingPipeline(
  sceneId: SceneId,
  preset: QualityPreset,
  visualLite: boolean,
  selectedPreset: QualityPresetId = preset.id,
  coarsePointer = false,
): SceneRenderingPipeline {
  const profile = getSceneVisualProfile(sceneId);
  const isHero = isHeroScene(sceneId);

  const isLowTier = preset.id === 'low' || selectedPreset === 'low';
  const forceFullPostFx = profile.forceFullPostFx && !isLowTier;
  const useLitePostFx = visualLite && !forceFullPostFx;

  const highEnoughForAo =
    preset.id === 'ultra'
    || (preset.id === 'high' && profile.enhancedAmbientOcclusion);

  const useAmbientOcclusion =
    !useLitePostFx
    && highEnoughForAo
    && profile.enhancedAmbientOcclusion
    && allowsHeavyGfxFeature(selectedPreset, 'n8ao', { coarsePointer });

  return {
    useLitePostFx,
    useAmbientOcclusion,
    aoIntensity: profile.aoIntensity ?? (isHero ? HERO_AO_INTENSITY : DEFAULT_AO_INTENSITY),
    aoRadius: profile.aoRadius ?? (isHero ? HERO_AO_RADIUS : DEFAULT_AO_RADIUS),
    bloomIntensityScale: profile.bloomIntensityScale ?? (isHero ? 1.08 : 1),
    shadowMapScale: profile.shadowMapScale ?? (isHero ? 1.25 : 1),
    isHero,
  };
}
