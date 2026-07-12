import { describe, expect, it } from 'vitest';
import {
  capQualityTierForGpuMemory,
  detectAutoQualityPreset,
} from './qualityPresets';

describe('detectAutoQualityPreset', () => {
  it('caps ultra to high on high-DPR mobile (iPhone 3x)', () => {
    expect(detectAutoQualityPreset(1920, 3)).toBe('medium');
  });

  it('caps to medium when device memory is low and DPR is high', () => {
    expect(capQualityTierForGpuMemory('ultra', 3, 4)).toBe('medium');
    expect(capQualityTierForGpuMemory('high', 2.5, 4)).toBe('medium');
  });

  it('returns low for very low device memory', () => {
    expect(capQualityTierForGpuMemory('ultra', 1, 2)).toBe('low');
  });

  it('keeps desktop tiers when memory and DPR are comfortable', () => {
    expect(detectAutoQualityPreset(1280, 2)).toBe('high');
    expect(capQualityTierForGpuMemory('ultra', 2, 8)).toBe('ultra');
  });
});
