import { describe, expect, it } from 'vitest';
import { GOLDEN_PATH_QUEST_SPINE } from '@/data/goldenPath';
import { resolvePrimaryTrackedQuest } from './primaryQuestSelection';

const goldenPathQuestId = GOLDEN_PATH_QUEST_SPINE[0]!;
const anotherGoldenPathQuestId = GOLDEN_PATH_QUEST_SPINE[1]!;

function quest(questId: string) {
  return { questId, status: 'active' as const };
}

describe('resolvePrimaryTrackedQuest', () => {
  it('keeps the first active golden-path quest ahead of side content', () => {
    const side = quest('optional_side_story');
    const main = quest(goldenPathQuestId);

    expect(resolvePrimaryTrackedQuest([side, main], null)).toBe(main);
  });

  it('respects an explicit player selection while that quest remains active', () => {
    const main = quest(goldenPathQuestId);
    const side = quest('optional_side_story');

    expect(resolvePrimaryTrackedQuest([main, side], side.questId)).toBe(side);
  });

  it('falls back to the main story when a pinned quest is no longer active', () => {
    const main = quest(goldenPathQuestId);
    const anotherMain = quest(anotherGoldenPathQuestId);

    expect(resolvePrimaryTrackedQuest([main, anotherMain], 'completed_side_quest')).toBe(main);
  });

  it('uses the first active quest when no golden-path quest is running', () => {
    const side = quest('optional_side_story');
    const daily = quest('daily_sync');

    expect(resolvePrimaryTrackedQuest([side, daily], null)).toBe(side);
  });

  it('returns null when there are no active quests', () => {
    expect(resolvePrimaryTrackedQuest([], null)).toBeNull();
  });
});
