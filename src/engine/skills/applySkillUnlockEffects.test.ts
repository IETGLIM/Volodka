import { describe, expect, it } from 'vitest';
import { resolveSkillUnlockEffects } from '@/engine/skills/applySkillUnlockEffects';
import { PASSIVE_SKILL_EFFECT_MAP } from '@/data/passiveSkillEffects';

describe('resolveSkillUnlockEffects', () => {
  it('applies mapped stat bonus for tier-1 technical node', () => {
    const result = resolveSkillUnlockEffects('tech_t1_coding');
    expect(result.statDeltas).toEqual([{ skill: 'coding', amount: 1 }]);
    expect(result.passiveFlags).toEqual([]);
  });

  it('registers passive flags for tier-5 ultimates', () => {
    for (const skillId of Object.keys(PASSIVE_SKILL_EFFECT_MAP)) {
      const def = PASSIVE_SKILL_EFFECT_MAP[skillId];
      const result = resolveSkillUnlockEffects(skillId);
      expect(result.statDeltas).toEqual([]);
      expect(result.passiveFlags).toEqual([def.flag]);
      expect(def.effect.value).toBeGreaterThan(1);
    }
  });

  it('returns empty result for unknown skill ids', () => {
    const result = resolveSkillUnlockEffects('nonexistent_skill');
    expect(result.statDeltas).toEqual([]);
    expect(result.passiveFlags).toEqual([]);
  });
});
