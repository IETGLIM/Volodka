import type { ActiveTTLFlagMap } from '@/shared/activeTTLFlags';
import { isActiveTTLFlagLive } from '@/shared/activeTTLFlags';
import {
  POEM_WORLD_CATEGORIES,
  POEM_WORLD_FALLBACK_CATEGORY,
  type PoemWorldCategory,
} from '@/config/poemWorldEffects';

export interface PoemPostFxBoost {
  bloomIntensity: number;
  vignetteDarkness: number;
}

const CATEGORY_BOOST: Record<PoemWorldCategory, PoemPostFxBoost> = {
  dialogue: { bloomIntensity: 0.14, vignetteDarkness: 0.07 },
  exploration: { bloomIntensity: 0.2, vignetteDarkness: 0.04 },
  combat: { bloomIntensity: 0.1, vignetteDarkness: 0.09 },
  defense: { bloomIntensity: 0.08, vignetteDarkness: 0.06 },
  social: { bloomIntensity: 0.1, vignetteDarkness: 0.05 },
  utility: { bloomIntensity: 0.12, vignetteDarkness: 0.05 },
};

const REDUCED_MOTION_SCALE = 0.35;

/** Sum category boosts from live poem TTL flags — cheap PostFX layer, no mesh shaders. */
export function resolvePoemTTLPostFxBoost(
  activeTTLFlags: ActiveTTLFlagMap | undefined,
  reducedMotion: boolean,
  now: number = Date.now(),
): PoemPostFxBoost {
  const totals = { bloomIntensity: 0, vignetteDarkness: 0 };

  if (!activeTTLFlags) return totals;

  for (const flag of Object.values(activeTTLFlags)) {
    if (!isActiveTTLFlagLive(activeTTLFlags, flag.key, now)) continue;
    const category = POEM_WORLD_CATEGORIES[flag.poemId] ?? POEM_WORLD_FALLBACK_CATEGORY;
    const boost = CATEGORY_BOOST[category];
    totals.bloomIntensity = Math.max(totals.bloomIntensity, boost.bloomIntensity);
    totals.vignetteDarkness = Math.max(totals.vignetteDarkness, boost.vignetteDarkness);
  }

  if (reducedMotion) {
    return {
      bloomIntensity: totals.bloomIntensity * REDUCED_MOTION_SCALE,
      vignetteDarkness: totals.vignetteDarkness * REDUCED_MOTION_SCALE,
    };
  }

  return totals;
}
