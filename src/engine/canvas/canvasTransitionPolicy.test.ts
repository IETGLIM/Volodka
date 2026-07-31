import { describe, expect, it } from 'vitest';
import {
  CANVAS_COMPOSITE_MODES,
  CANVAS_GAMEPLAY_MODES,
  modeSwitchNeedsFreshCanvasFrame,
  modeSwitchShowsCanvasOverlay,
} from './canvasTransitionPolicy';

describe('canvasTransitionPolicy', () => {
  it('keeps menu out of composite modes so the warm canvas stays CSS-hidden', () => {
    expect(CANVAS_COMPOSITE_MODES.has('menu')).toBe(false);
    for (const mode of ['exploration', 'cutscene', 'combat', 'intro'] as const) {
      expect(CANVAS_COMPOSITE_MODES.has(mode)).toBe(true);
    }
    expect(CANVAS_GAMEPLAY_MODES.has('intro')).toBe(false);
  });

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
