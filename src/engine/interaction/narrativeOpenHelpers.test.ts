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

  it('closes overlay when story path already sits on pending entry node', () => {
    mockSnapshot.currentNodeId = 'corridor_door';
    triggerSceneEntryStoryIfNeeded('volodka_corridor', 'volodka_room');
    expect(closeNarrativeOverlay).toHaveBeenCalled();
    expect(dispatchGameAction).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'story/setCurrentNodeId' }),
    );
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
});
