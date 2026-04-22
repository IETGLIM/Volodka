import { describe, expect, it } from 'vitest';
import { smoothBlend01, smoothstep01 } from './cinematicEasing';

describe('cinematicEasing', () => {
  it('smoothstep01 clamps and eases endpoints', () => {
    expect(smoothstep01(-1)).toBe(0);
    expect(smoothstep01(2)).toBe(1);
    expect(smoothstep01(0.5)).toBeCloseTo(0.5, 5);
  });

  it('smoothBlend01 is flat near 0 and 1', () => {
    expect(smoothBlend01(0)).toBe(0);
    expect(smoothBlend01(1)).toBe(1);
    expect(smoothBlend01(0.5)).toBeGreaterThan(0.4);
  });
});
