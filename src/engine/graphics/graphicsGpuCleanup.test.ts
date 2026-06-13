import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import {
  dispatchQualityGpuCleanup,
} from '@/engine/graphics/graphicsSettingsStorage';
import {
  evictQualityDependentGpuCache,
  registerQualityGpuCleanupListener,
  resetQualityGpuCleanupListenerForTests,
} from '@/engine/graphics/graphicsGpuCleanup';
import {
  clearCanvasTextureCacheForTests,
  getCachedCanvasTexture,
} from '@/engine/three/cachedCanvasTexture';

vi.mock('@react-three/drei', () => ({
  useGLTF: {
    clear: vi.fn(),
  },
}));

describe('graphicsGpuCleanup', () => {
  beforeEach(() => {
    resetQualityGpuCleanupListenerForTests();
    vi.mocked(useGLTF.clear).mockClear();
  });

  afterEach(() => {
    clearCanvasTextureCacheForTests();
    resetQualityGpuCleanupListenerForTests();
  });

  it('evicts GLTF loader cache and module texture pools', () => {
    const dispose = vi.fn();
    getCachedCanvasTexture('test:floor', () => ({ dispose } as unknown as THREE.CanvasTexture));

    evictQualityDependentGpuCache();

    expect(useGLTF.clear).toHaveBeenCalled();
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it('registerQualityGpuCleanupListener reacts to dispatchQualityGpuCleanup', () => {
    const listeners = new Map<string, Set<EventListener>>();
    vi.stubGlobal('window', {
      addEventListener(type: string, listener: EventListener) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type)!.add(listener);
      },
      removeEventListener(type: string, listener: EventListener) {
        listeners.get(type)?.delete(listener);
      },
      dispatchEvent(event: Event) {
        for (const listener of listeners.get(event.type) ?? []) {
          listener(event);
        }
        return true;
      },
    });

    registerQualityGpuCleanupListener();
    dispatchQualityGpuCleanup('low');

    expect(useGLTF.clear).toHaveBeenCalled();
  });
});
