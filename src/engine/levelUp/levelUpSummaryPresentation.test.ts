import { describe, expect, it } from 'vitest';
import {
  computeStatChanges,
  getUnlockMessagesInRange,
  hasLevelUpSnapshot,
  toLevelUpSummaryData,
} from '@/engine/levelUp/levelUpSummaryPresentation';
import { DEFAULT_SKILLS } from '@/data/constants';

describe('levelUpSummaryPresentation', () => {
  it('detects complete level-up snapshots', () => {
    expect(hasLevelUpSnapshot({
      newLevel: 6,
      prevLevel: 5,
      prevSkillPoints: 2,
      prevPerkPoints: 1,
      prevXp: 50,
      prevSkills: DEFAULT_SKILLS,
      prevKarma: 0,
    })).toBe(true);

    expect(hasLevelUpSnapshot({ newLevel: 6, prevLevel: 5 })).toBe(false);
  });

  it('computes stat changes from snapshot', () => {
    const changes = computeStatChanges(
      { ...DEFAULT_SKILLS, logic: 1 },
      { ...DEFAULT_SKILLS, logic: 3, coding: 2 },
    );
    expect(changes).toHaveLength(2);
    expect(changes[0]?.delta).toBe(2);
  });

  it('returns default unlock message when no mapped unlock exists', () => {
    const messages = getUnlockMessagesInRange(15, 16);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('Продолжайте развивать');
  });

  it('rejects incomplete payloads', () => {
    expect(toLevelUpSummaryData({ newLevel: 2, prevLevel: 1 }, 'x')).toBeNull();
  });
});
