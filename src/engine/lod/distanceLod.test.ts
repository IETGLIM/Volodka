import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NPC_LOD,
  environmentDetailVisible,
  environmentLodFromDistance,
  resolveNpcLod,
  scaleNpcLodThresholds,
} from './distanceLod';

describe('resolveNpcLod', () => {
  it('returns full when forceFull', () => {
    expect(resolveNpcLod(999, 'culled', DEFAULT_NPC_LOD, true)).toBe('full');
  });

  it('applies hysteresis when crossing impostor boundary', () => {
    expect(resolveNpcLod(20, 'full', DEFAULT_NPC_LOD)).toBe('impostor');
    expect(resolveNpcLod(20, 'impostor', DEFAULT_NPC_LOD)).toBe('impostor');
    expect(resolveNpcLod(10, 'impostor', DEFAULT_NPC_LOD)).toBe('full');
  });

  it('culls at distance and restores with cullIn', () => {
    expect(resolveNpcLod(40, 'full', DEFAULT_NPC_LOD)).toBe('culled');
    expect(resolveNpcLod(30, 'culled', DEFAULT_NPC_LOD)).toBe('culled');
    expect(resolveNpcLod(20, 'culled', DEFAULT_NPC_LOD)).toBe('impostor');
  });
});

describe('scaleNpcLodThresholds', () => {
  it('expands thresholds when lodBias < 1 (ultra preset)', () => {
    const scaled = scaleNpcLodThresholds(DEFAULT_NPC_LOD, 0.5);
    expect(scaled.cullOut).toBeGreaterThan(DEFAULT_NPC_LOD.cullOut);
  });
});

describe('environmentLodFromDistance', () => {
  const profile = { clutterDistance: 10, decorativeDistance: 20 };

  it('returns full inside clutter radius', () => {
    expect(environmentLodFromDistance(5, profile, 1)).toBe('full');
  });

  it('returns standard between clutter and decorative', () => {
    expect(environmentLodFromDistance(15, profile, 1)).toBe('standard');
  });

  it('returns minimal beyond decorative', () => {
    expect(environmentLodFromDistance(25, profile, 1)).toBe('minimal');
  });
});

describe('environmentDetailVisible', () => {
  it('gates detail tiers', () => {
    expect(environmentDetailVisible('full', 'minimal')).toBe(false);
    expect(environmentDetailVisible('standard', 'standard')).toBe(true);
    expect(environmentDetailVisible('standard', 'full')).toBe(true);
  });
});
