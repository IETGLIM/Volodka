import { describe, expect, it, vi, beforeEach } from 'vitest';
import { presentNarrativeBeat } from './presentNarrativeBeat';

const openNarrativeOverlay = vi.fn();
const openDiegeticNarrative = vi.fn();
const enterSceneFreeExplorationHub = vi.fn();

vi.mock('@/engine/scene/narrativeOverlay', () => ({
  openNarrativeOverlay: (...args: unknown[]) => openNarrativeOverlay(...args),
  openDiegeticNarrative: (...args: unknown[]) => openDiegeticNarrative(...args),
}));

vi.mock('@/engine/scene/freeExplorationHub', () => ({
  enterSceneFreeExplorationHub: (...args: unknown[]) => enterSceneFreeExplorationHub(...args),
}));

describe('presentNarrativeBeat', () => {
  beforeEach(() => {
    openNarrativeOverlay.mockClear();
    openDiegeticNarrative.mockClear();
    enterSceneFreeExplorationHub.mockClear();
  });

  it('routes Act 1 explore hubs to enterSceneFreeExplorationHub', () => {
    presentNarrativeBeat('explore_mode', 'story');
    expect(enterSceneFreeExplorationHub).toHaveBeenCalledWith('explore_mode');
    expect(openDiegeticNarrative).not.toHaveBeenCalled();
    expect(openNarrativeOverlay).not.toHaveBeenCalled();
  });

  it('routes Act 1 story beats to diegetic HUD', () => {
    presentNarrativeBeat('room_table', 'story');
    expect(openDiegeticNarrative).toHaveBeenCalledWith('room_table', 'story');
    expect(openNarrativeOverlay).not.toHaveBeenCalled();
  });

  it('routes Act 1 exploration dialogues to diegetic HUD', () => {
    presentNarrativeBeat('explore_room_table', 'dialogue');
    expect(openDiegeticNarrative).toHaveBeenCalledWith('explore_room_table', 'dialogue');
  });

  it('routes Act 2 nodes to legacy overlay', () => {
    presentNarrativeBeat('act2_transition', 'story');
    expect(openNarrativeOverlay).toHaveBeenCalledWith('act2_transition', 'story');
    expect(openDiegeticNarrative).not.toHaveBeenCalled();
  });
});
