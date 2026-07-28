import { describe, expect, it } from 'vitest';
import {
  getIndustrialDampFloorSettings,
  getReflectorMaterialSettings,
  isIndustrialDampSheenScene,
  isWetStreetScene,
  scaleReflectorMixStrength,
  WET_STREET_SCENE_IDS,
} from './wetStreetScenes';

describe('wetStreetScenes', () => {
  it('lists night street scenes eligible for planar wet reflections', () => {
    expect(WET_STREET_SCENE_IDS).toEqual([
      'street_night',
      'city_square',
      'river_pier',
      'pier_evening',
    ]);
    expect(isWetStreetScene('street_night')).toBe(true);
    expect(isWetStreetScene('city_square')).toBe(true);
    expect(isWetStreetScene('river_pier')).toBe(true);
    expect(isWetStreetScene('pier_evening')).toBe(true);
    expect(isWetStreetScene('street_winter')).toBe(false);
    expect(isWetStreetScene('cafe_evening')).toBe(false);
  });

  it('marks factory / campfire for industrial damp sheen', () => {
    expect(isIndustrialDampSheenScene('abandoned_factory')).toBe(true);
    expect(isIndustrialDampSheenScene('factory_roof')).toBe(true);
    expect(isIndustrialDampSheenScene('chk_campfire_night')).toBe(true);
    expect(isIndustrialDampSheenScene('street_night')).toBe(false);
    const factory = getIndustrialDampFloorSettings('abandoned_factory');
    expect(factory?.oilMetalness).toBeGreaterThan(factory!.roughness * 0.5);
    expect(getIndustrialDampFloorSettings('cafe_evening')).toBeNull();
  });

  it('uses lighter reflector buffers on high than ultra', () => {
    const high = getReflectorMaterialSettings('high');
    const ultra = getReflectorMaterialSettings('ultra');
    expect(high.resolution).toBeLessThan(ultra.resolution);
    expect(high.mixStrength).toBeLessThan(ultra.mixStrength);
  });

  it('uses lightest reflector buffers on medium', () => {
    const medium = getReflectorMaterialSettings('medium');
    const high = getReflectorMaterialSettings('high');
    expect(medium.resolution).toBe(256);
    expect(medium.resolution).toBeLessThan(high.resolution);
    expect(medium.mixStrength).toBeLessThan(high.mixStrength);
  });

  it('scales reflector mix with rain intensity', () => {
    const base = 0.4;
    expect(scaleReflectorMixStrength(base, 0)).toBeCloseTo(0.1);
    expect(scaleReflectorMixStrength(base, 1)).toBeCloseTo(0.4);
    expect(scaleReflectorMixStrength(base, 0.5)).toBeGreaterThan(
      scaleReflectorMixStrength(base, 0.2),
    );
  });
});
