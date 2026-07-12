import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatchGameAction } from '@/shared/gameBridge/gameActionBridge';
import { useGameStore } from './gameStore';
import { createDefaultPlayerState } from './shared';
import type { QuestDefinition, QuestState } from '@/shared/types/game';
import {
  computeQuestCreditReward,
  getDefaultQuestXp,
} from '@/shared/utils/questRewards';

const TEST_QUEST_DEF: QuestDefinition = {
  id: 'reward_test_quest',
  title: 'Reward Test',
  description: 'Test',
  questType: 'side',
  objectives: [
    {
      id: 'step',
      description: 'Step',
      type: 'flag_set',
      target: 'done',
      completed: false,
    },
  ],
  rewards: [
    { type: 'addKarma', value: 5 },
    { type: 'addXp', value: 10 },
    { type: 'setFlag', flag: 'quest_reward_flag', flagValue: true },
  ],
};

vi.mock('@/data/gameDataLoader', () => ({
  getQuestDefinitions: vi.fn(() => [TEST_QUEST_DEF]),
  getItemDefinition: vi.fn(),
  createInventoryItem: vi.fn(),
  findNpcById: vi.fn(),
}));

vi.mock('./storeEffects', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./storeEffects')>();
  return {
    ...actual,
    runAfterStoreCommit: (fn: () => void) => fn(),
    scheduleQuestRewardApplied: vi.fn(),
    scheduleQuestCompleted: vi.fn(),
  };
});

const ACTIVE_QUEST: QuestState = {
  questId: 'reward_test_quest',
  status: 'active',
  objectives: { step: true },
  startedAtTime: 12,
};

describe('quest completion reward invariant', () => {
  beforeEach(() => {
    useGameStore.setState({
      playerState: createDefaultPlayerState(),
      quests: [ACTIVE_QUEST],
    });
  });

  it('quest/complete grants XP, karma, credits, and flags from quest definition', () => {
    const initialKarma = useGameStore.getState().playerState.karma;
    const initialXp = useGameStore.getState().playerState.progression.xp;
    const initialCredits = useGameStore.getState().playerState.credits;

    dispatchGameAction({ type: 'quest/complete', questId: 'reward_test_quest' });

    const state = useGameStore.getState();
    expect(state.quests.find((q) => q.questId === 'reward_test_quest')?.status).toBe(
      'completed',
    );
    expect(state.playerState.karma).toBe(initialKarma + 5);
    expect(state.playerState.progression.xp).toBe(
      initialXp + 10 + getDefaultQuestXp('side'),
    );
    expect(state.playerState.credits).toBe(
      initialCredits + computeQuestCreditReward(TEST_QUEST_DEF),
    );
    expect(state.playerState.flags.quest_reward_flag).toBe(true);
  });

  it('quest/completeAndApplyRewards matches quest/complete (deprecated alias)', () => {
    const initialXp = useGameStore.getState().playerState.progression.xp;

    dispatchGameAction({
      type: 'quest/completeAndApplyRewards',
      questId: 'reward_test_quest',
    });

    const state = useGameStore.getState();
    expect(state.quests[0]?.status).toBe('completed');
    expect(state.playerState.progression.xp).toBe(
      initialXp + 10 + getDefaultQuestXp('side'),
    );
  });

  it('does not double-apply rewards when completion is dispatched twice', () => {
    dispatchGameAction({ type: 'quest/complete', questId: 'reward_test_quest' });
    const afterFirst = useGameStore.getState().playerState;

    dispatchGameAction({ type: 'quest/complete', questId: 'reward_test_quest' });
    const afterSecond = useGameStore.getState().playerState;

    expect(afterSecond.progression.xp).toBe(afterFirst.progression.xp);
    expect(afterSecond.karma).toBe(afterFirst.karma);
    expect(afterSecond.credits).toBe(afterFirst.credits);
  });
});
