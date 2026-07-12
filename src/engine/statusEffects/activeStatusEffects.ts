import { STATUS_EFFECTS, type StatusEffectType } from '@/data/statusEffects';
import type { WeatherType } from '@/data/weatherEffects';

export interface ActiveStatusEffect {
  id: StatusEffectType;
  remainingHours?: number;
  stacks?: number;
}

export const WEATHER_EFFECT_MAP: Record<string, StatusEffectType> = {
  rain: 'rain_debuff',
  snow: 'snow_debuff',
  fog: 'fog_debuff',
  storm: 'storm_debuff',
};

export const PERK_EFFECT_MAP: Record<string, StatusEffectType> = {
  night_watch: 'night_vision',
  iron_stomach: 'iron_stomach',
  counterattack: 'counter_strike',
  poetic_trance: 'poetic_trance',
};

const STATUS_EFFECT_CATEGORY_ORDER: Record<string, number> = {
  perk: 0,
  buff: 1,
  weather: 2,
  debuff: 3,
};

export type BuildActiveStatusEffectsInput = {
  currentWeather: WeatherType;
  unlockedPerks: readonly string[];
  energy: number;
  stress: number;
};

/** Derives HUD / stats panel status effect rows from world and vitals state. */
export function buildActiveStatusEffects(input: BuildActiveStatusEffectsInput): ActiveStatusEffect[] {
  const effects: ActiveStatusEffect[] = [];

  if (input.currentWeather !== 'clear') {
    const weatherEffectId = WEATHER_EFFECT_MAP[input.currentWeather];
    if (weatherEffectId) effects.push({ id: weatherEffectId });
  }

  for (const perkId of input.unlockedPerks) {
    const effectId = PERK_EFFECT_MAP[perkId];
    if (effectId) effects.push({ id: effectId });
  }

  if (input.energy < 25) {
    effects.push({ id: 'exhausted', stacks: input.energy < 10 ? 2 : 1 });
  }
  if (input.stress > 70) {
    effects.push({
      id: 'stressed',
      stacks: input.stress > 90 ? 3 : input.stress > 80 ? 2 : 1,
    });
  }

  effects.sort((a, b) => {
    const defA = STATUS_EFFECTS[a.id];
    const defB = STATUS_EFFECTS[b.id];
    const orderA = STATUS_EFFECT_CATEGORY_ORDER[defA.category] ?? 99;
    const orderB = STATUS_EFFECT_CATEGORY_ORDER[defB.category] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.id.localeCompare(b.id);
  });

  return effects;
}
