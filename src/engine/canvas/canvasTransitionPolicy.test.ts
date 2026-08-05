import { describe, expect, it } from 'vitest';
import {
  CANVAS_COMPOSITE_MODES,
  CANVAS_GAMEPLAY_MODES,
} from './canvasTransitionPolicy';

describe('canvasTransitionPolicy', () => {
  it('classifies the expected canvas modes', () => {
    expect(CANVAS_COMPOSITE_MODES.has('exploration')).toBe(true);
    expect(CANVAS_COMPOSITE_MODES.has('intro')).toBe(false);
    expect(CANVAS_GAMEPLAY_MODES.has('intro')).toBe(false);
  });

  it('gameplay modes are a subset of composite modes', () => {
    for (const mode of CANVAS_GAMEPLAY_MODES) {
      expect(CANVAS_COMPOSITE_MODES.has(mode)).toBe(true);
    }
  });
});
