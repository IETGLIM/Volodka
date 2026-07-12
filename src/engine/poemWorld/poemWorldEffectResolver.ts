import {
  POEM_WORLD_CATEGORY_DEFAULTS,
  POEM_WORLD_EFFECT_OVERRIDES,
  POEM_WORLD_CATEGORIES,
  POEM_WORLD_FALLBACK_CATEGORY,
  type PoemWorldCategory,
  type PoemWorldEffectProfile,
} from '@/config/poemWorldEffects';
import { resolveSynergyWorldProfile } from '@/engine/poemPower/applyPoemSynergy';

export function inferPoemWorldCategory(poemId: string): PoemWorldCategory {
  const override = POEM_WORLD_EFFECT_OVERRIDES[poemId]?.category;
  if (override) return override;
  return POEM_WORLD_CATEGORIES[poemId] ?? POEM_WORLD_FALLBACK_CATEGORY;
}

/** Resolve full world-event profile: per-poem override layered on category default. */
export function resolvePoemWorldEffect(poemId: string): PoemWorldEffectProfile {
  const category = inferPoemWorldCategory(poemId);
  const base = POEM_WORLD_CATEGORY_DEFAULTS[category];
  const override = POEM_WORLD_EFFECT_OVERRIDES[poemId] ?? {};
  return { ...base, ...override, category };
}

export function resolvePoemWorldHintFlagKey(hint: PoemWorldEffectProfile['worldHint']): string | null {
  if (hint === 'none') return null;
  return `poem_hint_${hint}_active`;
}

/** Layer synergy world overrides on category defaults for combo VFX. */
export function resolvePoemSynergyWorldEffect(synergyId: string): PoemWorldEffectProfile {
  const override = resolveSynergyWorldProfile(synergyId) ?? {};
  const category = override.category ?? POEM_WORLD_FALLBACK_CATEGORY;
  const base = POEM_WORLD_CATEGORY_DEFAULTS[category];
  return { ...base, ...override, category };
}
