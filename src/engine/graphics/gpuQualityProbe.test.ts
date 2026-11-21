import { describe, expect, it } from 'vitest';
import {
  computePhysicalPixelCount,
  getCachedWebGlGpuProbe,
  isIntegratedGpuRenderer,
  isWeakMobileGpuRenderer,
  resetCachedWebGlGpuProbeForTests,
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

describe('isIntegratedGpuRenderer (v4.65.0 — Windows iGPU OOM fix)', () => {
  it('detects Intel UHD / Iris / Xe iGPU strings', () => {
    expect(isIntegratedGpuRenderer('intel(r) uhd graphics 620')).toBe(true);
    expect(isIntegratedGpuRenderer('intel(r) uhd graphics for 10th gen intel(r) processors')).toBe(true);
    expect(isIntegratedGpuRenderer('intel(r) iris(r) plus graphics 655')).toBe(true);
    expect(isIntegratedGpuRenderer('intel(r) iris(r) xe graphics')).toBe(true);
    expect(isIntegratedGpuRenderer('intel(r) hd graphics 530')).toBe(true);
  });

  it('detects AMD Ryzen iGPU (Vega / Radeon Graphics)', () => {
    // Реальные строки UNMASKED_RENDERER_WEBGL из ANGLE/D3D11
    expect(isIntegratedGpuRenderer('amd radeon(tm) vega 8 graphics')).toBe(true);
    expect(isIntegratedGpuRenderer('amd radeon(tm) graphics')).toBe(true);
    expect(isIntegratedGpuRenderer('radeon(tm) graphics')).toBe(true);
  });

  it('detects Apple M-series (unified memory)', () => {
    expect(isIntegratedGpuRenderer('apple m1')).toBe(true);
    expect(isIntegratedGpuRenderer('apple m2 pro')).toBe(true);
  });

  it('does NOT flag discrete GPUs', () => {
    expect(isIntegratedGpuRenderer('nvidia geforce rtx 3060')).toBe(false);
    expect(isIntegratedGpuRenderer('nvidia geforce gtx 1650')).toBe(false);
    expect(isIntegratedGpuRenderer('amd radeon rx 5600 xt')).toBe(false);
    expect(isIntegratedGpuRenderer('amd radeon (tm) rx 6700 xt')).toBe(false);
  });

  it('returns false for undefined renderer (probe fallback)', () => {
    expect(isIntegratedGpuRenderer(undefined)).toBe(false);
    expect(isIntegratedGpuRenderer('')).toBe(false);
  });

  it('mobile-weak detector stays orthogonal to iGPU detector', () => {
    expect(isWeakMobileGpuRenderer('intel(r) uhd graphics 620')).toBe(false);
    expect(isIntegratedGpuRenderer('adreno (tm) 505')).toBe(false);
  });
});

describe('getCachedWebGlGpuProbe', () => {
  it('returns the same probe object for repeated calls', () => {
    resetCachedWebGlGpuProbeForTests();
    const first = getCachedWebGlGpuProbe();
    const second = getCachedWebGlGpuProbe();
    expect(second).toBe(first);
  });
});
