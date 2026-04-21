import { describe, expect, it } from 'vitest';
import {
  computeExplorationPlayerGlbUniformFromBBox,
  PLAYER_GLB_VISUAL_UNIFORM_MAX,
} from '@/lib/playerScaleConstants';

describe('computeExplorationPlayerGlbUniformFromBBox', () => {
  it('clamps when skinned bbox is underestimated (large raw)', () => {
    const u = computeExplorationPlayerGlbUniformFromBBox(0.58, 1.38, 1);
    const naive = (1.38 / 0.58) * 1;
    expect(naive).toBeGreaterThan(2.2);
    expect(u).toBe(PLAYER_GLB_VISUAL_UNIFORM_MAX);
  });

  it('does not change scale when bbox is already realistic', () => {
    const u = computeExplorationPlayerGlbUniformFromBBox(1.72, 1.38, 1);
    expect(u).toBeCloseTo(1.38 / 1.72, 5);
  });

  it('applies room scale after target for zarema-like numbers', () => {
    const u = computeExplorationPlayerGlbUniformFromBBox(0.62, 0.78, 0.38);
    expect(u).toBeLessThan(0.55);
    expect(u).toBeGreaterThan(0.2);
  });

  it('returns safe default when inputs are non-finite', () => {
    expect(computeExplorationPlayerGlbUniformFromBBox(NaN, 1.38, 1)).toBe(0.12);
  });
});
