import { describe, expect, it } from 'vitest';
import {
  NPC_LOD_FULL_TO_IMPOSTOR_M,
  NPC_LOD_IMPOSTOR_TO_FULL_M,
  resolveNpcModelLodUseFull,
} from './LODController';

describe('LOD Hysteresis', () => {
  it('should not flicker between full/impostor at boundary distance', () => {
    const dist1 = 15;
    expect(dist1).toBeGreaterThanOrEqual(NPC_LOD_IMPOSTOR_TO_FULL_M);
    expect(dist1).toBeLessThan(NPC_LOD_FULL_TO_IMPOSTOR_M);

    const state1 = resolveNpcModelLodUseFull({
      wasFull: true,
      distanceXZ: dist1,
      forceFull: false,
    });
    const state2 = resolveNpcModelLodUseFull({
      wasFull: false,
      distanceXZ: dist1,
      forceFull: false,
    });
    expect(state1).not.toBe(state2);
    expect(state1).toBe(true);
    expect(state2).toBe(false);
  });

  it('uses 11m / 19m thresholds: near band stays full when already full, far band stays impostor when already impostor', () => {
    expect(
      resolveNpcModelLodUseFull({
        wasFull: true,
        distanceXZ: 11,
        forceFull: false,
      }),
    ).toBe(true);
    expect(
      resolveNpcModelLodUseFull({
        wasFull: true,
        distanceXZ: 19,
        forceFull: false,
      }),
    ).toBe(false);
    expect(
      resolveNpcModelLodUseFull({
        wasFull: false,
        distanceXZ: 14,
        forceFull: false,
      }),
    ).toBe(false);
    expect(
      resolveNpcModelLodUseFull({
        wasFull: false,
        distanceXZ: 10.5,
        forceFull: false,
      }),
    ).toBe(true);
  });
});
