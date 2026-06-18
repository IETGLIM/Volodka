import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GltfPreloadPriority,
  resetGltfPreloadSchedulerForTests,
  scheduleGltfPreload,
} from './gltfPreloadScheduler';

describe('gltfPreloadScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetGltfPreloadSchedulerForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetGltfPreloadSchedulerForTests();
  });

  it('runs one preload per idle slice in priority order', () => {
    const order: string[] = [];

    scheduleGltfPreload('b.glb', () => order.push('b'), GltfPreloadPriority.Normal);
    scheduleGltfPreload('a.glb', () => order.push('a'), GltfPreloadPriority.Critical);
    scheduleGltfPreload('c.glb', () => order.push('c'), GltfPreloadPriority.Low);

    vi.runOnlyPendingTimers();
    expect(order).toEqual(['a']);

    vi.runOnlyPendingTimers();
    expect(order).toEqual(['a', 'b']);

    vi.runOnlyPendingTimers();
    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('coalesces duplicate URLs to the highest priority runner', () => {
    const runs: string[] = [];

    scheduleGltfPreload('x.glb', () => runs.push('low'), GltfPreloadPriority.Low);
    scheduleGltfPreload('x.glb', () => runs.push('critical'), GltfPreloadPriority.Critical);

    vi.runOnlyPendingTimers();
    expect(runs).toEqual(['critical']);
  });
});
