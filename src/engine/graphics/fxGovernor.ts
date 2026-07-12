/**
 * Limits simultaneous heavy atmospheric FX (rain + fog + god rays) by quality tier.
 */

import { isHeroScene } from '@/config/sceneVisualProfiles';
import type { SceneId } from '@/shared/types/game';

export type FxTier = 'low' | 'medium' | 'high';

export type HeavyFxKind = 'rain' | 'fog' | 'godRays';

export interface FxBudget {
  maxHeavyFx: number;
  allowRain: boolean;
  allowFog: boolean;
  allowGodRays: boolean;
}

export interface HeavyFxEnablement {
  rain: boolean;
  fog: boolean;
  godRays: boolean;
}

const FX_BUDGET: Record<FxTier, FxBudget> = {
  low: { maxHeavyFx: 1, allowRain: true, allowFog: false, allowGodRays: false },
  medium: { maxHeavyFx: 2, allowRain: true, allowFog: true, allowGodRays: true },
  high: { maxHeavyFx: 3, allowRain: true, allowFog: true, allowGodRays: true },
};

/** Priority order when budget is exceeded — weather first, then fog, then god rays. */
const HEAVY_FX_PRIORITY: HeavyFxKind[] = ['rain', 'fog', 'godRays'];

export function getFxBudget(tier: FxTier, sceneId?: string): FxBudget {
  const base = FX_BUDGET[tier];
  if (!sceneId || !isHeroScene(sceneId as SceneId)) return base;
  return {
    ...base,
    maxHeavyFx: Math.min(base.maxHeavyFx + 1, 3),
    allowFog: true,
    allowGodRays: true,
  };
}

export function canEnableHeavyFx(
  budget: FxBudget,
  activeHeavyCount: number,
): boolean {
  return activeHeavyCount < budget.maxHeavyFx;
}

export function tierFromPresetId(presetId: string): FxTier {
  if (presetId === 'low') return 'low';
  if (presetId === 'high' || presetId === 'ultra') return 'high';
  return 'medium';
}

/** Resolve which heavy FX may run simultaneously under tier budget. */
export function resolveHeavyFxEnablement(
  tier: FxTier,
  desired: HeavyFxEnablement,
  sceneId?: string,
): HeavyFxEnablement {
  const budget = getFxBudget(tier, sceneId);
  const allowedByKind: Record<HeavyFxKind, boolean> = {
    rain: budget.allowRain,
    fog: budget.allowFog,
    godRays: budget.allowGodRays,
  };

  const result: HeavyFxEnablement = { rain: false, fog: false, godRays: false };
  let activeCount = 0;

  for (const kind of HEAVY_FX_PRIORITY) {
    if (!desired[kind] || !allowedByKind[kind]) continue;
    if (canEnableHeavyFx(budget, activeCount)) {
      result[kind] = true;
      activeCount++;
    }
  }

  return result;
}

/** Scene weather types that activate GPU rain/snow (snow is not a heavy FX slot). */
export function sceneWantsRain(
  sceneId: string,
  weatherEnabled: boolean,
): boolean {
  if (!weatherEnabled) return false;
  return (
    sceneId === 'street_night' ||
    sceneId === 'rooftop_edge'
  );
}

/** Resolve rain + fog + god rays together for a scene. */
export function resolveSceneHeavyFx(
  tier: FxTier,
  sceneId: string,
  options: {
    weatherEnabled: boolean;
    wantsFog: boolean;
    wantsGodRays: boolean;
  },
): HeavyFxEnablement {
  return resolveHeavyFxEnablement(tier, {
    rain: sceneWantsRain(sceneId, options.weatherEnabled),
    fog: options.wantsFog,
    godRays: options.wantsGodRays,
  }, sceneId);
}
