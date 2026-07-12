import { describe, it, expect, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import {
  clearCanvasTextureCacheForTests,
  getCachedCanvasTexture,
  releaseCachedCanvasTexture,
} from './cachedCanvasTexture';

describe('cachedCanvasTexture', () => {
  afterEach(() => {
    clearCanvasTextureCacheForTests();
  });

  function makeCanvasTexture() {
    const canvas = { width: 1, height: 1 } as unknown as HTMLCanvasElement;
    return new THREE.CanvasTexture(canvas);
  }

  it('reuses the same texture for the same key', () => {
    const factory = vi.fn(makeCanvasTexture);
    const a = getCachedCanvasTexture('test:floor', factory);
    const b = getCachedCanvasTexture('test:floor', factory);
    expect(a).toBe(b);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('disposes after last release', () => {
    const tex = makeCanvasTexture();
    vi.spyOn(tex, 'dispose');
    getCachedCanvasTexture('test:wall', () => tex);
    getCachedCanvasTexture('test:wall', () => tex);
    releaseCachedCanvasTexture('test:wall');
    releaseCachedCanvasTexture('test:wall');
    expect(tex.dispose).toHaveBeenCalledTimes(1);
  });
});
