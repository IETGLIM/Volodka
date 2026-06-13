/**
 * Limits simultaneous heavy atmospheric FX (rain + fog + god rays) by quality tier.
 */

export type FxTier = 'low' | 'medium' | 'high';

export interface FxBudget {
  maxHeavyFx: number;
  allowRain: boolean;
  allowFog: boolean;
  allowGodRays: boolean;
}

const FX_BUDGET: Record<FxTier, FxBudget> = {
  low: { maxHeavyFx: 1, allowRain: true, allowFog: false, allowGodRays: false },
  medium: { maxHeavyFx: 2, allowRain: true, allowFog: true, allowGodRays: true },
  high: { maxHeavyFx: 3, allowRain: true, allowFog: true, allowGodRays: true },
};

export function getFxBudget(tier: FxTier): FxBudget {
  return FX_BUDGET[tier];
}

export function canEnableHeavyFx(
  budget: FxBudget,
  activeHeavyCount: number,
): boolean {
  return activeHeavyCount < budget.maxHeavyFx;
}
