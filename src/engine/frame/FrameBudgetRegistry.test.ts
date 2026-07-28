import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FRAME_BUDGET_MS,
  getLastSkippedTickCount,
  registerFrameTick,
  resetFrameBudgetRegistryForTests,
  runFrameBudget,
  runPostFrameBudget,
  unregisterFrameTick,
} from './FrameBudgetRegistry';
import type { FrameTickContext } from './types';

function fakeCtx(): FrameTickContext {
  return { state: {} as FrameTickContext['state'], delta: 1 / 60 };
}

describe('FrameBudgetRegistry soft-skip', () => {
  let now = 0;

  beforeEach(() => {
    resetFrameBudgetRegistryForTests();
    now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetFrameBudgetRegistryForTests();
  });

  /** Advance simulated clock inside a tick so elapsed contributes to the budget. */
  function burn(ms: number): () => void {
    return () => {
      now += ms;
    };
  }

  it('runs all ticks when under budget', () => {
    const order: string[] = [];
    registerFrameTick('player', () => order.push('player'), { label: 'p' });
    registerFrameTick('weather', () => order.push('weather'), { label: 'w' });
    registerFrameTick('misc', () => order.push('misc'), { label: 'm' });

    runFrameBudget(fakeCtx());

    expect(order).toEqual(['player', 'weather', 'misc']);
    expect(getLastSkippedTickCount()).toBe(0);
  });

  it('skips non-critical ticks after cumulative work exceeds FRAME_BUDGET_MS', () => {
    const order: string[] = [];
    // Critical work alone exceeds the 16.67ms budget.
    registerFrameTick('player', () => {
      order.push('player');
      now += FRAME_BUDGET_MS + 1;
    }, { label: 'physics' });
    registerFrameTick('weather', () => order.push('weather'), { label: 'rain' });
    registerFrameTick('postfx', () => order.push('postfx'), { label: 'godrays' });
    registerFrameTick('misc', () => order.push('misc'), { label: 'props' });

    runFrameBudget(fakeCtx());

    expect(order).toEqual(['player']);
    expect(getLastSkippedTickCount()).toBe(3);
  });

  it('always runs later critical ticks even when already over budget', () => {
    const order: string[] = [];
    registerFrameTick('interaction', burn(FRAME_BUDGET_MS + 1), { label: 'input' });
    registerFrameTick('player', () => order.push('player'), { label: 'physics' });
    registerFrameTick('npc', () => order.push('npc'), { label: 'ai' });
    registerFrameTick('camera', () => order.push('camera'), { label: 'follow' });
    registerFrameTick('weather', () => order.push('weather'), { label: 'fx' });

    runFrameBudget(fakeCtx());

    expect(order).toEqual(['player', 'npc', 'camera']);
    expect(getLastSkippedTickCount()).toBe(1);
  });

  it('respects critical: true override on a normally skippable system', () => {
    const order: string[] = [];
    registerFrameTick('player', burn(FRAME_BUDGET_MS + 1), { label: 'physics' });
    registerFrameTick('weather', () => order.push('weather-critical'), {
      label: 'must-run',
      critical: true,
    });
    registerFrameTick('misc', () => order.push('misc'), { label: 'skip-me' });

    runFrameBudget(fakeCtx());

    expect(order).toEqual(['weather-critical']);
    expect(getLastSkippedTickCount()).toBe(1);
  });

  it('respects critical: false override on a normally critical system', () => {
    const order: string[] = [];
    registerFrameTick('interaction', burn(FRAME_BUDGET_MS + 1), { label: 'input' });
    registerFrameTick('player', () => order.push('player-soft'), {
      label: 'cosmetic-anim',
      critical: false,
    });
    registerFrameTick('camera', () => order.push('camera'), { label: 'follow' });

    runFrameBudget(fakeCtx());

    expect(order).toEqual(['camera']);
    expect(getLastSkippedTickCount()).toBe(1);
  });

  it('never soft-skips post-render ticks', () => {
    const order: string[] = [];
    registerFrameTick('player', burn(FRAME_BUDGET_MS + 1), { label: 'physics' });
    registerFrameTick('misc', () => order.push('post-misc'), {
      label: 'guard',
      phase: 'post',
    });

    runFrameBudget(fakeCtx());
    expect(getLastSkippedTickCount()).toBe(0);

    runPostFrameBudget(fakeCtx());
    expect(order).toEqual(['post-misc']);
  });

  it('unregister removes ticks from subsequent frames', () => {
    const fn = vi.fn();
    const id = registerFrameTick('misc', fn, { label: 'tmp' });
    unregisterFrameTick(id);
    runFrameBudget(fakeCtx());
    expect(fn).not.toHaveBeenCalled();
  });
});
