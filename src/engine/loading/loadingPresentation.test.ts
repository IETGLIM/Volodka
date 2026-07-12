import { describe, expect, it } from 'vitest';
import {
  clampLoadingProgress,
  formatLoadingStatusText,
  formatPercentRu,
  pickDeterministicIndex,
} from '@/engine/loading/loadingPresentation';
import { getLoadingScreenFx } from '@/engine/loading/loadingFxTier';

describe('loadingPresentation', () => {
  it('uses correct Russian plural forms for percents', () => {
    expect(formatPercentRu(1)).toBe('1 процент');
    expect(formatPercentRu(21)).toBe('21 процент');
    expect(formatPercentRu(2)).toBe('2 процента');
    expect(formatPercentRu(42)).toBe('42 процента');
    expect(formatPercentRu(5)).toBe('5 процентов');
  });

  it('formats loading status text with progress', () => {
    expect(formatLoadingStatusText('Загрузка', 42)).toBe('Загрузка, 42 процента');
  });

  it('clamps progress to 0-100', () => {
    expect(clampLoadingProgress(-5)).toBe(0);
    expect(clampLoadingProgress(150)).toBe(100);
    expect(clampLoadingProgress(undefined)).toBeUndefined();
  });

  it('picks deterministic index', () => {
    expect(pickDeterministicIndex(123, 13)).toBe(pickDeterministicIndex(123, 13));
  });
});

describe('loadingFxTier', () => {
  it('disables heavy fx on low tier', () => {
    const fx = getLoadingScreenFx('low', false, false);
    expect(fx.matrixRain).toBe(false);
    expect(fx.crtSweep).toBe(false);
  });

  it('disables all fx when loading animations disabled', () => {
    const fx = getLoadingScreenFx('high', false, true);
    expect(fx.matrixRain).toBe(false);
    expect(fx.contentMotion).toBe(false);
  });
});
