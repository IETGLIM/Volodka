import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  isNarrativeMovementLocked,
  syncNarrativeOnSceneEnter,
} from './exploreHubNodes';
import { resolveExploreHubNavigation } from './sceneExploreHubRegistry';

const openNarrativeOverlay = vi.fn();
const closeNarrativeOverlay = vi.fn();

let mockStore = {
  showStoryOverlay: true,
  currentNodeId: 'corridor_door',
  narrativeKind: 'story' as const,
  openNarrativeOverlay,
  closeNarrativeOverlay,
};

vi.mock('@/store/gameStore', () => ({
  getGameStore: () => mockStore,
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
    openNarrativeOverlay.mockClear();
    closeNarrativeOverlay.mockClear();
    mockStore = {
      showStoryOverlay: true,
      currentNodeId: 'corridor_door',
      narrativeKind: 'story',
      openNarrativeOverlay,
      closeNarrativeOverlay,
    };
  });

  it('locks movement on non-hub overlay nodes', () => {
    expect(isNarrativeMovementLocked(true, 'corridor_door')).toBe(true);
    expect(isNarrativeMovementLocked(true, 'corridor_explore_mode')).toBe(false);
    expect(isNarrativeMovementLocked(true, 'cafe_explore_mode')).toBe(false);
  });

  it('closes narrative overlay on physical scene enter', () => {
    syncNarrativeOnSceneEnter('volodka_corridor');
    expect(closeNarrativeOverlay).toHaveBeenCalled();
    expect(openNarrativeOverlay).not.toHaveBeenCalled();
  });

  it('does nothing when overlay is already closed', () => {
    mockStore.showStoryOverlay = false;
    syncNarrativeOnSceneEnter('home_evening');
    expect(closeNarrativeOverlay).not.toHaveBeenCalled();
    expect(openNarrativeOverlay).not.toHaveBeenCalled();
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
