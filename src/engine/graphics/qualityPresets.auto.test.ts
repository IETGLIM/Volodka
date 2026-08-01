import { describe, expect, it, vi } from 'vitest';
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
    // PIXEL_BUDGET_HIGH_MAX is now 12M (was 8M) — 9M is under the threshold.
    // 13M should trigger the cap.
    expect(capQualityTierForPixelBudget('high', 13_000_000)).toBe('medium');
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
  it('keeps lite PostFX on desktop High under critical pressure', () => {
    const degraded = applyGfxPressureToPreset(QUALITY_PRESETS.high, 'critical');
    expect(degraded.postProcessing).toBe(true);
    expect(degraded.shadows).toBe(true);
    expect(degraded.effectsScale).toBeLessThan(QUALITY_PRESETS.high.effectsScale);
    expect(degraded.effectsScale).toBeGreaterThanOrEqual(0.45);
  });

  it('disables post-processing under critical pressure on medium', () => {
    const degraded = applyGfxPressureToPreset(QUALITY_PRESETS.medium, 'critical');
    expect(degraded.postProcessing).toBe(false);
    expect(degraded.effectsScale).toBeLessThan(QUALITY_PRESETS.medium.effectsScale);
  });

  it('reduces effects scale under memory pressure', () => {
    const degraded = applyGfxPressureToPreset(QUALITY_PRESETS.medium, 'memory');
    expect(degraded.postProcessing).toBe(true);
    expect(degraded.effectsScale).toBeCloseTo(QUALITY_PRESETS.medium.effectsScale * 0.75);
  });

  it('forces contact-only on medium + coarse pointer under memory pressure', () => {
    vi.stubGlobal('window', {
      matchMedia: (query: string) => ({
        matches: query.includes('pointer: coarse'),
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });

    const degraded = applyGfxPressureToPreset(QUALITY_PRESETS.medium, 'memory');
    expect(degraded.postProcessing).toBe(false);
    expect(degraded.shadows).toBe(false);

    vi.unstubAllGlobals();
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
