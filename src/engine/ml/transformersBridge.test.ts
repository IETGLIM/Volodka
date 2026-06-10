import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isAiFeaturesEnabled,
  isMlEngineStub,
  loadMlEngine,
  setAiFeaturesEnabled,
} from './transformersBridge';

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

describe('transformersBridge', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock());
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('AI features are disabled by default', () => {
    expect(isAiFeaturesEnabled()).toBe(false);
  });

  it('loadMlEngine returns null when opt-in is off', async () => {
    await expect(loadMlEngine()).resolves.toBeNull();
  });

  it('loadMlEngine returns null in test mode even when opt-in is on', async () => {
    setAiFeaturesEnabled(true);
    await expect(loadMlEngine()).resolves.toBeNull();
  });

  it('reports stub state in test/CI skip environments', () => {
    expect(isMlEngineStub()).toBe(true);
  });
});
