import { describe, expect, it } from 'vitest';
import { seededRand } from './seededRand';

describe('seededRand', () => {
  it('returns values in [0, 1) for integer seeds', () => {
    for (let i = 0; i < 50; i++) {
      const value = seededRand(i * 17 + 3);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it('does not return NaN for non-finite seeds', () => {
    expect(Number.isFinite(seededRand(Number.POSITIVE_INFINITY))).toBe(true);
    expect(Number.isFinite(seededRand(Number.NEGATIVE_INFINITY))).toBe(true);
    expect(Number.isFinite(seededRand(Number.NaN))).toBe(true);
  });

  it('is deterministic for the same seed', () => {
    expect(seededRand(42)).toBe(seededRand(42));
    expect(seededRand(Number.POSITIVE_INFINITY)).toBe(seededRand(Number.NaN));
  });
});
