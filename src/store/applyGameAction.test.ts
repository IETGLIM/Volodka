import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatchGameAction } from '@/shared/gameBridge/gameActionBridge';
import { useGameStore } from './gameStore';
import type { QuestDefinition, QuestState } from '@/shared/types/game';
import { scheduleQuestFailed } from './storeEffects';
import { areDependenciesMet } from './selectors/questSelectors';

const mockQuestDefinitions: QuestDefinition[] = [
  {
    id: 'data_heist',
    title: 'Похищение данных',
    description: 'Test',
    questType: 'main',
    canRetry: true,
    objectives: [
      {
        id: 'plan_infiltration',
        description: 'Plan',
        type: 'npc_talked',
        target: 'maxim',
        completed: false,
      },
      {
        id: 'infiltrate_office_night',
        description: 'Infiltrate',
        type: 'location_visited',
        target: 'office_day',
        completed: false,
      },
    ],
  },
  {
    id: 'system_infiltration',
    title: 'Проникновение в систему',
    description: 'Test',
    questType: 'main',
    canRetry: false,
    requiresQuests: ['data_heist'],
    objectives: [
      {
        id: 'analyze_blackmail_data',
        description: 'Analyze',
        type: 'flag_set',
        target: 'analyzed',
        completed: false,
      },
    ],
  },
  {
    id: 'system_takedown',
    title: 'Свержение системы',
    description: 'Test',
    questType: 'main',
    act: 7,
    canRetry: false,
    objectives: [
      {
        id: 'assemble_strike_team',
        description: 'Assemble',
        type: 'npc_talked',
        target: 'npc',
        completed: false,
      },
    ],
  },
];

vi.mock('@/data/gameDataLoader', () => ({
  getQuestDefinitions: vi.fn(() => mockQuestDefinitions),
  getPoemById: vi.fn(),
  getAchievementMap: vi.fn(() => new Map()),
  getDailyMissionById: vi.fn(),
  getTotalAchievements: vi.fn(() => 0),
}));

vi.mock('./storeEffects', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./storeEffects')>();
  return {
    ...actual,
    runAfterStoreCommit: (fn: () => void) => fn(),
    scheduleQuestObjectiveUpdated: vi.fn(),
    scheduleQuestFailed: vi.fn(),
    emitPoemResetAllEffects: vi.fn(),
  };
});

const TEST_QUEST: QuestState = {
  questId: 'test_quest',
  status: 'active',
  objectives: { obj_a: false, obj_b: false },
  startedAtTime: 12,
};

