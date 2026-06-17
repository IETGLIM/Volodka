import type { QualityPresetId } from './qualityPresets';

type ConcreteQualityPresetId = Exclude<QualityPresetId, 'auto'>;

/** Runtime tier cap when user selected `auto` — session only, not localStorage. */
let sessionAutoResolvedTier: ConcreteQualityPresetId | null = null;

export function getSessionAutoResolvedTier(): ConcreteQualityPresetId | null {
  return sessionAutoResolvedTier;
}

export function setSessionAutoResolvedTier(tier: ConcreteQualityPresetId): void {
  sessionAutoResolvedTier = tier;
}

export function clearSessionAutoResolvedTier(): void {
  sessionAutoResolvedTier = null;
}
