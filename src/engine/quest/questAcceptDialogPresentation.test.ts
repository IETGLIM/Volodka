import { describe, expect, it } from 'vitest';
import {
  buildRewardLabel,
  getDifficultyDiamondCount,
  getQuestTypeLabel,
  isMainQuest,
} from '@/engine/quest/questAcceptDialogPresentation';

describe('questAcceptDialogPresentation', () => {
  it('maps quest type labels and difficulty', () => {
    expect(getQuestTypeLabel('main')).toBe('ОСНОВНОЕ');
    expect(getDifficultyDiamondCount('easy')).toBe(1);
    expect(getDifficultyDiamondCount('hard')).toBe(3);
  });

  it('builds reward labels', () => {
    expect(buildRewardLabel({ type: 'addKarma', value: 5 })).toBe('Карма +5');
    expect(buildRewardLabel({ type: 'addXp', value: 10 })).toBe('Опыт +10');
  });

  it('detects main quests', () => {
    expect(
      isMainQuest({
        id: 'q',
        title: 'T',
        description: 'D',
        questType: 'main',
        objectives: [],
      }),
    ).toBe(true);
  });
});
