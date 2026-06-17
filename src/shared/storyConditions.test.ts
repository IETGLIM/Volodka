import { describe, expect, it } from 'vitest';
import { ttlNow } from '@/shared/ttlClock';
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
  const ctx = {
    ...buildStoryConditionContext({
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
  }),
    collectedPoems: [] as string[],
  };

  it('passes minKarma', () => {
    expect(checkStoryCondition({ minKarma: 50 }, ctx).pass).toBe(true);
    expect(checkStoryCondition({ minKarma: 70 }, ctx).pass).toBe(false);
  });

  it('passes flag', () => {
    expect(checkStoryCondition({ flag: 'met_boss' }, ctx).pass).toBe(true);
    expect(checkStoryCondition({ flag: 'missing' }, ctx).pass).toBe(false);
  });

  it('gates poem collection choices', () => {
    const poemCtx = { ...ctx, collectedPoems: ['poem_2'] as const };
    expect(checkStoryCondition({ missingPoem: 'poem_2' }, poemCtx).pass).toBe(false);
    expect(checkStoryCondition({ collectedPoem: 'poem_2' }, poemCtx).pass).toBe(true);
    expect(checkStoryCondition({ missingPoem: 'poem_2' }, ctx).pass).toBe(true);
  });

  it('gates inventory item choices', () => {
    const withWine = { ...ctx, ownedItemIdsKey: 'port_wine_777' };
    expect(checkStoryCondition({ hasItem: 'port_wine_777' }, withWine).pass).toBe(true);
    expect(checkStoryCondition({ hasItem: 'port_wine_777' }, ctx).pass).toBe(false);
  });

  it('gates minCollectedPoems', () => {
    const threePoems = { ...ctx, collectedPoems: ['a', 'b', 'c'] as const };
    expect(checkStoryCondition({ minCollectedPoems: 3 }, threePoems).pass).toBe(true);
    expect(checkStoryCondition({ minCollectedPoems: 4 }, threePoems).pass).toBe(false);
  });

  it('gates missingFlag', () => {
    const flagged = { ...ctx, flags: { done: true } };
    expect(checkStoryCondition({ missingFlag: 'done' }, ctx).pass).toBe(true);
    expect(checkStoryCondition({ missingFlag: 'done' }, flagged).pass).toBe(false);
  });

  it('gates activeTTLFlag by expiry', () => {
    const now = ttlNow();
    const liveCtx = {
      ...ctx,
      activeTTLFlags: {
        truth_voice_active: {
          key: 'truth_voice_active',
          poemId: 'poem_1',
          expiryTimestamp: now + 30_000,
        },
      },
    };
    const expiredCtx = {
      ...ctx,
      activeTTLFlags: {
        truth_voice_active: {
          key: 'truth_voice_active',
          poemId: 'poem_1',
          expiryTimestamp: now - 1,
        },
      },
    };
    expect(checkStoryCondition({ activeTTLFlag: 'truth_voice_active' }, liveCtx).pass).toBe(true);
    expect(checkStoryCondition({ activeTTLFlag: 'truth_voice_active' }, expiredCtx).pass).toBe(false);
  });
});
