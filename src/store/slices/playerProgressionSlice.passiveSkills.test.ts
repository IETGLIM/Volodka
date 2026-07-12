import { describe, expect, it, beforeEach, beforeAll } from 'vitest';
import { usePlayerStore } from '@/store/stores/playerStore';
import { createDefaultPlayerState } from '@/store/shared';
import { PASSIVE_SKILL_EFFECT_MAP } from '@/data/passiveSkillEffects';
import { SKILL_TREE_MAP } from '@/data/skillTree';
import { preloadBootGameData } from '@/data/gameDataLoader';

const TIER5_PREREQS: Record<string, string[]> = {
  tech_t5_ultimate: ['tech_t4_coding', 'tech_t4_logic'],
  social_t5_ultimate: ['social_t4_empathy', 'social_t4_persuasion'],
  spirit_t5_ultimate: ['spirit_t4_intuition', 'spirit_t4_writing'],
};

describe('unlockSkillTreeNode tier-5 passives', () => {
  beforeAll(async () => {
    await preloadBootGameData();
  });

  beforeEach(() => {
    usePlayerStore.setState({
      playerState: {
        ...createDefaultPlayerState(),
        progression: {
          ...createDefaultPlayerState().progression,
          skillPoints: 10,
          unlockedSkills: [],
        },
      },
    });
  });

  for (const [skillId, def] of Object.entries(PASSIVE_SKILL_EFFECT_MAP)) {
    it(`sets passive flag for ${skillId}`, () => {
      const prereqs = TIER5_PREREQS[skillId] ?? SKILL_TREE_MAP[skillId]?.requires ?? [];
      usePlayerStore.setState((state) => ({
        playerState: {
          ...state.playerState,
          progression: {
            ...state.playerState.progression,
            unlockedSkills: prereqs,
          },
        },
      }));

      usePlayerStore.getState().unlockSkillTreeNode(skillId);

      const state = usePlayerStore.getState();
      expect(state.playerState.progression.unlockedSkills).toContain(skillId);
      expect(state.playerState.flags[def.flag]).toBe(true);
    });
  }
});
