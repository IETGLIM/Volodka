import type { QualityPresetId } from './qualityPresets';

type ConcreteQualityPresetId = Exclude<QualityPresetId, 'auto'>;

const AUTO_QUALITY_SESSION_TIER_KEY = 'volodka_auto_quality_session_tier';

const VALID_TIERS = new Set<ConcreteQualityPresetId>(['low', 'medium', 'high', 'ultra']);

/** Runtime tier cap when user selected `auto` — persisted across sessions. */
let sessionAutoResolvedTier: ConcreteQualityPresetId | null = readPersistedAutoTier();

function readPersistedAutoTier(): ConcreteQualityPresetId | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTO_QUALITY_SESSION_TIER_KEY);
  if (raw && VALID_TIERS.has(raw as ConcreteQualityPresetId)) {
    return raw as ConcreteQualityPresetId;
  }
  return null;
}

function writePersistedAutoTier(tier: ConcreteQualityPresetId | null): void {
  if (typeof window === 'undefined') return;
  if (tier === null) {
    localStorage.removeItem(AUTO_QUALITY_SESSION_TIER_KEY);
    return;
  }
  localStorage.setItem(AUTO_QUALITY_SESSION_TIER_KEY, tier);
}

export function getSessionAutoResolvedTier(): ConcreteQualityPresetId | null {
  return sessionAutoResolvedTier;
}

export function setSessionAutoResolvedTier(tier: ConcreteQualityPresetId): void {
  sessionAutoResolvedTier = tier;
  writePersistedAutoTier(tier);
}

export function clearSessionAutoResolvedTier(): void {
  sessionAutoResolvedTier = null;
  writePersistedAutoTier(null);
}
