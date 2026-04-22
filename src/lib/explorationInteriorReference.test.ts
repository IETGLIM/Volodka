import { describe, expect, it } from 'vitest';
import {
  INTERIOR_REF_COFFEE_TABLE_SURFACE_Y_M,
  INTERIOR_REF_DESK_SURFACE_Y_M,
  INTERIOR_REF_DOOR_HEIGHT_M,
  INTERIOR_REF_DOOR_WIDTH_M,
  interiorCoffeeTableGroupCenterY,
  interiorDeskVisualGroupCenterY,
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

  it('places desk visual so tabletop reaches reference height', () => {
    const cy = interiorDeskVisualGroupCenterY(0);
    expect(cy + 0.04).toBeCloseTo(INTERIOR_REF_DESK_SURFACE_Y_M, 2);
  });

  it('places coffee table visual so top reaches reference height', () => {
    const cy = interiorCoffeeTableGroupCenterY(0);
    expect(cy + 0.04).toBeCloseTo(INTERIOR_REF_COFFEE_TABLE_SURFACE_Y_M, 2);
  });
});
