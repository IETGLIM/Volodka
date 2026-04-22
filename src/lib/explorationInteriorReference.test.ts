import { describe, expect, it } from 'vitest';
import {
  INTERIOR_REF_DOOR_HEIGHT_M,
  INTERIOR_REF_DOOR_WIDTH_M,
  interiorDoorCenterYFromFloor,
} from './explorationInteriorReference';

describe('explorationInteriorReference', () => {
  it('uses realistic door proportions', () => {
    expect(INTERIOR_REF_DOOR_HEIGHT_M).toBeGreaterThanOrEqual(2);
    expect(INTERIOR_REF_DOOR_HEIGHT_M).toBeLessThanOrEqual(2.2);
    expect(INTERIOR_REF_DOOR_WIDTH_M).toBeGreaterThanOrEqual(0.85);
    expect(INTERIOR_REF_DOOR_WIDTH_M).toBeLessThanOrEqual(1.05);
  });

  it('centers door mesh above floor', () => {
    const cy = interiorDoorCenterYFromFloor(0);
    expect(cy - INTERIOR_REF_DOOR_HEIGHT_M / 2).toBeGreaterThan(0);
  });
});
