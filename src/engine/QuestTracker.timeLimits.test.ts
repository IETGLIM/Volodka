import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QuestDefinition } from '@/shared/types/game';

const TIMED_QUEST: QuestDefinition = {
  id: 'timed_quest',
  title: 'Timed Quest',
  description: 'Test',
  questType: 'side',
  timeLimitHours: 2,
  objectives: [
    { id: 'step', description: 'Step', type: 'flag_set', target: 'done', completed: false },
  ],
};

const UNTIMED_QUEST: QuestDefinition = {
  id: 'untimed_quest',
  title: 'Untimed Quest',
  description: 'Test',
  questType: 'side',
  objectives: [
    { id: 'step', description: 'Step', type: 'flag_set', target: 'done', completed: false },
  ],
};

const mockDefinitions: QuestDefinition[] = [TIMED_QUEST, UNTIMED_QUEST];

const mockSnapshot = {
  exploration: {
    currentSceneId: 'scene_a' as const,
    timeOfDay: 10,
  },
  playerState: {
    flags: {} as Record<string, boolean>,
    inventory: [] as Array<{ id: string }>,
  },
  collectedPoems: [] as string[],
  quests: [
    {
      questId: 'timed_quest',
      status: 'active' as const,
      objectives: {} as Record<string, boolean>,
      startedAtTime: 8,
      hoursElapsed: 0,
    },
    {
      questId: 'untimed_quest',
      status: 'active' as const,
      objectives: {} as Record<string, boolean>,
    },
  ],
};

type HourChangedHandler = (payload: {
  hour: number;
  previousHour: number;
  npcStates: Record<string, unknown>;
}) => void;

let hourChangedHandler: HourChangedHandler | null = null;
let gameLoadedHandler: (() => void) | null = null;

vi.mock('@/data/gameDataLoader', () => ({
  getQuestDefinitions: vi.fn(() => mockDefinitions),
}));

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => mockSnapshot,
  dispatchGameAction: vi.fn(),
  subscribeGameSnapshot: vi.fn(() => vi.fn()),
}));

vi.mock('@/engine/EventBus', () => ({
  eventBus: {
    on: vi.fn((event: string, handler: HourChangedHandler | (() => void)) => {
      if (event === 'world:hour_changed') {
        hourChangedHandler = handler as HourChangedHandler;
      }
      if (event === 'game:loaded') {
        gameLoadedHandler = handler as () => void;
      }
      return vi.fn();
    }),
    emit: vi.fn(),
  },
}));

vi.mock('@/shared/dev/hmrDispose', () => ({
  registerHmrDispose: vi.fn(),
}));

import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { QuestTracker, resetQuestTrackerDefinitionCache } from '@/engine/QuestTracker';

describe('QuestTracker time limits', () => {
  beforeEach(() => {
    resetQuestTrackerDefinitionCache();
    hourChangedHandler = null;
    gameLoadedHandler = null;
    mockSnapshot.exploration.timeOfDay = 10;
    mockSnapshot.quests = [
      {
        questId: 'timed_quest',
        status: 'active',
        objectives: {},
        startedAtTime: 8,
        hoursElapsed: 0,
      },
      {
        questId: 'untimed_quest',
        status: 'active',
        objectives: {},
      },
    ];
    vi.clearAllMocks();
  });

  it('fails a timed quest after the limit is exceeded', () => {
    const tracker = new QuestTracker();
    tracker.start();
    expect(hourChangedHandler).not.toBeNull();

    hourChangedHandler!({ hour: 11, previousHour: 8, npcStates: {} });

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'quest/fail',
      questId: 'timed_quest',
      reason: 'Истекло время задания',
    });
    expect(dispatchGameAction).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'quest/setHoursElapsed' }),
    );
    expect(dispatchGameAction).not.toHaveBeenCalledWith(
      expect.objectContaining({ questId: 'untimed_quest' }),
    );

    tracker.stop();
  });

  it('does not fail an untimed quest when hours advance', () => {
    mockSnapshot.quests = [
      {
        questId: 'untimed_quest',
        status: 'active',
        objectives: {},
      },
    ];
    const tracker = new QuestTracker();
    tracker.start();

    hourChangedHandler!({ hour: 20, previousHour: 10, npcStates: {} });

    const failCalls = vi.mocked(dispatchGameAction).mock.calls.filter(
      ([action]) => action.type === 'quest/fail',
    );
    expect(failCalls).toHaveLength(0);

    tracker.stop();
  });

  it('persists elapsed hours on incremental ticks before expiry', () => {
    mockSnapshot.quests[0].hoursElapsed = 0.5;
    const tracker = new QuestTracker();
    tracker.start();

    hourChangedHandler!({ hour: 10.5, previousHour: 10, npcStates: {} });

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'quest/setHoursElapsed',
      questId: 'timed_quest',
      hoursElapsed: 1,
    });
    expect(dispatchGameAction).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'quest/fail' }),
    );

    tracker.stop();
  });

  it('fails on load when saved elapsed hours already exceed the limit', () => {
    mockSnapshot.quests[0].hoursElapsed = 2.5;
    const tracker = new QuestTracker();
    tracker.start();

    expect(gameLoadedHandler).not.toBeNull();
    gameLoadedHandler!();

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'quest/fail',
      questId: 'timed_quest',
      reason: 'Истекло время задания',
    });

    tracker.stop();
  });
});
