import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { degradeQualityPresetOneTier } from './adaptiveQualityDegrade';
import { GRAPHICS_SETTINGS_KEY } from './qualityPresets';

function mockLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
  };
}

describe('degradeQualityPresetOneTier', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage());
    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('steps auto down to medium', () => {
    localStorage.setItem(GRAPHICS_SETTINGS_KEY, 'auto');
    expect(degradeQualityPresetOneTier()).toBe('medium');
    expect(localStorage.getItem(GRAPHICS_SETTINGS_KEY)).toBe('medium');
  });

  it('steps ultra down to high', () => {
    localStorage.setItem(GRAPHICS_SETTINGS_KEY, 'ultra');
    expect(degradeQualityPresetOneTier()).toBe('high');
  });

  it('returns null at low floor', () => {
    localStorage.setItem(GRAPHICS_SETTINGS_KEY, 'low');
    expect(degradeQualityPresetOneTier()).toBeNull();
  });
});
