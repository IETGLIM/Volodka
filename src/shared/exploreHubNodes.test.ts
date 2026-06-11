import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  isNarrativeMovementLocked,
  syncNarrativeOnSceneEnter,
} from './exploreHubNodes';

const openNarrativeOverlay = vi.fn();
const closeNarrativeOverlay = vi.fn();

vi.mock('@/store/gameStore', () => ({
  getGameStore: () => ({
    showStoryOverlay: true,
    currentNodeId: 'corridor_door',
    narrativeKind: 'story',
    openNarrativeOverlay,
    closeNarrativeOverlay,
  }),
}));

vi.mock('@/engine/guidedStory/createGuidedStoryDeps', () => ({
  getStoryNodeSceneId: (nodeId: string) =>
    nodeId === 'corridor_door' ? 'volodka_corridor' : undefined,
}));

describe('exploreHubNodes', () => {
  beforeEach(() => {
    openNarrativeOverlay.mockClear();
    closeNarrativeOverlay.mockClear();
  });

  it('locks movement on non-hub overlay nodes', () => {
    expect(isNarrativeMovementLocked(true, 'corridor_door')).toBe(true);
    expect(isNarrativeMovementLocked(true, 'corridor_explore_mode')).toBe(false);
  });

  it('promotes corridor_door to corridor_explore_mode on corridor enter', () => {
    syncNarrativeOnSceneEnter('volodka_corridor');
    expect(openNarrativeOverlay).toHaveBeenCalledWith('corridor_explore_mode', 'story');
    expect(closeNarrativeOverlay).not.toHaveBeenCalled();
  });
});
