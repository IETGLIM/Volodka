import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NPC_LOD,
  ENV_LOD_HYSTERESIS_IN_RATIO,
  environmentDetailVisible,
  environmentLodFromDistance,
  environmentLodThresholdsFromProfile,
  getEnvironmentLodProfile,
  resolveEnvironmentLod,
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
  it('shrinks thresholds when lodBias < 1 (low preset switches sooner)', () => {
    const low = scaleNpcLodThresholds(DEFAULT_NPC_LOD, 0.6);
    expect(low.impostorOut).toBeCloseTo(DEFAULT_NPC_LOD.impostorOut * 0.6);
    expect(low.cullOut).toBeLessThan(DEFAULT_NPC_LOD.cullOut);
  });

  it('expands thresholds when lodBias > 1 (ultra preset keeps detail longer)', () => {
    const ultra = scaleNpcLodThresholds(DEFAULT_NPC_LOD, 1.25);
    expect(ultra.impostorOut).toBeCloseTo(DEFAULT_NPC_LOD.impostorOut * 1.25);
    expect(ultra.cullOut).toBeGreaterThan(DEFAULT_NPC_LOD.cullOut);
  });

  it('low quality switches to impostor sooner than ultra at same distance', () => {
    const low = scaleNpcLodThresholds(DEFAULT_NPC_LOD, 0.6);
    const ultra = scaleNpcLodThresholds(DEFAULT_NPC_LOD, 1.25);
    const midDistance = 15;
    expect(resolveNpcLod(midDistance, 'full', low)).toBe('impostor');
    expect(resolveNpcLod(midDistance, 'full', ultra)).toBe('full');
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

  it('low lodBias shrinks detail radii (switches to minimal sooner)', () => {
    expect(environmentLodFromDistance(7, profile, 0.6)).toBe('standard');
    expect(environmentLodFromDistance(7, profile, 1.25)).toBe('full');
  });
});

describe('extension scene env LOD profiles', () => {
  it('defines finite cull radii for extension hubs (not default 999)', () => {
    expect(getEnvironmentLodProfile('guild_mainframe').clutterDistance).toBeLessThan(999);
    expect(getEnvironmentLodProfile('albert_backroom').clutterDistance).toBeLessThan(999);
    expect(getEnvironmentLodProfile('chk_campfire_night').clutterDistance).toBe(9);
    expect(getEnvironmentLodProfile('abandoned_factory').clutterDistance).toBe(11);
    // city_square is hero-tier — detailDistanceScale 1.15 expands base clutter 15 → 17.25
    expect(getEnvironmentLodProfile('city_square').clutterDistance).toBe(17.25);
    expect(getEnvironmentLodProfile('pier_evening').clutterDistance).toBe(11);
    expect(getEnvironmentLodProfile('river_pier').clutterDistance).toBe(11);
    expect(getEnvironmentLodProfile('factory_basement').clutterDistance).toBe(8);
    expect(getEnvironmentLodProfile('library_basement').clutterDistance).toBeLessThan(12);
    expect(getEnvironmentLodProfile('volodka_corridor').clutterDistance).toBeLessThan(12);
    expect(getEnvironmentLodProfile('library_basement').clutterDistance).toBeLessThan(
      getEnvironmentLodProfile('library_day').clutterDistance,
    );
  });
});

describe('environmentDetailVisible', () => {
  it('gates detail tiers', () => {
    expect(environmentDetailVisible('full', 'minimal')).toBe(false);
    expect(environmentDetailVisible('standard', 'standard')).toBe(true);
    expect(environmentDetailVisible('standard', 'full')).toBe(true);
  });
});

describe('resolveEnvironmentLod', () => {
  const profile = { clutterDistance: 10, decorativeDistance: 20 };
  const thresholds = environmentLodThresholdsFromProfile(profile, 1);

  it('prop far from spawn but near player stays high LOD', () => {
    const spawnFarPlayerNear = 5;
    expect(resolveEnvironmentLod(spawnFarPlayerNear, 'full', thresholds)).toBe('full');
    expect(environmentLodFromDistance(spawnFarPlayerNear, profile, 1)).toBe('full');
  });

  it('prop near spawn but far from player downgrades', () => {
    const playerFarFromProp = 25;
    expect(resolveEnvironmentLod(playerFarFromProp, 'full', thresholds)).toBe('minimal');
    expect(environmentLodFromDistance(playerFarFromProp, profile, 1)).toBe('minimal');
  });

  it('applies hysteresis when distance oscillates at clutter boundary', () => {
    const atClutterOut = thresholds.clutterOut;
    const betweenBands = (thresholds.clutterOut + thresholds.clutterIn) / 2;

    expect(resolveEnvironmentLod(atClutterOut, 'full', thresholds)).toBe('standard');
    expect(resolveEnvironmentLod(betweenBands, 'standard', thresholds)).toBe('standard');
    expect(resolveEnvironmentLod(thresholds.clutterIn - 0.01, 'standard', thresholds)).toBe('full');
  });

  it('uses 0.85 enter ratio for hysteresis bands', () => {
    expect(thresholds.clutterIn).toBeCloseTo(thresholds.clutterOut * ENV_LOD_HYSTERESIS_IN_RATIO);
    expect(thresholds.decorativeIn).toBeCloseTo(thresholds.decorativeOut * ENV_LOD_HYSTERESIS_IN_RATIO);
  });
});
