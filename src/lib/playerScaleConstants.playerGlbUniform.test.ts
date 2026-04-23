import { describe, expect, it } from 'vitest';
import {
  applyExplorationPlayerGlbVisualUniformMultiplier,
  applyExplorationPlayerGlobalVisualScale,
  computeExplorationPlayerGlbUniformFromBBox,
  EXPLORATION_PLAYER_GLOBAL_VISUAL_SCALE,
  PLAYER_GLB_VISUAL_UNIFORM_MAX,
  PLAYER_GLB_VISUAL_UNIFORM_MIN,
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

describe('applyExplorationPlayerGlbVisualUniformMultiplier', () => {
  it('scales down then reclamps', () => {
    const base = 0.88;
    const u = applyExplorationPlayerGlbVisualUniformMultiplier(base, 0.52);
    expect(u).toBeCloseTo(base * 0.52, 5);
  });

  it('treats undefined multiplier as 1', () => {
    expect(applyExplorationPlayerGlbVisualUniformMultiplier(0.7, undefined)).toBeCloseTo(0.7, 5);
  });
});

describe('applyExplorationPlayerGlobalVisualScale', () => {
  it('shrinks uniform by project-wide exploration factor', () => {
    expect(EXPLORATION_PLAYER_GLOBAL_VISUAL_SCALE).toBe(0.2);
    expect(applyExplorationPlayerGlobalVisualScale(0.5)).toBeCloseTo(0.1, 5);
  });

  it('reclamps below min after global shrink', () => {
    expect(applyExplorationPlayerGlobalVisualScale(0.1)).toBe(PLAYER_GLB_VISUAL_UNIFORM_MIN);
  });
});
