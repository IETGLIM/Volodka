import { describe, expect, it } from 'vitest';
import {
  getParticleCount,
  REDUCED_MOTION_PARTICLE_MULTIPLIER,
} from '@/shared/utils/mobileParticleScale';

describe('mobileParticleScale', () => {
  it('getParticleCount caps weather particles under reduced motion', () => {
    const full = getParticleCount(3000, false, false, 1, false);
    const reduced = getParticleCount(3000, false, false, 1, true);
    expect(reduced).toBeLessThan(full);
    expect(reduced).toBe(Math.max(1, Math.round(3000 * REDUCED_MOTION_PARTICLE_MULTIPLIER)));
  });

  it('getParticleCount still returns at least 1', () => {
    expect(getParticleCount(1, true, true, 0.1, true)).toBe(1);
  });
});
