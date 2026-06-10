import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getFeatureFlags,
  isWebgpuRendererEnabled,
  setWebgpuRendererEnabled,
} from './featureFlags';

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe('featureFlags', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock());
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('webgpuRenderer is false by default', () => {
    expect(isWebgpuRendererEnabled()).toBe(false);
    expect(getFeatureFlags().webgpuRenderer).toBe(false);
  });

  it('persists webgpu flag in localStorage', () => {
    setWebgpuRendererEnabled(true);
    expect(localStorage.getItem('volodka_webgpu')).toBe('1');
    expect(isWebgpuRendererEnabled()).toBe(true);
  });

  it('reads VITE_ENABLE_WEBGPU env override', () => {
    vi.stubEnv('VITE_ENABLE_WEBGPU', 'true');
    expect(isWebgpuRendererEnabled()).toBe(true);
  });
});
