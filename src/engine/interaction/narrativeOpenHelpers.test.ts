import { beforeEach, describe, expect, it, vi } from 'vitest';
import { triggerSceneEntryStoryIfNeeded } from './narrativeOpenHelpers';

const dispatchGameAction = vi.fn();
const closeNarrativeOverlay = vi.fn();
const requestSceneTransition = vi.fn();

let mockSnapshot: {
  activeCutsceneId: string | null;
  currentNodeId: string;
  triggeredCutscenes: string[];
  playerState: { visitedNodes: string[] };
  exploration: { currentSceneId: string };
};

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => mockSnapshot,
  dispatchGameAction: (...args: unknown[]) => dispatchGameAction(...args),
}));

vi.mock('@/store/gameStore', () => ({
  getGameStore: () => mockSnapshot,
}));

vi.mock('@/data/gameDataLoader', () => ({
  ensureStoryNode: vi.fn().mockResolvedValue(undefined),
  getStoryNodes: () => ({
    corridor_door: { id: 'corridor_door', sceneId: 'volodka_corridor', choices: [] },
  }),
}));

vi.mock('@/data/cutscenes', () => ({
  getCutsceneForNode: (nodeId: string) =>
    nodeId === 'corridor_door' ? { id: 'act1_corridor_solnysh' } : undefined,
}));

vi.mock('@/store/visitedNodesIndex', () => ({
  hasVisitedNode: (visited: string[], nodeId: string) => visited.includes(nodeId),
}));

vi.mock('@/engine/scene/narrativeOverlay', () => ({
  openNarrativeOverlay: vi.fn(),
  closeNarrativeOverlay: () => closeNarrativeOverlay(),
}));

vi.mock('@/engine/scene/sceneTransition', () => ({
  requestSceneTransition: (...args: unknown[]) => requestSceneTransition(...args),
}));

vi.mock('@/engine/guidedStory/createGuidedStoryDeps', () => ({
  getStoryNodeSceneId: (nodeId: string) => {
    const map: Record<string, string> = {
      corridor_door: 'volodka_corridor',
      act2_albert_hint: 'cafe_evening',
      start_diagnosis: 'office_day',
    };
    return map[nodeId];
  },
}));

vi.mock('@/shared/sceneExploreHubRegistry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/sceneExploreHubRegistry')>();
  return {
    ...actual,
    isExploreHubNode: (nodeId: string) => nodeId.endsWith('_explore_mode') || nodeId === 'explore_mode',
  };
});

describe('triggerSceneEntryStoryIfNeeded', () => {
  beforeEach(() => {
    dispatchGameAction.mockClear();
    closeNarrativeOverlay.mockClear();
    requestSceneTransition.mockClear();
    mockSnapshot = {
      activeCutsceneId: null,
      currentNodeId: 'explore_mode',
      triggeredCutscenes: [],
      playerState: { visitedNodes: [] },
      exploration: { currentSceneId: 'volodka_corridor' },
    };
  });

  it('starts corridor_door entry when walking from room to corridor', async () => {
    triggerSceneEntryStoryIfNeeded('volodka_corridor', 'volodka_room');
    await Promise.resolve();
    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/setCurrentNodeId',
      nodeId: 'corridor_door',
    });
  });

  it('skips corridor_door when entering from the street', () => {
    triggerSceneEntryStoryIfNeeded('volodka_corridor', 'street_night');
    expect(dispatchGameAction).not.toHaveBeenCalled();
  });

  it('closes overlay when story path already sits on entry node after cutscene played', () => {
    mockSnapshot.currentNodeId = 'corridor_door';
    mockSnapshot.triggeredCutscenes = ['act1_corridor_solnysh'];
    triggerSceneEntryStoryIfNeeded('volodka_corridor', 'volodka_room');
    expect(closeNarrativeOverlay).not.toHaveBeenCalled();
    expect(dispatchGameAction).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'story/setCurrentNodeId' }),
    );
  });

  it('re-arms corridor_door cutscene when already on entry node with pending cinematic', async () => {
    mockSnapshot.currentNodeId = 'corridor_door';
    triggerSceneEntryStoryIfNeeded('volodka_corridor', 'volodka_room');
    await Promise.resolve();
    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/setCurrentNodeId',
      nodeId: 'corridor_explore_mode',
    });
    await Promise.resolve();
    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/setCurrentNodeId',
      nodeId: 'corridor_door',
    });
  });

  it('promotes to corridor hub on revisit after cutscene played', () => {
    mockSnapshot.playerState.visitedNodes = ['corridor_door'];
    mockSnapshot.triggeredCutscenes = ['act1_corridor_solnysh'];
    mockSnapshot.currentNodeId = 'explore_mode';

    triggerSceneEntryStoryIfNeeded('volodka_corridor', 'volodka_room');

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/setCurrentNodeId',
      nodeId: 'corridor_explore_mode',
    });
  });

  it('promotes to home_evening hub on kitchen revisit after cutscene played', () => {
    mockSnapshot.playerState.visitedNodes = ['kitchen_table'];
    mockSnapshot.triggeredCutscenes = ['zarema_first_meeting'];
    mockSnapshot.currentNodeId = 'corridor_explore_mode';
    mockSnapshot.exploration.currentSceneId = 'home_evening';

    triggerSceneEntryStoryIfNeeded('home_evening', 'volodka_corridor');

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/setCurrentNodeId',
      nodeId: 'home_evening_explore_mode',
    });
  });

  it('skips door auto-entry when already on a deliberate story beat for the scene', async () => {
    mockSnapshot.currentNodeId = 'act2_albert_hint';
    mockSnapshot.exploration.currentSceneId = 'cafe_evening';

    triggerSceneEntryStoryIfNeeded('cafe_evening', 'street_night');
    await Promise.resolve();

    expect(dispatchGameAction).not.toHaveBeenCalled();
  });

  it('skips door auto-entry for mid-scene office beats not in entry list', () => {
    mockSnapshot.currentNodeId = 'start_diagnosis';
    mockSnapshot.exploration.currentSceneId = 'office_day';

    triggerSceneEntryStoryIfNeeded('office_day', 'cafe_evening');

    expect(dispatchGameAction).not.toHaveBeenCalled();
  });
});
