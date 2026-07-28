import { describe, expect, it } from 'vitest';
import {
  getIndustrialDampFloorSettings,
  getRainSpillInFloorBoost,
  getReflectorMaterialSettings,
  getWinterIceSheenSettings,
  isIndustrialDampSheenScene,
  isRainSpillInScene,
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

  it('marks factory / campfire / basement for industrial damp sheen', () => {
    expect(isIndustrialDampSheenScene('abandoned_factory')).toBe(true);
    expect(isIndustrialDampSheenScene('factory_roof')).toBe(true);
    expect(isIndustrialDampSheenScene('factory_basement')).toBe(true);
    expect(isIndustrialDampSheenScene('library_basement')).toBe(true);
    expect(isIndustrialDampSheenScene('chk_campfire_night')).toBe(true);
    expect(isIndustrialDampSheenScene('street_night')).toBe(false);
    const factory = getIndustrialDampFloorSettings('abandoned_factory');
    expect(factory?.oilMetalness).toBeGreaterThan(factory!.roughness * 0.5);
    const basement = getIndustrialDampFloorSettings('factory_basement');
    expect(basement?.oilMetalness).toBeGreaterThan(0.5);
    expect(getIndustrialDampFloorSettings('library_basement')?.oilMetalness).toBeGreaterThan(0.4);
    expect(getIndustrialDampFloorSettings('cafe_evening')).toBeNull();
  });

  it('boosts spill-in floors when outdoor rain bleeds indoors', () => {
    expect(isRainSpillInScene('factory_basement')).toBe(true);
    expect(isRainSpillInScene('abandoned_factory')).toBe(true);
    expect(isRainSpillInScene('library_basement')).toBe(true);
    expect(isRainSpillInScene('volodka_corridor')).toBe(true);
    expect(getRainSpillInFloorBoost('factory_basement', 0)).toBeNull();
    const wet = getRainSpillInFloorBoost('factory_basement', 0.8);
    expect(wet?.puddleOpacity).toBeGreaterThan(0.3);
    expect(wet?.metalnessBoost).toBeGreaterThan(0.1);
    const corridor = getRainSpillInFloorBoost('volodka_corridor', 0.8);
    expect(corridor?.puddleOpacity).toBeGreaterThan(wet!.puddleOpacity);
    expect(getRainSpillInFloorBoost('cafe_evening', 1)).toBeNull();
  });

  it('exposes winter ice sheen knobs', () => {
    const winter = getWinterIceSheenSettings();
    expect(winter.dryMetalness).toBeGreaterThan(0.25);
    expect(winter.dryRoughness).toBeLessThan(0.45);
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
