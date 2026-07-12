import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { RootState } from '@react-three/fiber';
import {
  isFrameSimulationActive,
  isPageVisible,
  resetFrameVisibilityForTests,
  setFrameSimulationPaused,
} from '@/engine/frame/frameVisibility';
import {
  registerFrameTick,
  runFrameBudget,
  unregisterFrameTick,
} from '@/engine/frame/FrameBudgetRegistry';
import { DEFAULT_FRAME_GAME_SNAPSHOT } from '@/engine/frame/frameGameSnapshot';

const frameCtx = { state: {} as RootState, delta: 1 / 60, game: DEFAULT_FRAME_GAME_SNAPSHOT };

describe('frameVisibility', () => {
  beforeEach(() => {
    resetFrameVisibilityForTests();
  });

  afterEach(() => {
    resetFrameVisibilityForTests();
  });

  it('isFrameSimulationActive reflects page visibility and manual pause', () => {
    expect(isFrameSimulationActive()).toBe(true);

    setFrameSimulationPaused(true);
    expect(isFrameSimulationActive()).toBe(false);

    setFrameSimulationPaused(false);
    expect(isFrameSimulationActive()).toBe(true);
  });

  it('runFrameBudget skips ticks while simulation is paused', () => {
    const calls: number[] = [];
    const id = registerFrameTick('misc', () => {
      calls.push(1);
    }, { label: 'paused-test' });

    runFrameBudget(frameCtx);
    expect(calls).toHaveLength(1);

    setFrameSimulationPaused(true);
    runFrameBudget(frameCtx);
    expect(calls).toHaveLength(1);

    setFrameSimulationPaused(false);
    runFrameBudget(frameCtx);
    expect(calls).toHaveLength(2);

    unregisterFrameTick(id);
  });

  it('runFrameBudget skips ticks while document is hidden', () => {
    if (typeof document === 'undefined') return;

    const calls: number[] = [];
    const id = registerFrameTick('misc', () => {
      calls.push(1);
    }, { label: 'hidden-tab-test' });

    runFrameBudget(frameCtx);
    expect(calls).toHaveLength(1);

    const hiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden');
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(isPageVisible()).toBe(false);
    expect(isFrameSimulationActive()).toBe(false);

    runFrameBudget(frameCtx);
    expect(calls).toHaveLength(1);

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    runFrameBudget(frameCtx);
    expect(calls).toHaveLength(2);

    if (hiddenDescriptor) {
      Object.defineProperty(document, 'hidden', hiddenDescriptor);
    } else {
      delete (document as { hidden?: boolean }).hidden;
    }
    document.dispatchEvent(new Event('visibilitychange'));

    unregisterFrameTick(id);
  });

  it('isPageVisible tracks document.hidden when available', () => {
    expect(isPageVisible()).toBe(true);
  });
});
