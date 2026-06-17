import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GuidedStoryManager } from '@/engine/GuidedStoryManager';
import type {
  GuidedStoryDeps,
  GuidedStoryPathConfig,
  GuidedStorySnapshot,
} from '@/engine/guidedStory/guidedStoryTypes';
import { resolveStorySpineAdvance, syncSpineStateFromSnapshot, reconcileSpineQuestActivation } from '@/engine/guidedStory/guidedStoryLogic';
import { isStoryGraphEdge } from '@/engine/story/storyGraphTraversal';

const TEST_PATH: GuidedStoryPathConfig = {
  storySpine: ['start', 'explore_mode', 'room_table', 'maria_curious'],
  questSpine: ['first_reading', 'maria_connection'],
  branchHints: { explore_mode: 'Осмотри комнату' },
  actTransitions: [
    {
      act: 1,
      chapterTitle: 'Пробуждение',
      entryNodeId: 'start',
      questSpineIds: ['first_reading'],
      advanceTrigger: 'either',
    },
  ],
  actChapterTitles: { 1: 'Пробуждение' },
  storyNodeToSceneLabel: {},
  storyNodeObjectiveType: {},
  storyFlagToNodeId: {},
  getNpcIdForStoryNode: (nodeId) => (nodeId === 'maria_curious' ? 'maria' : undefined),
};

function createTestDeps(overrides?: Partial<GuidedStorySnapshot>): GuidedStoryDeps {
  const snapshot: GuidedStorySnapshot = {
    visitedNodes: ['start'],
    currentAct: 1,
    flags: {},
    collectedPoems: [],
    quests: [],
    activeTTLFlagKeys: [],
    ...overrides,
  };

  return {
    getSnapshot: () => snapshot,
    path: TEST_PATH,
    npc: {
      findNpcById: (id) => (id === 'maria' ? { name: 'Виктория' } : undefined),
    },
    quests: { areDependenciesMet: () => ({ met: true }) },
    graph: {
      findQuestForNode: vi.fn(() => null),
      getQuestDefinitionById: vi.fn(() => undefined),
    },
    actions: {
      advanceAct: vi.fn(),
      activateQuest: vi.fn(),
    },
    events: {
      emitActTransition: vi.fn(),
      emitGuidanceUpdate: vi.fn(),
      emitQuestAvailable: vi.fn(),
      emitQuestChainUnlock: vi.fn(),
    },
  };
}

