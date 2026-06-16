import { describe, expect, it, beforeEach } from 'vitest';
import {
  claimCanvasFirstFrameEmit,
  getCanvasFirstFrameSession,
  markCanvasFirstFrameSessionLost,
  resetCanvasFirstFrameSessionForTests,
} from './canvasFirstFrameSession';

describe('canvasFirstFrameSession', () => {
  beforeEach(() => {
    resetCanvasFirstFrameSessionForTests();
  });

  function createTestCanvas(): HTMLCanvasElement {
    return {} as HTMLCanvasElement;
  }

  it('re-opens first-frame latch after WebGL context loss', () => {
    const canvas = createTestCanvas();
    markCanvasFirstFrameSessionLost(canvas);

    const session = getCanvasFirstFrameSession(canvas);
    expect(session.contextLost).toBe(true);
    expect(session.emitted).toBe(false);

    const generation = claimCanvasFirstFrameEmit(canvas);
    expect(generation).not.toBeNull();
    expect(getCanvasFirstFrameSession(canvas).contextLost).toBe(false);
    expect(getCanvasFirstFrameSession(canvas).emitted).toBe(true);
  });

  it('claimCanvasFirstFrameEmit returns null when latch already closed', () => {
    const canvas = createTestCanvas();
    expect(claimCanvasFirstFrameEmit(canvas)).not.toBeNull();
    expect(claimCanvasFirstFrameEmit(canvas)).toBeNull();
  });
});
