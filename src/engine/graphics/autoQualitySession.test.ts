import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearSessionAutoResolvedTier,
  getSessionAutoResolvedTier,
  setSessionAutoResolvedTier,
} from './autoQualitySession';

function mockLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
  };
}

describe('autoQualitySession persistence', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage());
    vi.stubGlobal('window', {});
    clearSessionAutoResolvedTier();
  });

  afterEach(() => {
    clearSessionAutoResolvedTier();
    vi.unstubAllGlobals();
  });

  it('survives module reload via localStorage', async () => {
    setSessionAutoResolvedTier('medium');
    expect(localStorage.getItem('volodka_auto_quality_session_tier')).toBe('medium');

    vi.resetModules();
    const reloaded = await import('./autoQualitySession');
    expect(reloaded.getSessionAutoResolvedTier()).toBe('medium');
  });

  it('clears persisted tier on clear', () => {
    setSessionAutoResolvedTier('high');
    clearSessionAutoResolvedTier();
    expect(getSessionAutoResolvedTier()).toBeNull();
    expect(localStorage.getItem('volodka_auto_quality_session_tier')).toBeNull();
  });
});
