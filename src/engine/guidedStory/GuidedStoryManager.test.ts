import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GuidedStoryManager } from '@/engine/GuidedStoryManager';
import type {
  GuidedStoryDeps,
  GuidedStoryPathConfig,
  GuidedStorySnapshot,
} from '@/engine/guidedStory/guidedStoryTypes';
import { resolveStorySpineAdvance, syncSpineStateFromSnapshot } from '@/engine/guidedStory/guidedStoryLogic';
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
        quests: [],
        activeTTLFlagKeys: [],
      },
      TEST_PATH,
    );
    expect(synced.currentStepIndex).toBe(2);
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
