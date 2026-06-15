import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { enterSceneFreeExplorationHub } from './freeExplorationHub';

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

describe('enterSceneFreeExplorationHub', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    dispatchGameAction.mockClear();
    closeNarrativeOverlay.mockClear();
    eventBusEmit.mockClear();
    mockSnapshot = {
      currentNodeId: 'start',
      playerState: { visitedNodes: [] },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('closes overlay and shows location context on first visit', () => {
    enterSceneFreeExplorationHub('explore_mode');

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/setCurrentNodeId',
      nodeId: 'explore_mode',
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/visitNode',
      nodeId: 'explore_mode',
    });
    expect(closeNarrativeOverlay).toHaveBeenCalled();
    expect(eventBusEmit).not.toHaveBeenCalledWith(
      'game:notification',
      expect.anything(),
    );

    vi.advanceTimersByTime(480);
    expect(eventBusEmit).toHaveBeenCalledWith(
      'game:notification',
      expect.objectContaining({
        type: 'scene',
        subtitle: expect.stringContaining('Комната'),
      }),
    );
  });

  it('shows shorter revisit message when hubTextRevisit is set', () => {
    mockSnapshot.playerState.visitedNodes = ['explore_mode'];
    enterSceneFreeExplorationHub('explore_mode');

    expect(closeNarrativeOverlay).toHaveBeenCalled();
    vi.advanceTimersByTime(480);
    expect(eventBusEmit).not.toHaveBeenCalledWith(
      'game:notification',
      expect.anything(),
    );
    expect(eventBusEmit).toHaveBeenCalledWith('ui:exploration_message', {
      text: expect.stringContaining('Комната'),
    });
  });

  it('supports home_evening closed-overlay hub', () => {
    enterSceneFreeExplorationHub('home_evening_explore_mode');

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/setCurrentNodeId',
      nodeId: 'home_evening_explore_mode',
    });
    expect(closeNarrativeOverlay).toHaveBeenCalled();
    vi.advanceTimersByTime(480);
    expect(eventBusEmit).toHaveBeenCalledWith(
      'game:notification',
      expect.objectContaining({
        type: 'scene',
        subtitle: expect.stringContaining('кухня'),
      }),
    );
  });

  it('supports Act II closed-overlay hubs', () => {
    enterSceneFreeExplorationHub('cafe_explore_mode');

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/setCurrentNodeId',
      nodeId: 'cafe_explore_mode',
    });
    expect(closeNarrativeOverlay).toHaveBeenCalled();
    vi.advanceTimersByTime(480);
    expect(eventBusEmit).toHaveBeenCalledWith(
      'game:notification',
      expect.objectContaining({
        type: 'scene',
        subtitle: expect.stringContaining('Синяя яма'),
      }),
    );
  });

  it('supports Act III closed-overlay hubs', () => {
    enterSceneFreeExplorationHub('park_explore_mode');

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'story/setCurrentNodeId',
      nodeId: 'park_explore_mode',
    });
    expect(closeNarrativeOverlay).toHaveBeenCalled();
    vi.advanceTimersByTime(480);
    expect(eventBusEmit).toHaveBeenCalledWith(
      'game:notification',
      expect.objectContaining({
        type: 'scene',
        subtitle: expect.stringContaining('Парк'),
      }),
    );
  });

  it('ignores unknown hub ids', () => {
    enterSceneFreeExplorationHub('not_a_real_hub');
    expect(dispatchGameAction).not.toHaveBeenCalled();
    expect(closeNarrativeOverlay).not.toHaveBeenCalled();
  });
});
