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
    // Sub-1440px desktops intentionally resolve to 'medium' (AGGRESSIVE
    // default — see detectAutoQualityPreset: 18 PostFX passes caused frame
    // drops on mid-range GPUs at 'high').
    expect(detectAutoQualityPreset(1280, 2)).toBe('medium');
    // Large comfortable desktop screen (≥1440px) keeps 'high'.
    expect(detectAutoQualityPreset(1600, 1)).toBe('high');
    expect(capQualityTierForGpuMemory('ultra', 2, 8)).toBe('ultra');
  });

  /* ─── v4.65.0: интегрированные GPU без navigator.deviceMemory ───
   * Репорт игрока: Windows-ноутбук с iGPU (D3D11 shared VRAM) ловил
   * GL_OUT_OF_MEMORY на high-пресете. navigator.deviceMemory на Windows
   * = undefined → капа по памяти не было. Теперь iGPU детектится по
   * строке рендерера и кэпится до medium. */
  it('caps high/ultra to medium on integrated GPU without deviceMemory (Windows iGPU OOM fix)', () => {
    const intelUhd = {
      maxTextureSize: 16384,
      renderer: 'intel(r) uhd graphics 620',
      isSoftwareRenderer: false,
    };
    const radeonVega = {
      maxTextureSize: 16384,
      renderer: 'amd radeon(tm) vega 8 graphics',
      isSoftwareRenderer: false,
    };
    // deviceMemoryGb undefined — как на Windows
    expect(capQualityTierForGpuMemory('high', 1.5, undefined, intelUhd)).toBe('medium');
    expect(capQualityTierForGpuMemory('ultra', 1.25, undefined, radeonVega)).toBe('medium');
  });

  it('keeps discrete GPU tiers when renderer is not integrated', () => {
    const rtx = {
      maxTextureSize: 16384,
      renderer: 'nvidia geforce rtx 3060',
      isSoftwareRenderer: false,
    };
    expect(capQualityTierForGpuMemory('ultra', 1.5, undefined, rtx)).toBe('ultra');
    expect(capQualityTierForGpuMemory('high', 1.5, undefined, rtx)).toBe('high');
  });

  it('integrated GPU with known deviceMemory keeps existing caps (deviceMemory wins)', () => {
    const intelXe = {
      maxTextureSize: 16384,
      renderer: 'intel(r) iris(r) xe graphics',
      isSoftwareRenderer: false,
    };
    // 8 ГБ — комфортная память, iGPU-кэп не должен опускать тир
    expect(capQualityTierForGpuMemory('high', 1.5, 8, intelXe)).toBe('high');
  });
});
