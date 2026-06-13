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
  ],
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
