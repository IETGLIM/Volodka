import type { QualityPresetId } from './qualityPresets';

type ConcreteQualityPresetId = Exclude<QualityPresetId, 'auto'>;

/**
 * Session-only adaptive quality caps.
 * Must NOT persist to localStorage — permanent degrade violates AAA criteria
 * (“adaptive quality must not permanently gut the look”).
 */

/** When user selected `auto`, runtime concrete tier (session memory only). */
let sessionAutoResolvedTier: ConcreteQualityPresetId | null = null;

/**
 * When user selected a concrete preset (high/ultra/…), FPS adaptive may force
 * a lower tier for this tab session without rewriting their saved preference.
 */
let sessionForcedPreset: ConcreteQualityPresetId | null = null;

export function getSessionAutoResolvedTier(): ConcreteQualityPresetId | null {
  return sessionAutoResolvedTier;
}

export function setSessionAutoResolvedTier(tier: ConcreteQualityPresetId): void {
  sessionAutoResolvedTier = tier;
}

export function clearSessionAutoResolvedTier(): void {
  sessionAutoResolvedTier = null;
}

export function getSessionForcedPreset(): ConcreteQualityPresetId | null {
  return sessionForcedPreset;
}

export function setSessionForcedPreset(tier: ConcreteQualityPresetId): void {
  sessionForcedPreset = tier;
}

export function clearSessionForcedPreset(): void {
  sessionForcedPreset = null;
}

/** Clear all session adaptive overrides (manual preset pick / new game). */
export function clearAllSessionQualityOverrides(): void {
  sessionAutoResolvedTier = null;
  sessionForcedPreset = null;
}
