import { describe, expect, it } from 'vitest';
import {
  modeSwitchNeedsFreshCanvasFrame,
  modeSwitchShowsCanvasOverlay,
} from './canvasTransitionPolicy';

describe('canvasTransitionPolicy', () => {
  it('requires fresh frame when leaving menu', () => {
    expect(modeSwitchNeedsFreshCanvasFrame('menu', 'exploration')).toBe(true);
    expect(modeSwitchNeedsFreshCanvasFrame('menu', 'intro')).toBe(true);
  });

  it('requires fresh frame when intro completes into exploration', () => {
    expect(modeSwitchNeedsFreshCanvasFrame('intro', 'exploration')).toBe(true);
  });

  it('uses warm path between visible gameplay modes', () => {
    expect(modeSwitchNeedsFreshCanvasFrame('exploration', 'combat')).toBe(false);
    expect(modeSwitchNeedsFreshCanvasFrame('combat', 'exploration')).toBe(false);
    expect(modeSwitchNeedsFreshCanvasFrame('cutscene', 'exploration')).toBe(false);
  });

  it('shows overlay for gameplay entry from hidden canvas', () => {
    expect(modeSwitchShowsCanvasOverlay('menu', 'exploration')).toBe(true);
  });

  it('shows overlay for gameplay-to-gameplay switches without fresh frame', () => {
    expect(modeSwitchShowsCanvasOverlay('exploration', 'combat')).toBe(true);
  });
});
