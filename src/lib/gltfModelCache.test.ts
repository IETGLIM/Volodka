import { describe, it, expect, vi, beforeEach } from 'vitest';

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
    clear.mockClear();
    __resetGltfModelCacheTestState();
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
});
