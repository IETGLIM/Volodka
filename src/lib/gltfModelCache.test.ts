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
  __resetGltfModelCacheTestState,
  __getGltfModelCacheTestState,
} from './gltfModelCache';

describe('gltfModelCache', () => {
  beforeEach(() => {
    clear.mockClear();
    __resetGltfModelCacheTestState();
  });

  it('evicts LRU path with zero refs when a new path is retained over the limit', () => {
    const { max } = __getGltfModelCacheTestState();
    for (let i = 0; i < max; i++) {
      retainGltfModelUrl(`/models/cache-${i}.glb`);
    }
    retainGltfModelUrl('/models/overflow.glb');
    expect(clear).not.toHaveBeenCalled();

    releaseGltfModelUrl('/models/cache-0.glb');
    retainGltfModelUrl('/models/newest.glb');

    expect(clear).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledWith('/models/cache-0.glb');
  });

  it('balances retain/release per URL', () => {
    retainGltfModelUrl('/models/a.glb');
    retainGltfModelUrl('/models/a.glb');
    releaseGltfModelUrl('/models/a.glb');
    expect(__getGltfModelCacheTestState().refCount.get('/models/a.glb')).toBe(1);
    releaseGltfModelUrl('/models/a.glb');
    expect(__getGltfModelCacheTestState().refCount.get('/models/a.glb')).toBeUndefined();
  });
});
