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

  it('promotes corridor_door to corridor_explore_mode on corridor enter', () => {
    syncNarrativeOnSceneEnter('volodka_corridor');
    expect(openNarrativeOverlay).toHaveBeenCalledWith('corridor_explore_mode', 'story');
    expect(closeNarrativeOverlay).not.toHaveBeenCalled();
  });

  it('promotes beat nodes to scene hub when already in-scene', () => {
    mockStore.currentNodeId = 'kitchen_table';
    syncNarrativeOnSceneEnter('home_evening');
    expect(openNarrativeOverlay).toHaveBeenCalledWith('home_evening_explore_mode', 'story');
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
