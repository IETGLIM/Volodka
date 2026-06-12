import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  isNarrativeMovementLocked,
  syncNarrativeOnSceneEnter,
} from './exploreHubNodes';
import { resolveExploreHubNavigation } from './sceneExploreHubRegistry';

const dispatchGameAction = vi.fn();

let mockSnapshot = {
  showStoryOverlay: true,
};

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => mockSnapshot,
  dispatchGameAction: (...args: unknown[]) => dispatchGameAction(...args),
}));

vi.mock('@/engine/guidedStory/createGuidedStoryDeps', () => ({
  getStoryNodeSceneId: (nodeId: string) => {
    const map: Record<string, string> = {
      corridor_door: 'volodka_corridor',
      kitchen_table: 'home_evening',
      cafe_barista: 'cafe_evening',
    };
    return map[nodeId];
  },
}));

describe('exploreHubNodes', () => {
  beforeEach(() => {
    dispatchGameAction.mockClear();
    mockSnapshot = {
      showStoryOverlay: true,
    };
  });

  it('locks movement on non-hub overlay nodes', () => {
    expect(isNarrativeMovementLocked(true, 'corridor_door')).toBe(true);
    expect(isNarrativeMovementLocked(true, 'corridor_explore_mode')).toBe(false);
    expect(isNarrativeMovementLocked(true, 'cafe_explore_mode')).toBe(false);
  });

  it('closes narrative overlay on physical scene enter', () => {
    syncNarrativeOnSceneEnter('volodka_corridor');
    expect(dispatchGameAction).toHaveBeenCalledWith({ type: 'story/closeNarrativeOverlay' });
  });

  it('does nothing when overlay is already closed', () => {
    mockSnapshot.showStoryOverlay = false;
    syncNarrativeOnSceneEnter('home_evening');
    expect(dispatchGameAction).not.toHaveBeenCalled();
  });
});

describe('resolveExploreHubNavigation', () => {
  it('remaps legacy explore_mode from cafe to cafe_explore_mode', () => {
    const result = resolveExploreHubNavigation('cafe_barista', 'cafe_evening', 'explore_mode');
    expect(result).toEqual({ action: 'navigate', hubId: 'cafe_explore_mode' });
  });

  it('keeps volodka room explore_mode', () => {
    const result = resolveExploreHubNavigation('room_table', 'volodka_room', 'explore_mode');
    expect(result).toEqual({ action: 'navigate', hubId: 'explore_mode' });
  });
});
