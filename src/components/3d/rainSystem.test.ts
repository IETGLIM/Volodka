import { describe, it, expect } from 'vitest';
import {
  resolveRainLevel,
  buildRainConfig,
  getMaxRainParticleCount,
} from './RainSystem';

describe('resolveRainLevel', () => {
  it('maps intensity to light, medium, and heavy tiers', () => {
    expect(resolveRainLevel(0)).toBe('light');
    expect(resolveRainLevel(0.32)).toBe('light');
    expect(resolveRainLevel(0.33)).toBe('medium');
    expect(resolveRainLevel(0.65)).toBe('medium');
    expect(resolveRainLevel(0.66)).toBe('heavy');
    expect(resolveRainLevel(1)).toBe('heavy');
  });
});

describe('buildRainConfig', () => {
  it('keeps active counts within max heavy capacity on desktop', () => {
    const maxCount = getMaxRainParticleCount(false, false, false);

    for (const level of ['light', 'medium', 'heavy'] as const) {
      const config = buildRainConfig(level, false, false, false);
      expect(config.count).toBeGreaterThan(0);
      expect(config.count).toBeLessThanOrEqual(maxCount);
    }
  });

  it('scales max capacity down on mobile visualLite profiles', () => {
    const desktopMax = getMaxRainParticleCount(false, false, false);
    const mobileLiteMax = getMaxRainParticleCount(true, true, false);

    expect(mobileLiteMax).toBeLessThan(desktopMax);
    expect(buildRainConfig('heavy', true, true, false).count).toBe(mobileLiteMax);
  });

  it('increases particle count across rain tiers without exceeding capacity', () => {
    const light = buildRainConfig('light', false, false, false).count;
    const medium = buildRainConfig('medium', false, false, false).count;
    const heavy = buildRainConfig('heavy', false, false, false).count;

    expect(light).toBeLessThan(medium);
    expect(medium).toBeLessThan(heavy);
    expect(heavy).toBe(getMaxRainParticleCount(false, false, false));
  });
});
