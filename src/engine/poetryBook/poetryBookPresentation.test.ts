import { describe, expect, it } from 'vitest';
import {
  getCooldownProgress,
  getPoemThemeClass,
  resolvePoemThemeLabel,
} from '@/engine/poetryBook/poetryBookPresentation';

describe('poetryBookPresentation', () => {
  it('resolves theme labels and classes', () => {
    expect(resolvePoemThemeLabel('любовь')).toBe('любовь');
    expect(resolvePoemThemeLabel('unknown')).toBe('unknown');
    expect(getPoemThemeClass('любовь')).toContain('rose');
  });

  it('computes cooldown progress', () => {
    expect(getCooldownProgress(3000, 6000)).toBe(50);
    expect(getCooldownProgress(0, 0)).toBe(0);
  });
});
