import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { useGameStore } from './gameStore';
import type { QuestState } from '@/shared/types/game';

vi.mock('@/engine/EventBus', () => ({
  eventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
}));

const TEST_QUEST: QuestState = {
  questId: 'test_quest',
  status: 'active',
  objectives: { obj_a: false, obj_b: false },
  startedAtTime: 12,
};

describe('reduceGameState via dispatchGameAction', () => {
  beforeEach(() => {
    useGameStore.setState({ quests: [] });
  });

  it('completes a quest objective through setState-backed actions', () => {
    useGameStore.setState({ quests: [TEST_QUEST] });

    const listener = vi.fn();
    const unsub = useGameStore.subscribe(listener);

    dispatchGameAction({
      type: 'quest/completeObjective',
      questId: 'test_quest',
      objectiveId: 'obj_a',
    });

    const quest = useGameStore.getState().quests.find((q) => q.questId === 'test_quest');
    expect(quest?.objectives.obj_a).toBe(true);
    expect(quest?.objectives.obj_b).toBe(false);
    expect(listener).toHaveBeenCalled();
    unsub();
  });

  it('fails a quest and notifies store subscribers', () => {
    useGameStore.setState({
      quests: [
        {
          questId: 'fail_me',
          status: 'active',
          objectives: { step: false },
          startedAtTime: 8,
        },
      ],
    });

    const listener = vi.fn();
    const unsub = useGameStore.subscribe(listener);

    dispatchGameAction({ type: 'quest/fail', questId: 'fail_me' });

    const quest = useGameStore.getState().quests.find((q) => q.questId === 'fail_me');
    expect(quest?.status).toBe('failed');
    expect(listener).toHaveBeenCalled();
    unsub();
  });

  it('routes dispatch through slice store actions', () => {
    useGameStore.setState({ quests: [{ ...TEST_QUEST, objectives: { only: false } }] });

    dispatchGameAction({
      type: 'quest/completeObjective',
      questId: 'test_quest',
      objectiveId: 'only',
    });

    expect(useGameStore.getState().quests[0]?.objectives.only).toBe(true);
  });
});
