import { describe, it, expect, vi } from 'vitest';
import { GuidedStoryManager } from '@/engine/GuidedStoryManager';
import type {
  GuidedStoryDeps,
  GuidedStoryPathConfig,
  GuidedStorySnapshot,
} from '@/engine/guidedStory/guidedStoryTypes';
import { resolveStorySpineAdvance, syncSpineStateFromSnapshot, getActForNode, getActTransition } from '@/engine/guidedStory/guidedStoryLogic';
import { isStoryGraphEdge } from '@/engine/story/storyGraphTraversal';
import {
  ACT_CHAPTER_TITLES,
  ACT_TRANSITIONS,
  GOLDEN_PATH_BRANCH_HINTS,
  GOLDEN_PATH_QUEST_SPINE,
  GOLDEN_PATH_STORY_SPINE,
  STORY_FLAG_TO_NODE_ID,
  STORY_NODE_OBJECTIVE_TYPE,
  STORY_NODE_TO_SCENE_LABEL,
  getNpcIdForStoryNode,
} from '@/data/goldenPath';

const FULL_PATH: GuidedStoryPathConfig = {
  storySpine: GOLDEN_PATH_STORY_SPINE,
  questSpine: GOLDEN_PATH_QUEST_SPINE,
  branchHints: GOLDEN_PATH_BRANCH_HINTS,
  actTransitions: ACT_TRANSITIONS,
  actChapterTitles: ACT_CHAPTER_TITLES,
  storyNodeToSceneLabel: STORY_NODE_TO_SCENE_LABEL,
  storyNodeObjectiveType: STORY_NODE_OBJECTIVE_TYPE,
  storyFlagToNodeId: STORY_FLAG_TO_NODE_ID,
  getNpcIdForStoryNode,
};

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
  let snapshot: GuidedStorySnapshot = {
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
  it('does not double-advance on explore hub re-entry', () => {
    const deps = createTestDeps();
    const manager = new GuidedStoryManager(deps);

    manager.advanceStorySpineForTest('explore_mode');
    expect(deps.events.emitGuidanceUpdate).toHaveBeenCalledTimes(1);

    vi.mocked(deps.events.emitGuidanceUpdate).mockClear();
    manager.advanceStorySpineForTest('explore_mode');
    expect(deps.events.emitGuidanceUpdate).not.toHaveBeenCalled();
  });

  it('advances spine once on first explore hub visit', () => {
    const deps = createTestDeps({ visitedNodes: ['start'] });
    const manager = new GuidedStoryManager(deps);

    manager.advanceStorySpineForTest('explore_mode');
    expect(deps.events.emitGuidanceUpdate).toHaveBeenCalledTimes(1);
  });
});

describe('full golden path act transitions', () => {
  it('maps every ACT_TRANSITIONS entry node to the correct act on the spine', () => {
    for (const trans of ACT_TRANSITIONS) {
      expect(getActForNode(trans.entryNodeId, FULL_PATH)).toBe(trans.act);
      expect(FULL_PATH.actChapterTitles[trans.act]).toBe(trans.chapterTitle);
    }
  });

  it('covers all seven acts with quest spine ids from golden path tables', () => {
    expect(ACT_TRANSITIONS).toHaveLength(7);
    for (const trans of ACT_TRANSITIONS) {
      expect(trans.questSpineIds.length).toBeGreaterThan(0);
      expect(getActTransition(FULL_PATH, trans.act)?.entryNodeId).toBe(trans.entryNodeId);
    }
  });

  it('advances act when visiting next act entry node on full spine', () => {
    const act2EntryIdx = FULL_PATH.storySpine.indexOf('act2_transition');
    expect(act2EntryIdx).toBeGreaterThan(0);

    const deps = createTestDeps({
      visitedNodes: FULL_PATH.storySpine.slice(0, act2EntryIdx),
      currentAct: 1,
    });
    deps.path = FULL_PATH;

    const manager = new GuidedStoryManager(deps);
    manager.advanceStorySpineForTest('act2_transition');

    expect(deps.actions.advanceAct).toHaveBeenCalled();
    expect(deps.events.emitActTransition).toHaveBeenCalledWith(
      expect.objectContaining({ toAct: 2, chapterTitle: ACT_CHAPTER_TITLES[2] }),
    );
  });
});
