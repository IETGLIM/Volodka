import { describe, expect, it } from 'vitest';
import {
  NPC_LOD_FULL_TO_IMPOSTOR_M,
  NPC_LOD_IMPOSTOR_TO_FULL_M,
  resolveNpcModelLodUseFull,
} from './npcLodConstants';

describe('resolveNpcModelLodUseFull', () => {
  it('forces full when forceFull', () => {
    expect(
      resolveNpcModelLodUseFull({ wasFull: false, distanceXZ: 100, forceFull: true }),
    ).toBe(true);
  });

  it('hysteresis: in the band distance does not flip state', () => {
    const dMid = (NPC_LOD_IMPOSTOR_TO_FULL_M + NPC_LOD_FULL_TO_IMPOSTOR_M) / 2;
    expect(dMid).toBeGreaterThanOrEqual(NPC_LOD_IMPOSTOR_TO_FULL_M);
    expect(dMid).toBeLessThan(NPC_LOD_FULL_TO_IMPOSTOR_M);

    const fromFull = resolveNpcModelLodUseFull({ wasFull: true, distanceXZ: dMid, forceFull: false });
    const fromImp = resolveNpcModelLodUseFull({ wasFull: false, distanceXZ: dMid, forceFull: false });
    expect(fromFull).toBe(true);
    expect(fromImp).toBe(false);
  });

  it('drops to impostor beyond far threshold when was full', () => {
    expect(
      resolveNpcModelLodUseFull({
        wasFull: true,
        distanceXZ: NPC_LOD_FULL_TO_IMPOSTOR_M + 0.5,
        forceFull: false,
      }),
    ).toBe(false);
  });

  it('upgrades to full within near threshold when was impostor', () => {
    expect(
      resolveNpcModelLodUseFull({
        wasFull: false,
        distanceXZ: NPC_LOD_IMPOSTOR_TO_FULL_M - 0.5,
        forceFull: false,
      }),
    ).toBe(true);
  });
});
