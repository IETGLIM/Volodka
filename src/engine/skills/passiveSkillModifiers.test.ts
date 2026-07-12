import { describe, expect, it } from 'vitest';
import {
  getPassiveSkillModifiers,
  scaleNpcRelationDelta,
  scalePoemPowerDurationMs,
  scalePoemPowerSkillDelta,
} from '@/engine/skills/passiveSkillModifiers';

describe('passiveSkillModifiers', () => {
  const techT5 = ['tech_t5_ultimate'] as const;
  const socialT5 = ['social_t5_ultimate'] as const;
  const spiritT5 = ['spirit_t5_ultimate'] as const;

  it('doubles poem skill boosts when tech_t5 is unlocked and coding is high enough', () => {
    expect(
      scalePoemPowerSkillDelta(3, [...techT5], { passive_poem_in_code_double: true }, 5),
    ).toBe(6);
    expect(scalePoemPowerSkillDelta(3, [...techT5], {}, 4)).toBe(3);
  });

  it('boosts positive NPC relation deltas by 50% for social_t5', () => {
    expect(scaleNpcRelationDelta(10, [...socialT5], { passive_npc_relation_rate: true })).toBe(15);
    expect(scaleNpcRelationDelta(-10, [...socialT5], { passive_npc_relation_rate: true })).toBe(-10);
  });

  it('doubles poem TTL duration for spirit_t5', () => {
    expect(
      scalePoemPowerDurationMs(30_000, [...spiritT5], { passive_poem_power_duration: true }),
    ).toBe(60_000);
  });

  it('aggregates all tier-5 modifiers from unlocked skill ids', () => {
    const mods = getPassiveSkillModifiers({
      unlockedSkills: [...techT5, ...socialT5, ...spiritT5],
      codingSkill: 6,
    });
    expect(mods.poemInCodeStrengthMultiplier).toBe(2);
    expect(mods.npcRelationGainMultiplier).toBe(1.5);
    expect(mods.poemPowerDurationMultiplier).toBe(2);
  });
});
