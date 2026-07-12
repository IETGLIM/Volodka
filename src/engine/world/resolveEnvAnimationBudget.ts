import { getSceneVisualProfile, isHeroScene } from '@/config/sceneVisualProfiles';
import { tierFromPresetId } from '@/engine/graphics/fxGovernor';
import type { EnvAnimation } from '@/engine/EnvironmentalAnimations';
import type { SceneId } from '@/shared/types/game';

const TIER_LIMITS: Record<'low' | 'medium' | 'high', number> = {
  low: 2,
  medium: 4,
  high: 999,
};

/** Trim environmental animations on low/medium non-hero scenes; hero keeps full set. */
export function resolveEnvAnimationsForTier(
  sceneId: SceneId,
  animations: EnvAnimation[],
  presetId: string,
): EnvAnimation[] {
  if (animations.length === 0) return [];

  const profile = getSceneVisualProfile(sceneId);
  if (isHeroScene(sceneId) && profile.envAnimationKeepAll) {
    return animations;
  }

  const tier = tierFromPresetId(presetId);
  const limit = TIER_LIMITS[tier];
  return animations.slice(0, limit);
}
