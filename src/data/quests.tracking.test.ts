import { describe, expect, it } from 'vitest';
import { getNextTrackedObjective, isObjectiveSatisfied, checkQuestAvailability, QUEST_DEFINITIONS } from './quests';
import type { ExtendedQuest, QuestObjective } from './types';

const q = (objectives: QuestObjective[]): ExtendedQuest => ({
  id: 't',
  title: 'T',
  description: 'T',
  type: 'side',
  status: 'active',
  objectives,
  reward: {},
});

describe('isObjectiveSatisfied', () => {
  it('respects targetValue', () => {
    const o: QuestObjective = {
      id: 'a',
      text: '',
      completed: false,
      targetValue: 3,
    };
    expect(isObjectiveSatisfied(o, 0)).toBe(false);
    expect(isObjectiveSatisfied(o, 3)).toBe(true);
  });

  it('treats increment-only objectives as done at 1', () => {
    const o: QuestObjective = {
      id: 'b',
      text: '',
      completed: false,
    };
    expect(isObjectiveSatisfied(o, 0)).toBe(false);
    expect(isObjectiveSatisfied(o, 1)).toBe(true);
  });
});

describe('getNextTrackedObjective', () => {
  it('returns first open step in order', () => {
    const quest = q([
      { id: 's1', text: 'one', completed: false, targetValue: 1 },
      { id: 's2', text: 'two', completed: false, targetValue: 1 },
    ]);
    expect(getNextTrackedObjective(quest, {})?.id).toBe('s1');
    expect(getNextTrackedObjective(quest, { s1: 1 })?.id).toBe('s2');
    expect(getNextTrackedObjective(quest, { s1: 1, s2: 1 })).toBeNull();
  });
});

describe('checkQuestAvailability', () => {
  it('first_reading unlocks after prerequisite without impossible triple flags', () => {
    const q = QUEST_DEFINITIONS.first_reading;
    expect(
      checkQuestAvailability(q, ['first_words'], {}),
    ).toBe(true);
    expect(checkQuestAvailability(q, [], {})).toBe(false);
  });
});
