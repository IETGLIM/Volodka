import { describe, expect, it } from 'vitest';
import {
  allowsSelectiveMeshPhysicalWet,
  getIndustrialDampFloorSettings,
  getRainSpillInFloorBoost,
  getReflectorMaterialSettings,
  getWetGlassPhysicalParams,
  getWetPuddlePhysicalParams,
  getWinterIceSheenSettings,
  getRainWetSidewalkSettings,
  getRainWetPlankSettings,
  isIndustrialDampSheenScene,
  isRainSpillInScene,
  isSelectivePhysicalWetScene,
  isWetStreetScene,
  scaleReflectorMixStrength,
  SELECTIVE_PHYSICAL_WET_SCENE_IDS,
  WET_STREET_SCENE_IDS,
} from './wetStreetScenes';

describe('wetStreetScenes', () => {
  it('lists night street scenes eligible for planar wet reflections', () => {
    expect(WET_STREET_SCENE_IDS).toEqual([
      'street_night',
      'city_square',
      'river_pier',
      'pier_evening',
      'rooftop_edge',
    ]);
    expect(isWetStreetScene('street_night')).toBe(true);
    expect(isWetStreetScene('city_square')).toBe(true);
    expect(isWetStreetScene('river_pier')).toBe(true);
    expect(isWetStreetScene('pier_evening')).toBe(true);
    expect(isWetStreetScene('rooftop_edge')).toBe(true);
    expect(isWetStreetScene('street_winter')).toBe(false);
    expect(isWetStreetScene('cafe_evening')).toBe(false);
  });

  it('marks plaza, cafe, night street, and pier for selective MeshPhysical wet accents', () => {
    expect(SELECTIVE_PHYSICAL_WET_SCENE_IDS).toEqual([
      'city_square',
      'cafe_evening',
      'street_night',
      'river_pier',
      'pier_evening',
    ]);
    expect(isSelectivePhysicalWetScene('city_square')).toBe(true);
    expect(isSelectivePhysicalWetScene('cafe_evening')).toBe(true);
    expect(isSelectivePhysicalWetScene('street_night')).toBe(true);
    expect(isSelectivePhysicalWetScene('river_pier')).toBe(true);
    expect(isSelectivePhysicalWetScene('pier_evening')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('city_square', 'high')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('cafe_evening', 'ultra')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('street_night', 'high')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('river_pier', 'ultra')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('pier_evening', 'high')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('city_square', 'medium')).toBe(false);
    expect(allowsSelectiveMeshPhysicalWet('city_square', 'auto')).toBe(false);
    expect(allowsSelectiveMeshPhysicalWet('rooftop_edge', 'ultra')).toBe(false);
    expect(
      allowsSelectiveMeshPhysicalWet('city_square', 'ultra', { coarsePointer: true }),
    ).toBe(false);
  });

  it('scales wet puddle and glass physical knobs for selective accents', () => {
    const dry = getWetPuddlePhysicalParams(0);
    const storm = getWetPuddlePhysicalParams(1);
    expect(storm.clearcoat).toBeGreaterThan(dry.clearcoat);
    expect(storm.opacity).toBeGreaterThan(dry.opacity);
    expect(storm.roughness).toBeLessThan(dry.roughness);
    const plaza = getWetGlassPhysicalParams('plazaFacade');
    const cafe = getWetGlassPhysicalParams('cafePane');
    const neon = getWetGlassPhysicalParams('neonFascia');
    const shop = getWetGlassPhysicalParams('streetShopWindow');
    const pier = getWetGlassPhysicalParams('pierLanternGlass');
    expect(cafe.transmission).toBeGreaterThan(plaza.transmission);
    expect(neon.metalness).toBeGreaterThan(cafe.metalness);
    expect(plaza.clearcoat).toBeGreaterThan(0.4);
    expect(shop.transmission).toBeLessThan(plaza.transmission);
    expect(shop.opacity).toBeGreaterThan(0.5);
    expect(pier.transmission).toBeGreaterThan(shop.transmission);
    expect(pier.clearcoat).toBeGreaterThan(0.5);
  });

  it('marks factory / campfire / basement for industrial damp sheen', () => {
    expect(isIndustrialDampSheenScene('abandoned_factory')).toBe(true);
    expect(isIndustrialDampSheenScene('factory_roof')).toBe(true);
    expect(isIndustrialDampSheenScene('factory_basement')).toBe(true);
    expect(isIndustrialDampSheenScene('library_basement')).toBe(true);
    expect(isIndustrialDampSheenScene('chk_forest_zorge')).toBe(true);
    expect(isIndustrialDampSheenScene('chk_campfire_night')).toBe(true);
    expect(isIndustrialDampSheenScene('park_day')).toBe(true);
    expect(isIndustrialDampSheenScene('guild_mainframe')).toBe(true);
    expect(isIndustrialDampSheenScene('underground_bunker')).toBe(true);
    expect(isIndustrialDampSheenScene('albert_backroom')).toBe(true);
    expect(isIndustrialDampSheenScene('street_night')).toBe(false);
    const factory = getIndustrialDampFloorSettings('abandoned_factory');
    expect(factory?.oilMetalness).toBeGreaterThan(factory!.roughness * 0.5);
    const basement = getIndustrialDampFloorSettings('factory_basement');
    expect(basement?.oilMetalness).toBeGreaterThan(0.5);
    expect(getIndustrialDampFloorSettings('library_basement')?.oilMetalness).toBeGreaterThan(0.4);
    expect(getIndustrialDampFloorSettings('guild_mainframe')?.metalness).toBeGreaterThan(0.3);
    const forest = getIndustrialDampFloorSettings('chk_forest_zorge');
    expect(forest?.roughness).toBeGreaterThan(0.7);
    expect(forest?.metalness).toBeGreaterThan(0);
    const park = getIndustrialDampFloorSettings('park_day');
    expect(park?.roughness).toBeGreaterThan(0.75);
    expect(park?.oilMetalness).toBeGreaterThan(0.1);
    expect(park?.oilRoughness).toBeLessThan(forest!.oilRoughness + 0.05);
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
    expect(winter.sheenBoost).toBeGreaterThan(0.05);
    expect(winter.groundColor).toMatch(/^#/);
    // Sidewalk should read icier than base dry knobs after sheenBoost.
    expect(winter.dryRoughness - winter.sheenBoost).toBeLessThan(winter.dryRoughness);
    expect(winter.dryMetalness + winter.sheenBoost).toBeGreaterThan(winter.dryMetalness);
  });

  it('scales rain-wet sidewalk and pier plank knobs', () => {
    const dryWalk = getRainWetSidewalkSettings(0);
    const wetWalk = getRainWetSidewalkSettings(1);
    expect(wetWalk.roughness).toBeLessThan(dryWalk.roughness);
    expect(wetWalk.metalness).toBeGreaterThan(dryWalk.metalness);
    const dryPlank = getRainWetPlankSettings(0);
    const wetPlank = getRainWetPlankSettings(1);
    expect(wetPlank.roughness).toBeLessThan(dryPlank.roughness);
    expect(wetPlank.metalness).toBeGreaterThan(dryPlank.metalness);
    expect(wetPlank.roughness).toBeLessThan(0.45);
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
