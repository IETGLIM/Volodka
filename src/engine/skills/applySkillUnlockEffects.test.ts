import { describe, expect, it } from 'vitest';
import { resolveSkillUnlockEffects } from '@/engine/skills/applySkillUnlockEffects';
import { PASSIVE_SKILL_EFFECT_MAP } from '@/data/passiveSkillEffects';

describe('resolveSkillUnlockEffects', () => {
  it('applies mapped stat bonus for tier-1 technical node', () => {
    const result = resolveSkillUnlockEffects('tech_t1_coding', '+1 Взлом');
    expect(result.statDeltas).toEqual([{ skill: 'coding', amount: 1 }]);
    expect(result.passiveFlags).toEqual([]);
    expect(result.unmatchedEffectParts).toEqual([]);
  });

  it('registers passive flags for tier-5 ultimates without parsing Russian text', () => {
    for (const skillId of Object.keys(PASSIVE_SKILL_EFFECT_MAP)) {
      const def = PASSIVE_SKILL_EFFECT_MAP[skillId];
      const result = resolveSkillUnlockEffects(skillId, 'Ультимативный: freeform text');
      expect(result.statDeltas).toEqual([]);
      expect(result.passiveFlags).toEqual([def.flag]);
      expect(result.unmatchedEffectParts).toEqual([]);
      expect(def.effect.value).toBeGreaterThan(1);
    }
  });

  it('parses legacy combat-tree stat strings', () => {
    const result = resolveSkillUnlockEffects('tech_1a', 'coding +2');
    expect(result.statDeltas).toEqual([{ skill: 'coding', amount: 2 }]);
  });

  it('stores percent bonuses as legacy flags instead of dropping them', () => {
    const result = resolveSkillUnlockEffects('spiritual_3b', 'writing +4, stress -20%');
    expect(result.statDeltas).toEqual([{ skill: 'writing', amount: 4 }]);
    expect(result.legacyPercentFlags).toContainEqual({
      key: 'legacy_skill_percent_stress',
      value: -20,
    });
  });

  it('maps legacy combat-tree percent passives by skill id', () => {
    const result = resolveSkillUnlockEffects('tech_5a', 'coding +8, poem power +25%');
    expect(result.legacyPercentFlags).toContainEqual({
      key: 'legacy_poem_power_strength',
      value: 0.25,
    });
  });
});
