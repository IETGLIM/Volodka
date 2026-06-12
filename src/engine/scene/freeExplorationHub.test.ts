import { describe, expect, it, vi, beforeEach } from 'vitest';
import { enterAct1FreeExplorationHub } from './freeExplorationHub';

const dispatchGameAction = vi.fn();
const closeNarrativeOverlay = vi.fn();
const eventBusEmit = vi.fn();

let mockSnapshot = {
  currentNodeId: 'start',
  playerState: { visitedNodes: [] as string[] },
};

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => mockSnapshot,
  dispatchGameAction: (...args: unknown[]) => dispatchGameAction(...args),
}));

vi.mock('@/engine/scene/narrativeOverlay', () => ({
  closeNarrativeOverlay: () => closeNarrativeOverlay(),
}));

vi.mock('@/engine/interaction/interactionEndDedup', () => ({
  forceEmitInteractionEnd: vi.fn(),
}));

vi.mock('@/engine/EventBus', () => ({
  eventBus: {
    emit: (...args: unknown[]) => eventBusEmit(...args),
  },
}));

vi.mock('@/store/visitedNodesIndex', () => ({
  hasVisitedNode: (visited: string[], nodeId: string) => visited.includes(nodeId),
}));

describe('enterAct1FreeExplorationHub', () => {
  beforeEach(() => {
    dispatchGameAction.mockClear();
    closeNarrativeOverlay.mockClear();
    eventBusEmit.mockClear();
    mockSnapshot = {
      currentNodeId: 'start',
      playerState: { visitedNodes: [] },
    };
  });

  it('closes overlay and shows location context on first visit', () => {
    enterAct1FreeExplorationHub('explore_mode');

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/setCurrentNodeId',
      nodeId: 'explore_mode',
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/visitNode',
      nodeId: 'explore_mode',
    });
    expect(closeNarrativeOverlay).toHaveBeenCalled();
    expect(eventBusEmit).toHaveBeenCalledWith(
      'game:notification',
      expect.objectContaining({
        type: 'scene',
        subtitle: expect.stringContaining('Комната'),
      }),
    );
  });

  it('skips location toast on revisit', () => {
    mockSnapshot.playerState.visitedNodes = ['explore_mode'];
    enterAct1FreeExplorationHub('explore_mode');

    expect(closeNarrativeOverlay).toHaveBeenCalled();
    expect(eventBusEmit).not.toHaveBeenCalledWith(
      'game:notification',
      expect.anything(),
    );
  });

  it('ignores non-Act-I hub ids', () => {
    enterAct1FreeExplorationHub('cafe_explore_mode');
    expect(dispatchGameAction).not.toHaveBeenCalled();
    expect(closeNarrativeOverlay).not.toHaveBeenCalled();
  });
});