describe('guidedStoryLogic', () => {
  it('resolveStorySpineAdvance ignores explore hub re-entry when already past', () => {
    expect(resolveStorySpineAdvance('explore_mode', 2, TEST_PATH)).toBeNull();
  });

  it('resolveStorySpineAdvance advances on first explore hub visit', () => {
    expect(resolveStorySpineAdvance('explore_mode', 1, TEST_PATH)).toBe(2);
  });

  it('resolveStorySpineAdvance ignores future spine nodes', () => {
    expect(resolveStorySpineAdvance('room_table', 1, TEST_PATH)).toBeNull();
  });

  it('syncSpineStateFromSnapshot derives step index from visited nodes', () => {
    const synced = syncSpineStateFromSnapshot(
      {
        visitedNodes: ['start', 'explore_mode'],
        currentAct: 1,
        flags: {},
        collectedPoems: [],
        quests: [],
        activeTTLFlagKeys: [],
      },
      TEST_PATH,
    );
    expect(synced.currentStepIndex).toBe(2);
  });

  it('reconcileSpineQuestActivation activates network_initiation when progress flags exist', () => {
    const deps = createTestDeps({
      currentAct: 2,
      flags: { recited_poem_initiation: true },
      visitedNodes: ['act2_maria_meeting_place'],
    });
    deps.graph.getQuestDefinitionById = vi.fn((id: string) =>
      id === 'network_initiation'
        ? {
            id: 'network_initiation',
            title: 'Посвящение в Сеть',
            description: 'test',
            questType: 'main' as const,
            objectives: [],
          }
        : undefined,
    );

    const activated = reconcileSpineQuestActivation(deps);
    expect(activated).toBe(true);
    expect(deps.actions.activateQuest).toHaveBeenCalledWith('network_initiation');
    expect(deps.events.emitQuestAvailable).toHaveBeenCalledWith(
      expect.objectContaining({ questId: 'network_initiation' }),
    );
  });

  it('reconcileSpineQuestActivation skips when quest already active', () => {
    const deps = createTestDeps({
      currentAct: 2,
      flags: { recited_poem_initiation: true },
      quests: [{ questId: 'network_initiation', status: 'active', objectives: {} }],
    });

    expect(reconcileSpineQuestActivation(deps)).toBe(false);
    expect(deps.actions.activateQuest).not.toHaveBeenCalled();
  });

  it('reconcileSpineQuestActivation activates dmitry_defection when meeting flag exists', () => {
    const deps = createTestDeps({
      currentAct: 2,
      flags: { dmitry_meeting_agreed: true, network_joined: true },
      quests: [
        { questId: 'network_initiation', status: 'completed', objectives: {} },
      ],
    });
    deps.graph.getQuestDefinitionById = vi.fn((id: string) =>
      id === 'dmitry_defection'
        ? {
            id: 'dmitry_defection',
            title: 'Дезертирство Дмитрия',
            description: 'test',
            questType: 'main' as const,
            requiresQuests: ['network_initiation'],
            objectives: [],
          }
        : undefined,
    );

    const activated = reconcileSpineQuestActivation(deps);
    expect(activated).toBe(true);
    expect(deps.actions.activateQuest).toHaveBeenCalledWith('dmitry_defection');
  });

  it('reconcileSpineQuestActivation activates cafe_safehouse when vault vowed', () => {
    const deps = createTestDeps({
      currentAct: 2,
      flags: { vault_protect_vowed: true, network_joined: true },
      quests: [
        { questId: 'network_initiation', status: 'completed', objectives: {} },
      ],
    });
    deps.graph.getQuestDefinitionById = vi.fn((id: string) =>
      id === 'cafe_safehouse'
        ? {
            id: 'cafe_safehouse',
            title: 'Тихая гавань',
            description: 'test',
            questType: 'main' as const,
            requiresQuests: ['network_initiation'],
            objectives: [],
          }
        : undefined,
    );

    const activated = reconcileSpineQuestActivation(deps);
    expect(activated).toBe(true);
    expect(deps.actions.activateQuest).toHaveBeenCalledWith('cafe_safehouse');
  });

  it('reconcileSpineQuestActivation activates vault_key_fragments when vault revealed', () => {
    const deps = createTestDeps({
      currentAct: 2,
      flags: { vault_access_granted: true, network_joined: true },
      quests: [
        { questId: 'vault_backup_trial', status: 'completed', objectives: {} },
        { questId: 'network_initiation', status: 'completed', objectives: {} },
      ],
    });
    deps.graph.getQuestDefinitionById = vi.fn((id: string) =>
      id === 'vault_key_fragments'
        ? {
            id: 'vault_key_fragments',
            title: 'Фрагменты ключа',
            description: 'test',
            questType: 'main' as const,
            requiresQuests: ['vault_backup_trial'],
            objectives: [],
          }
        : undefined,
    );

    const activated = reconcileSpineQuestActivation(deps);
    expect(activated).toBe(true);
    expect(deps.actions.activateQuest).toHaveBeenCalledWith('vault_key_fragments');
  });

  it('reconcileSpineQuestActivation activates poetry_smuggling when safehouse established', () => {
    const deps = createTestDeps({
      currentAct: 2,
      flags: { cafe_safehouse_established: true, network_joined: true },
      quests: [
        { questId: 'cafe_safehouse', status: 'completed', objectives: {} },
      ],
    });
    deps.graph.getQuestDefinitionById = vi.fn((id: string) =>
      id === 'poetry_smuggling'
        ? {
            id: 'poetry_smuggling',
            title: 'Контрабанда стихов',
            description: 'test',
            questType: 'side' as const,
            requiresQuests: ['cafe_safehouse'],
            objectives: [],
          }
        : undefined,
    );

    const activated = reconcileSpineQuestActivation(deps);
    expect(activated).toBe(true);
    expect(deps.actions.activateQuest).toHaveBeenCalledWith('poetry_smuggling');
  });
});

describe('storyGraphTraversal', () => {
  it('blocks explore hub self-loops', () => {
    expect(isStoryGraphEdge('explore_mode', 'explore_mode')).toBe(false);
    expect(isStoryGraphEdge('explore_mode', 'room_table')).toBe(true);
  });
});

describe('GuidedStoryManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not double-advance on explore hub re-entry', () => {
    const deps = createTestDeps({ visitedNodes: ['start', 'explore_mode'] });
    const manager = new GuidedStoryManager(deps);
    manager.syncSpineForTest();

    manager.advanceStorySpineForTest('explore_mode', { immediate: true });
    expect(deps.events.emitGuidanceUpdate).not.toHaveBeenCalled();
  });

  it('advances spine once on first explore hub visit', () => {
    const deps = createTestDeps({ visitedNodes: ['start'] });
    const manager = new GuidedStoryManager(deps);
    manager.syncSpineForTest();

    manager.advanceStorySpineForTest('explore_mode', { immediate: true });
    expect(deps.events.emitGuidanceUpdate).toHaveBeenCalledTimes(1);
  });

  it('debounces concurrent spine advance signals into one flush', () => {
    const deps = createTestDeps({ visitedNodes: ['start'] });
    const manager = new GuidedStoryManager(deps);
    manager.syncSpineForTest();

    manager.advanceStorySpineForTest('explore_mode');
    manager.advanceStorySpineForTest('explore_mode');
    expect(deps.events.emitGuidanceUpdate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(32);
    expect(deps.events.emitGuidanceUpdate).toHaveBeenCalledTimes(1);
  });

  it('does not advance a future spine step after debounce flush', () => {
    const deps = createTestDeps({ visitedNodes: ['start'] });
    const manager = new GuidedStoryManager(deps);

    manager.advanceStorySpineForTest('start');
    manager.advanceStorySpineForTest('explore_mode');
    vi.advanceTimersByTime(32);

    expect(deps.events.emitGuidanceUpdate).toHaveBeenCalledTimes(1);
    expect(deps.actions.advanceAct).not.toHaveBeenCalled();
  });
});
