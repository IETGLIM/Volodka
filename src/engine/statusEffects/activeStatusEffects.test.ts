import { describe, expect, it } from 'vitest';
import { buildActiveStatusEffects } from '@/engine/statusEffects/activeStatusEffects';

describe('buildActiveStatusEffects', () => {
  it('includes weather, perk, and vitals debuffs', () => {
    const effects = buildActiveStatusEffects({
      currentWeather: 'rain',
      unlockedPerks: ['night_watch'],
      energy: 5,
      stress: 95,
    });

    expect(effects.map((e) => e.id)).toEqual([
      'night_vision',
      'rain_debuff',
      'exhausted',
      'stressed',
    ]);
    expect(effects.find((e) => e.id === 'exhausted')?.stacks).toBe(2);
    expect(effects.find((e) => e.id === 'stressed')?.stacks).toBe(3);
  });

  it('returns empty list when nothing applies', () => {
    expect(
      buildActiveStatusEffects({
        currentWeather: 'clear',
        unlockedPerks: [],
        energy: 80,
        stress: 20,
      }),
    ).toEqual([]);
  });
});
