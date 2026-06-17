import { describe, expect, it } from 'vitest';
import {
  computePhysicalPixelCount,
  isWeakMobileGpuRenderer,
} from './gpuQualityProbe';

describe('computePhysicalPixelCount', () => {
  it('multiplies CSS viewport by DPR squared', () => {
    expect(computePhysicalPixelCount(390, 844, 3)).toBe(390 * 844 * 9);
  });
});

describe('isWeakMobileGpuRenderer', () => {
  it('detects legacy Adreno parts', () => {
    expect(isWeakMobileGpuRenderer('adreno (tm) 505')).toBe(true);
    expect(isWeakMobileGpuRenderer('apple gpu')).toBe(false);
  });
});
