import { describe, expect, it } from 'vitest';
import {
  QUALITY_PRESETS,
  applyGfxPressureToPreset,
  capQualityTierForGpuMemory,
  capQualityTierForPixelBudget,
  detectAutoQualityPreset,
  isPostProcessingEnabled,
  resetBatteryQualityCapForTests,
  setBatteryQualityCapForTests,
} from './qualityPresets';

describe('capQualityTierForPixelBudget', () => {
  it('caps ultra to medium on very large framebuffers', () => {
    expect(capQualityTierForPixelBudget('ultra', 25_000_000)).toBe('medium');
  });

  it('caps high when pixel budget exceeds high threshold', () => {
    expect(capQualityTierForPixelBudget('high', 9_000_000)).toBe('medium');
  });
});

describe('detectAutoQualityPreset iPhone-class', () => {
  it('starts low on narrow CSS viewport (390px)', () => {
    resetBatteryQualityCapForTests();
    expect(detectAutoQualityPreset(390, 3, 844)).toBe('low');
  });

  it('caps mistaken device-pixel width via pixel budget + DPR', () => {
    resetBatteryQualityCapForTests();
    expect(capQualityTierForGpuMemory('high', 3, 4)).toBe('medium');
    expect(detectAutoQualityPreset(1170, 3, 2532)).toBe('medium');
  });
});

describe('isPostProcessingEnabled', () => {
  it('blocks postfx on low preset even when user toggle is on', () => {
    expect(isPostProcessingEnabled(QUALITY_PRESETS.low, true)).toBe(false);
    expect(isPostProcessingEnabled(QUALITY_PRESETS.high, true)).toBe(true);
    expect(isPostProcessingEnabled(QUALITY_PRESETS.high, false)).toBe(false);
  });
});

describe('detectAutoQualityPreset battery cap', () => {
  it('clamps tier when battery cap is set', () => {
    resetBatteryQualityCapForTests();
    setBatteryQualityCapForTests('medium');
    expect(detectAutoQualityPreset(1600, 2)).toBe('medium');
    resetBatteryQualityCapForTests();
  });
});

describe('capQualityTierForGpuMemory', () => {
  it('caps ultra to medium on DPR 3x mobile', () => {
    expect(capQualityTierForGpuMemory('ultra', 3)).toBe('medium');
  });

  it('forces low on <=2 GB device memory', () => {
    expect(capQualityTierForGpuMemory('ultra', 1, 2)).toBe('low');
  });
});

describe('applyGfxPressureToPreset', () => {
  it('disables post-processing under critical pressure', () => {
    const degraded = applyGfxPressureToPreset(QUALITY_PRESETS.high, 'critical');
    expect(degraded.postProcessing).toBe(false);
    expect(degraded.effectsScale).toBeLessThan(QUALITY_PRESETS.high.effectsScale);
  });

  it('reduces effects scale under memory pressure', () => {
    const degraded = applyGfxPressureToPreset(QUALITY_PRESETS.medium, 'memory');
    expect(degraded.postProcessing).toBe(true);
    expect(degraded.effectsScale).toBeCloseTo(QUALITY_PRESETS.medium.effectsScale * 0.75);
  });

  it('leaves preset unchanged when pressure is none', () => {
    expect(applyGfxPressureToPreset(QUALITY_PRESETS.high, 'none')).toBe(QUALITY_PRESETS.high);
  });
});

describe('low preset post-processing', () => {
  it('ships with post-processing disabled', () => {
    expect(QUALITY_PRESETS.low.postProcessing).toBe(false);
  });
});
