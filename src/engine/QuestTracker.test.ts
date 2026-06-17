import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QuestDefinition } from '@/shared/types/game';

const mockDefinitions: QuestDefinition[] = [
  {
    id: 'q1',
    title: 'Test Quest',
    description: 'Test',
    questType: 'main',
    objectives: [
      {
        id: 'loc',
        description: 'Visit scene',
        type: 'location_visited',
        target: 'scene_b',
        completed: false,
      },
      {
        id: 'flag',
        description: 'Set flag',
        type: 'flag_set',
        target: 'new_flag',
        completed: false,
      },
      {
        id: 'item',
        description: 'Collect item',
        type: 'item_collected',
        target: 'key_item',
        completed: false,
      },
    ],
  },
];

const mockSnapshot = {
  exploration: {
    currentSceneId: 'scene_a' as const,
    timeOfDay: 12,
  },
  playerState: {
    flags: {} as Record<string, boolean>,
    inventory: [] as Array<{ id: string }>,
  },
  collectedPoems: [] as string[],
  quests: [
    {
      questId: 'q1',
      status: 'active' as const,
      objectives: {} as Record<string, boolean>,
    },
  ] as Array<{
    questId: string;
    status: 'active' | 'failed' | 'inactive' | 'completed';
    objectives: Record<string, boolean>;
    startedAtTime?: number;
  }>,
};

type StateChangeHandler = (slice: {
  currentSceneId: string;
  timeOfDay: number;
  flags: Record<string, boolean>;
  inventoryIds: string[];
  collectedPoems: string[];
  quests: Array<{
    questId: string;
    status: string;
    startedAtTime?: number;
    objectives: Record<string, boolean>;
  }>;
}) => void;

let stateChangeHandler: StateChangeHandler | null = null;

vi.mock('@/data/gameDataLoader', () => ({
  getQuestDefinitions: vi.fn(() => mockDefinitions),
}));

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => mockSnapshot,
  dispatchGameAction: vi.fn(),
  subscribeGameSnapshot: vi.fn((listener: StateChangeHandler) => {
    stateChangeHandler = listener;
    return vi.fn();
  }),
}));

vi.mock('@/engine/EventBus', () => ({
  eventBus: {
    on: vi.fn(() => vi.fn()),
    emit: vi.fn(),
  },
}));

vi.mock('@/shared/dev/hmrDispose', () => ({
  registerHmrDispose: vi.fn(),
}));

import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { getQuestDefinitions } from '@/data/gameDataLoader';
import { QuestTracker, resetQuestTrackerDefinitionCache } from '@/engine/QuestTracker';

describe('QuestTracker state-change batching', () => {
  beforeEach(() => {
    resetQuestTrackerDefinitionCache();
    stateChangeHandler = null;
    mockSnapshot.exploration.currentSceneId = 'scene_a';
    mockSnapshot.playerState.flags = {};
    mockSnapshot.playerState.inventory = [];
    mockSnapshot.collectedPoems = [];
    mockSnapshot.quests = [
      {
        questId: 'q1',
        status: 'active',
        objectives: {},
      },
    ];
    vi.clearAllMocks();
  });

  it('loads quest definitions once per state change across all objective checks', () => {
    const tracker = new QuestTracker();
    tracker.start();
    expect(stateChangeHandler).not.toBeNull();

    vi.mocked(getQuestDefinitions).mockClear();
    resetQuestTrackerDefinitionCache();

    stateChangeHandler!({
      currentSceneId: 'scene_b',
      timeOfDay: 12,
      flags: { new_flag: true },
      inventoryIds: ['key_item'],
      collectedPoems: [],
      quests: [
        {
          questId: 'q1',
          status: 'active',
          objectives: {},
        },
      ],
    });

    expect(getQuestDefinitions).toHaveBeenCalledTimes(1);
    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'quest/completeObjective',
      questId: 'q1',
      objectiveId: 'loc',
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'quest/completeObjective',
      questId: 'q1',
      objectiveId: 'flag',
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'quest/completeObjective',
      questId: 'q1',
      objectiveId: 'item',
    });

    tracker.stop();
  });
});

describe('QuestTracker.canActivateQuest', () => {
  const poemGatedQuest: QuestDefinition = {
    id: 'poem_gate_quest',
    title: 'Poem Gate',
    description: 'Needs poem',
    questType: 'side',
    requiredPoem: 'poem_11',
    objectives: [
      { id: 'step', description: 'Step', type: 'flag_set', target: 'done', completed: false },
    ],
  };

  beforeEach(() => {
    mockDefinitions.length = 0;
    mockDefinitions.push(poemGatedQuest as (typeof mockDefinitions)[number]);
    resetQuestTrackerDefinitionCache();
    mockSnapshot.collectedPoems = [];
    mockSnapshot.quests = [];
    mockSnapshot.playerState.flags = {};
  });

  it('blocks activation without required poem', () => {
    const tracker = new QuestTracker();
    expect(tracker.canActivateQuest('poem_gate_quest')).toBe(false);
    mockSnapshot.collectedPoems = ['poem_11'];
    expect(tracker.canActivateQuest('poem_gate_quest')).toBe(true);
    tracker.stop();
  });

  it('allows retry eligibility for failed quests unless canRetry is false', () => {
    const retryable: QuestDefinition = {
      id: 'retryable_quest',
      title: 'Retryable',
      description: 'Retryable',
      questType: 'side',
      objectives: [
        { id: 'step', description: 'Step', type: 'flag_set', target: 'done', completed: false },
      ],
    };
    const permanent: QuestDefinition = {
      ...retryable,
      id: 'permanent_fail',
      canRetry: false,
    };

    mockDefinitions.length = 0;
    mockDefinitions.push(retryable, permanent);
    resetQuestTrackerDefinitionCache();

    mockSnapshot.quests = [{ questId: 'retryable_quest', status: 'failed', objectives: {} }];
    const tracker = new QuestTracker();
    expect(tracker.canActivateQuest('retryable_quest')).toBe(true);

    mockSnapshot.quests = [{ questId: 'permanent_fail', status: 'failed', objectives: {} }];
    expect(tracker.canActivateQuest('permanent_fail')).toBe(false);
    tracker.stop();
  });
});
