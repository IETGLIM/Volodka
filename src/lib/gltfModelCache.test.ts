import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const clear = vi.fn();

vi.mock('@react-three/drei', () => ({
  useGLTF: Object.assign(() => ({}), {
    clear: (url: string) => clear(url),
    preload: vi.fn(),
    setDecoderPath: vi.fn(),
  }),
}));

import {
  retainGltfModelUrl,
  releaseGltfModelUrl,
  touchGltfModelUrl,
  __resetGltfModelCacheTestState,
  __getGltfModelCacheTestState,
} from './gltfModelCache';

describe('gltfModelCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clear.mockClear();
    __resetGltfModelCacheTestState();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears drei cache when last release drops refCount to zero (before LRU pressure)', () => {
    const state = __getGltfModelCacheTestState();
    const max = state.maxUrls ?? 14;
    for (let i = 0; i < max; i++) {
      retainGltfModelUrl(`/models/cache-${i}.glb`);
    }
    retainGltfModelUrl('/models/overflow.glb');
    expect(clear).not.toHaveBeenCalled();

    releaseGltfModelUrl('/models/cache-0.glb');
    expect(clear).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2500);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledWith('/models/cache-0.glb');

    retainGltfModelUrl('/models/newest.glb');
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('balances retain/release per URL', () => {
    retainGltfModelUrl('/models/a.glb');
    retainGltfModelUrl('/models/a.glb');
    releaseGltfModelUrl('/models/a.glb');
    expect(__getGltfModelCacheTestState().refCount.get('/models/a.glb')).toBe(1);
    releaseGltfModelUrl('/models/a.glb');
    expect(__getGltfModelCacheTestState().refCount.get('/models/a.glb')).toBeUndefined();
    vi.advanceTimersByTime(2500);
  });

  it('ignores duplicate release after ref already zero (single deferred clear)', () => {
    retainGltfModelUrl('/models/dup-release.glb');
    releaseGltfModelUrl('/models/dup-release.glb');
    releaseGltfModelUrl('/models/dup-release.glb');
    releaseGltfModelUrl('/models/dup-release.glb');
    expect(clear).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2500);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledWith('/models/dup-release.glb');
  });

  it('cancels deferred drei clear when same URL is retained within grace window', () => {
    retainGltfModelUrl('/models/bounce.glb');
    releaseGltfModelUrl('/models/bounce.glb');
    expect(clear).not.toHaveBeenCalled();
    retainGltfModelUrl('/models/bounce.glb');
    vi.advanceTimersByTime(2500);
    expect(clear).not.toHaveBeenCalled();
    releaseGltfModelUrl('/models/bounce.glb');
    vi.advanceTimersByTime(2500);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledWith('/models/bounce.glb');
  });

  it('touchGltfModelUrl moves retained URL toward MRU without changing refCount', () => {
    retainGltfModelUrl('/models/old.glb');
    retainGltfModelUrl('/models/new.glb');
    expect(__getGltfModelCacheTestState().accessOrder.at(-1)).toBe('/models/new.glb');

    touchGltfModelUrl('/models/old.glb');
    expect(__getGltfModelCacheTestState().refCount.get('/models/old.glb')).toBe(1);
    expect(__getGltfModelCacheTestState().accessOrder.at(-1)).toBe('/models/old.glb');
  });

  it('touchGltfModelUrl is no-op without retain', () => {
    touchGltfModelUrl('/models/ghost.glb');
    expect(__getGltfModelCacheTestState().accessOrder).toHaveLength(0);
  });

  it('reported totalBytes matches accessOrder only (no orphan estimated keys after retains)', () => {
    retainGltfModelUrl('/models/sync-a.glb');
    retainGltfModelUrl('/models/sync-b.glb');
    const st = __getGltfModelCacheTestState();
    for (const k of Object.keys(st.estimatedBytes)) {
      expect(st.accessOrder).toContain(k);
    }
    expect(st.totalBytes).toBe(
      (st.estimatedBytes['/models/sync-a.glb'] ?? 500_000) +
        (st.estimatedBytes['/models/sync-b.glb'] ?? 500_000),
    );
  });
});
