import { describe, expect, it } from 'vitest';
import { MAX_DIRECT_DISPLACEMENT } from './playerConstants';
import { clampHorizontalDisplacement } from './playerMath';

describe('clampHorizontalDisplacement', () => {
  it('keeps displacement below the per-frame cap', () => {
    const { dx, dz } = clampHorizontalDisplacement(2, 0, MAX_DIRECT_DISPLACEMENT);
    expect(dx).toBe(MAX_DIRECT_DISPLACEMENT);
    expect(dz).toBe(0);
  });

  it('preserves direction when scaling down', () => {
    const { dx, dz } = clampHorizontalDisplacement(1, 1, MAX_DIRECT_DISPLACEMENT);
    const hLen = Math.sqrt(dx * dx + dz * dz);
    expect(hLen).toBeCloseTo(MAX_DIRECT_DISPLACEMENT);
    expect(dx).toBeCloseTo(dz);
  });

  it('does not change displacement under the cap', () => {
    const { dx, dz } = clampHorizontalDisplacement(0.05, 0.02, MAX_DIRECT_DISPLACEMENT);
    expect(dx).toBe(0.05);
    expect(dz).toBe(0.02);
  });
});
