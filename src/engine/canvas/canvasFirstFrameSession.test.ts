import { describe, expect, it, beforeEach } from 'vitest';
import {
  claimCanvasFirstFrameEmit,
  getCanvasFirstFrameGeneration,
  invalidateCanvasFirstFrame,
  isCanvasFirstFramePending,
  registerCanvasForFirstFrame,
  resetCanvasFirstFrameSessionForTests,
} from './canvasFirstFrameSession';

describe('canvasFirstFrameSession', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    resetCanvasFirstFrameSessionForTests();
    canvas = {} as HTMLCanvasElement;
    registerCanvasForFirstFrame(canvas);
  });

  it('claimCanvasFirstFrameEmit is atomic — second claim returns null', () => {
    invalidateCanvasFirstFrame();
    expect(isCanvasFirstFramePending()).toBe(true);

    const gen = claimCanvasFirstFrameEmit(canvas);
    expect(gen).toBe(getCanvasFirstFrameGeneration());
    expect(isCanvasFirstFramePending()).toBe(false);
    expect(claimCanvasFirstFrameEmit(canvas)).toBeNull();
  });

  it('invalidate bumps generation and reopens latch', () => {
    const gen1 = invalidateCanvasFirstFrame();
    expect(claimCanvasFirstFrameEmit(canvas)).toBe(gen1);

    const gen2 = invalidateCanvasFirstFrame();
    expect(gen2).toBeGreaterThan(gen1);
    expect(isCanvasFirstFramePending()).toBe(true);
    expect(claimCanvasFirstFrameEmit(canvas)).toBe(gen2);
  });

  it('stale generation after invalidate cannot reuse old latch', () => {
    const gen1 = invalidateCanvasFirstFrame();
    claimCanvasFirstFrameEmit(canvas);

    const gen2 = invalidateCanvasFirstFrame();
    expect(gen2).not.toBe(gen1);
    expect(claimCanvasFirstFrameEmit(canvas)).toBe(gen2);
  });
});
