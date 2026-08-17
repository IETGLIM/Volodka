import { describe, expect, it } from 'vitest';
import {
  buildPickupCollectBurst,
  PICKUP_COLLECT_BURST_DURATION_MS,
} from './pickupCollectBurst';

describe('pickupCollectBurst', () => {
  it('builds stable particles for the same seed', () => {
    const a = buildPickupCollectBurst('zone_letter');
    const b = buildPickupCollectBurst('zone_letter');
    expect(a).toEqual(b);
    expect(a.length).toBe(10);
    expect(a[0].speed).toBeGreaterThan(1);
    expect(a[0].life).toBeGreaterThan(0.3);
  });

  it('clamps count and differs by seed', () => {
    expect(buildPickupCollectBurst('a', 2).length).toBe(3);
    expect(buildPickupCollectBurst('a', 100).length).toBe(24);
    expect(buildPickupCollectBurst('alpha')[0].angle).not.toBe(
      buildPickupCollectBurst('beta')[0].angle,
    );
  });

  it('exposes short burst duration', () => {
    expect(PICKUP_COLLECT_BURST_DURATION_MS).toBeLessThan(600);
  });
});
