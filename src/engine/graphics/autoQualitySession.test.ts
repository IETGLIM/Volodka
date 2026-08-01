import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAllSessionQualityOverrides,
  getSessionAutoResolvedTier,
  setSessionAutoResolvedTier,
} from './autoQualitySession';

describe('autoQualitySession (in-memory only)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    clearAllSessionQualityOverrides();
  });

  afterEach(() => {
    clearAllSessionQualityOverrides();
    vi.unstubAllGlobals();
  });

  it('holds session tier without persisting to localStorage', () => {
    setSessionAutoResolvedTier('medium');
    expect(getSessionAutoResolvedTier()).toBe('medium');
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it('clears session tier', () => {
    setSessionAutoResolvedTier('high');
    clearAllSessionQualityOverrides();
    expect(getSessionAutoResolvedTier()).toBeNull();
  });
});
