import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSessionAutoResolvedTier } from './autoQualitySession';
import { degradeQualityPresetOneTier, upgradeQualityPresetOneTier } from './adaptiveQualityDegrade';
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
    clearSessionAutoResolvedTier();
    vi.unstubAllGlobals();
  });

  it('keeps auto selection and steps runtime tier down one level', () => {
    localStorage.setItem(GRAPHICS_SETTINGS_KEY, 'auto');
    vi.stubGlobal('window', {
      innerWidth: 1920,
      devicePixelRatio: 2,
      dispatchEvent: vi.fn(),
    });
    expect(degradeQualityPresetOneTier()).toBe('auto');
    expect(localStorage.getItem(GRAPHICS_SETTINGS_KEY)).toBe('auto');
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

describe('upgradeQualityPresetOneTier', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage());
    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    clearSessionAutoResolvedTier();
    vi.unstubAllGlobals();
  });

  it('steps low up to medium', () => {
    localStorage.setItem(GRAPHICS_SETTINGS_KEY, 'low');
    expect(upgradeQualityPresetOneTier()).toBe('medium');
  });

  it('returns null at ultra ceiling', () => {
    localStorage.setItem(GRAPHICS_SETTINGS_KEY, 'ultra');
    expect(upgradeQualityPresetOneTier()).toBeNull();
  });
});
