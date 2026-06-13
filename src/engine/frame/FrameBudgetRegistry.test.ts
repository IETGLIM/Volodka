import { describe, it, expect, afterEach, vi } from 'vitest';
import type { RootState } from '@react-three/fiber';
import {
  getCurrentFrameTopTickTimings,
  getRegisteredTickCount,
  getTopTickTimings,
  registerFrameTick,
  runFrameBudget,
  runFrameBudgetForPhase,
  runPostFrameBudget,
  setFrameBudgetProfilingArmed,
  unregisterFrameTick,
} from './FrameBudgetRegistry';
import { DEFAULT_FRAME_GAME_SNAPSHOT } from './frameGameSnapshot';

const frameCtx = { state: {} as RootState, delta: 1 / 60, game: DEFAULT_FRAME_GAME_SNAPSHOT };

describe('FrameBudgetRegistry', () => {
  const registeredIds: number[] = [];

  afterEach(() => {
    while (registeredIds.length > 0) {
      unregisterFrameTick(registeredIds.pop()!);
    }
    vi.restoreAllMocks();
    setFrameBudgetProfilingArmed(true);
    runFrameBudget(frameCtx);
    runPostFrameBudget(frameCtx);
    setFrameBudgetProfilingArmed(false);
  });

  it('unregisterFrameTick removes tick before next runFrameBudget', () => {
    setFrameBudgetProfilingArmed(true);
    const calls: number[] = [];
    const id = registerFrameTick('player', () => {
      calls.push(1);
    }, { label: 'test-player' });
    registeredIds.push(id);

    runFrameBudget(frameCtx);
    expect(calls).toHaveLength(1);

    unregisterFrameTick(id);
    registeredIds.pop();
    runFrameBudget(frameCtx);
    expect(calls).toHaveLength(1);
    expect(getRegisteredTickCount()).toBe(0);
  });

  it('disabled ticks are skipped without unregistering', () => {
    setFrameBudgetProfilingArmed(true);
    const calls: number[] = [];
    const id = registerFrameTick('player', () => {
      calls.push(1);
    }, { label: 'disabled-player', enabled: false });
    registeredIds.push(id);

    runFrameBudget(frameCtx);
    expect(calls).toHaveLength(0);
    expect(getRegisteredTickCount()).toBe(1);
  });

  it('caps tickCpuMs growth when many unique ticks run in one frame', () => {
    setFrameBudgetProfilingArmed(true);
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);

    for (let i = 0; i < 140; i++) {
      const tickIndex = i;
      const id = registerFrameTick(
        'misc',
        () => {
          now += tickIndex + 1;
        },
        { label: `dynamic-${i}`, priority: i },
      );
      registeredIds.push(id);
    }

    runFrameBudget(frameCtx);
    runPostFrameBudget(frameCtx);

    expect(getCurrentFrameTopTickTimings(140)).toHaveLength(128);
    expect(getTopTickTimings(140)).toHaveLength(128);
  });

  it('getTopTickTimings returns last completed frame snapshot', () => {
    setFrameBudgetProfilingArmed(true);
    const id = registerFrameTick('player', () => {}, { label: 'snapshot-player' });
    registeredIds.push(id);

    expect(getTopTickTimings()).toEqual([]);

    runFrameBudget(frameCtx);
    expect(getTopTickTimings()).toEqual([]);

    runPostFrameBudget(frameCtx);
    const snapshot = getTopTickTimings(8);
    expect(snapshot.some((entry) => entry.label === 'snapshot-player')).toBe(true);

    unregisterFrameTick(id);
    registeredIds.pop();
    runFrameBudget(frameCtx);
    runPostFrameBudget(frameCtx);
    expect(getTopTickTimings().some((entry) => entry.label === 'snapshot-player')).toBe(false);
  });

  it('runFrameBudgetForPhase runs only ticks registered for that phase', () => {
    const order: string[] = [];
    const preId = registerFrameTick(
      'player',
      () => {
        order.push('pre');
      },
      { label: 'pre', phase: 'pre' },
    );
    const postId = registerFrameTick(
      'camera',
      () => {
        order.push('post');
      },
      { label: 'post', phase: 'post' },
    );
    registeredIds.push(preId, postId);

    runFrameBudgetForPhase(frameCtx, 'pre');
    expect(order).toEqual(['pre']);

    runFrameBudgetForPhase(frameCtx, 'post');
    expect(order).toEqual(['pre', 'post']);
  });
});
