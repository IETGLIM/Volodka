import { describe, expect, it } from 'vitest';
import { buildStoryConditionContext, checkStoryCondition } from '@/shared/storyConditions';

describe('buildStoryConditionContext', () => {
  it('uses progression act by default', () => {
    const ctx = buildStoryConditionContext({
      karma: 50,
      skills: {
        logic: 5,
        coding: 5,
        empathy: 5,
        persuasion: 5,
        intuition: 5,
        writing: 5,
        rhythm: 5,
      },
      flags: {},
      progression: {
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        skillPoints: 0,
        unlockedSkills: [],
        currentAct: 3,
        perkPoints: 0,
        unlockedPerks: [],
      },
    });
    expect(ctx.currentAct).toBe(3);
  });
});

describe('checkStoryCondition', () => {
  const ctx = buildStoryConditionContext({
    karma: 60,
    skills: {
      logic: 8,
      coding: 5,
      empathy: 5,
      persuasion: 5,
      intuition: 5,
      writing: 5,
      rhythm: 5,
    },
    flags: { met_boss: true },
    progression: {
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      skillPoints: 0,
      unlockedSkills: [],
      currentAct: 2,
      perkPoints: 0,
      unlockedPerks: [],
    },
  });

  it('passes minKarma', () => {
    expect(checkStoryCondition({ minKarma: 50 }, ctx).pass).toBe(true);
    expect(checkStoryCondition({ minKarma: 70 }, ctx).pass).toBe(false);
  });

  it('passes flag', () => {
    expect(checkStoryCondition({ flag: 'met_boss' }, ctx).pass).toBe(true);
    expect(checkStoryCondition({ flag: 'missing' }, ctx).pass).toBe(false);
  });
});
