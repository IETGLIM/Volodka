import { describe, expect, it } from 'vitest';
import { POEM_COMBAT_ABILITIES } from './actions';
import { ALL_UNIFIED_POEM_IDS } from '@/data/poemCollectionMeta';

describe('poem combat ability coverage', () => {
  it('exposes a combat ability for every registry poem', () => {
    const missing = ALL_UNIFIED_POEM_IDS.filter((id) => !POEM_COMBAT_ABILITIES[id]);
    expect(missing, `missing combat abilities: ${missing.join(', ')}`).toEqual([]);
  });

  it('keeps cooldown and execute for each ability', () => {
    for (const [id, ability] of Object.entries(POEM_COMBAT_ABILITIES)) {
      expect(ability.poemId, id).toBe(id);
      expect(ability.cooldown, id).toBeGreaterThan(0);
      expect(typeof ability.execute, id).toBe('function');
    }
  });
});