describe('applyGameAction via dispatchGameAction', () => {
  beforeEach(() => {
    useGameStore.setState({ quests: [] });
    // Reset player flags so quest_retried_with_penalty_* flags from previous
    // tests do not leak into the next one.
    useGameStore.setState({
      playerState: {
        ...useGameStore.getState().playerState,
        flags: {},
      },
    });
    vi.mocked(scheduleQuestFailed).mockClear();
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

  it('fails a quest, emits quest:failed, and notifies store subscribers', () => {
    useGameStore.setState({
      quests: [
        {
          questId: 'data_heist',
          status: 'active',
          objectives: { step: false },
          startedAtTime: 8,
        },
      ],
    });

    const listener = vi.fn();
    const unsub = useGameStore.subscribe(listener);

    dispatchGameAction({
      type: 'quest/fail',
      questId: 'data_heist',
      reason: 'Истекло время задания',
    });

    const quest = useGameStore.getState().quests.find((q) => q.questId === 'data_heist');
    expect(quest?.status).toBe('failed');
    expect(listener).toHaveBeenCalled();
    expect(scheduleQuestFailed).toHaveBeenCalledWith({
      questId: 'data_heist',
      questTitle: 'Похищение данных',
      reason: 'Истекло время задания',
      canRetry: true,
    });
    unsub();
  });

  it('marks unspecified canRetry as retryable on fail', () => {
    useGameStore.setState({
      quests: [
        {
          questId: 'zarema_rescue',
          status: 'active',
          objectives: { learn_zarema_arrested: false },
          startedAtTime: 8,
        },
      ],
    });

    dispatchGameAction({
      type: 'quest/fail',
      questId: 'zarema_rescue',
      reason: 'Истекло время задания',
    });

    expect(scheduleQuestFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        questId: 'zarema_rescue',
        canRetry: true,
      }),
    );
  });

  it('does not emit quest:failed when quest is already failed', () => {
    useGameStore.setState({
      quests: [
        {
          questId: 'data_heist',
          status: 'failed',
          objectives: { step: false },
          startedAtTime: 8,
        },
      ],
    });

    dispatchGameAction({
      type: 'quest/fail',
      questId: 'data_heist',
      reason: 'Повторный провал',
    });

    expect(scheduleQuestFailed).not.toHaveBeenCalled();
  });

  it('retries a failed retryable quest and restores active state', () => {
    useGameStore.setState({
      quests: [
        {
          questId: 'data_heist',
          status: 'failed',
          objectives: { plan_infiltration: true, infiltrate_office_night: false },
          startedAtTime: 8,
        },
      ],
      exploration: {
        ...useGameStore.getState().exploration,
        timeOfDay: 14,
      },
    });

    dispatchGameAction({ type: 'quest/retry', questId: 'data_heist' });

    const quest = useGameStore.getState().quests.find((q) => q.questId === 'data_heist');
    expect(quest?.status).toBe('active');
    expect(quest?.objectives.plan_infiltration).toBe(false);
    expect(quest?.objectives.infiltrate_office_night).toBe(false);
    expect(quest?.startedAtTime).toBe(14);
  });

  it('does not retry a quest with canRetry false', () => {
    // system_takedown is main + act 7 (critical path) with canRetry:false.
    // The bypass mechanic grants exactly ONE second chance with a penalty —
    // so the first retry succeeds, but a second retry is blocked because the
    // quest_retried_with_penalty flag is set.
    useGameStore.setState({
      quests: [
        {
          questId: 'system_takedown',
          status: 'failed',
          objectives: { assemble_strike_team: true },
          startedAtTime: 10,
        },
      ],
      playerState: {
        ...useGameStore.getState().playerState,
        flags: {
          ...useGameStore.getState().playerState.flags,
          quest_retried_with_penalty_system_takedown: true,
        },
      },
    });

    dispatchGameAction({ type: 'quest/retry', questId: 'system_takedown' });

    const quest = useGameStore.getState().quests.find((q) => q.questId === 'system_takedown');
    expect(quest?.status).toBe('failed');
    expect(quest?.objectives.assemble_strike_team).toBe(true);
  });

  it('grants a one-time bypass retry for critical-path canRetry:false quests with penalty', () => {
    // system_takedown is main + act 7 (critical path) with canRetry:false.
    // First retry should succeed (bypass) and apply karma + stress penalty.
    useGameStore.setState({
      quests: [
        {
          questId: 'system_takedown',
          status: 'failed',
          objectives: { assemble_strike_team: true },
          startedAtTime: 10,
        },
      ],
      playerState: {
        ...useGameStore.getState().playerState,
        flags: { ...useGameStore.getState().playerState.flags },
        karma: 60,
        stress: 30,
      },
    });

    const karmaBefore = useGameStore.getState().playerState.karma;
    const stressBefore = useGameStore.getState().playerState.stress;

    dispatchGameAction({ type: 'quest/retry', questId: 'system_takedown' });

    const quest = useGameStore.getState().quests.find((q) => q.questId === 'system_takedown');
    expect(quest?.status).toBe('active');
    expect(quest?.objectives.assemble_strike_team).toBe(false);

    // Penalty flag is set so a second bypass is blocked.
    expect(
      useGameStore.getState().playerState.flags.quest_retried_with_penalty_system_takedown,
    ).toBe(true);

    // Karma decreased and stress increased by the penalty amounts.
    expect(useGameStore.getState().playerState.karma).toBe(karmaBefore - 8);
    expect(useGameStore.getState().playerState.stress).toBe(stressBefore + 15);
  });

  it('golden-path prerequisite unblocked after retryable fail and recovery', () => {
    useGameStore.setState({
      quests: [
        {
          questId: 'data_heist',
          status: 'failed',
          objectives: { plan_infiltration: false },
          startedAtTime: 6,
        },
      ],
    });

    dispatchGameAction({ type: 'quest/retry', questId: 'data_heist' });
    dispatchGameAction({ type: 'quest/complete', questId: 'data_heist' });

    const heist = useGameStore.getState().quests.find((q) => q.questId === 'data_heist');
    expect(heist?.status).toBe('completed');
    expect(areDependenciesMet('system_infiltration').met).toBe(true);
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
