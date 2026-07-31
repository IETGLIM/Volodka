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

  it('marks plaza, cafe, night street, pier, rooftop, CHK, park, winter, library, room, guild, bunker for selective MeshPhysical wet accents', () => {
    expect(SELECTIVE_PHYSICAL_WET_SCENE_IDS).toEqual([
      'city_square',
      'cafe_evening',
      'street_night',
      'river_pier',
      'pier_evening',
      'rooftop_edge',
      'chk_forest_zorge',
      'chk_campfire_night',
      'park_day',
      'street_winter',
      'library_day',
      'office_day',
      'abandoned_factory',
      'volodka_room',
      'guild_mainframe',
      'underground_bunker',
      'albert_backroom',
      'library_basement',
      'factory_basement',
      'zarema_albert_room',
    ]);
    expect(isSelectivePhysicalWetScene('city_square')).toBe(true);
    expect(isSelectivePhysicalWetScene('cafe_evening')).toBe(true);
    expect(isSelectivePhysicalWetScene('street_night')).toBe(true);
    expect(isSelectivePhysicalWetScene('river_pier')).toBe(true);
    expect(isSelectivePhysicalWetScene('pier_evening')).toBe(true);
    expect(isSelectivePhysicalWetScene('rooftop_edge')).toBe(true);
    expect(isSelectivePhysicalWetScene('chk_forest_zorge')).toBe(true);
    expect(isSelectivePhysicalWetScene('chk_campfire_night')).toBe(true);
    expect(isSelectivePhysicalWetScene('park_day')).toBe(true);
    expect(isSelectivePhysicalWetScene('street_winter')).toBe(true);
    expect(isSelectivePhysicalWetScene('library_day')).toBe(true);
    expect(isSelectivePhysicalWetScene('office_day')).toBe(true);
    expect(isSelectivePhysicalWetScene('abandoned_factory')).toBe(true);
    expect(isSelectivePhysicalWetScene('volodka_room')).toBe(true);
    expect(isSelectivePhysicalWetScene('guild_mainframe')).toBe(true);
    expect(isSelectivePhysicalWetScene('underground_bunker')).toBe(true);
    expect(isSelectivePhysicalWetScene('albert_backroom')).toBe(true);
    expect(isSelectivePhysicalWetScene('library_basement')).toBe(true);
    expect(isSelectivePhysicalWetScene('factory_basement')).toBe(true);
    expect(isSelectivePhysicalWetScene('zarema_albert_room')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('city_square', 'high')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('cafe_evening', 'ultra')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('street_night', 'high')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('river_pier', 'ultra')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('pier_evening', 'high')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('rooftop_edge', 'ultra')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('chk_forest_zorge', 'high')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('chk_campfire_night', 'ultra')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('park_day', 'high')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('street_winter', 'ultra')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('library_day', 'high')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('office_day', 'ultra')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('abandoned_factory', 'high')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('volodka_room', 'ultra')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('guild_mainframe', 'high')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('underground_bunker', 'ultra')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('albert_backroom', 'high')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('library_basement', 'ultra')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('factory_basement', 'high')).toBe(true);
    expect(allowsSelectiveMeshPhysicalWet('city_square', 'medium')).toBe(false);
    expect(allowsSelectiveMeshPhysicalWet('city_square', 'auto')).toBe(false);
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
    const roof = getWetGlassPhysicalParams('rooftopSkylightGlass');
    const camp = getWetGlassPhysicalParams('campfireBottleGlass');
    const winter = getWetGlassPhysicalParams('winterShopWindow');
    const library = getWetGlassPhysicalParams('libraryStainedGlass');
    const office = getWetGlassPhysicalParams('officeCubicleGlass');
    const factory = getWetGlassPhysicalParams('factoryBrokenGlass');
    const room = getWetGlassPhysicalParams('roomNightWindow');
    const crt = getWetGlassPhysicalParams('crtTerminalGlass');
    expect(cafe.transmission).toBeGreaterThan(plaza.transmission);
    expect(neon.metalness).toBeGreaterThan(cafe.metalness);
    expect(plaza.clearcoat).toBeGreaterThan(0.4);
    expect(shop.transmission).toBeLessThan(plaza.transmission);
    expect(shop.opacity).toBeGreaterThan(0.5);
    expect(winter.transmission).toBeLessThan(shop.transmission);
    expect(winter.roughness).toBeGreaterThan(shop.roughness);
    expect(pier.transmission).toBeGreaterThan(shop.transmission);
    expect(pier.clearcoat).toBeGreaterThan(0.5);
    expect(roof.transmission).toBeLessThan(pier.transmission);
    expect(roof.clearcoat).toBeGreaterThan(0.5);
    expect(camp.opacity).toBeGreaterThan(roof.opacity);
    expect(camp.clearcoat).toBeGreaterThan(0.4);
    expect(library.clearcoat).toBeGreaterThan(0.4);
    expect(library.opacity).toBeGreaterThan(office.opacity);
    expect(office.transmission).toBeGreaterThan(library.transmission);
    expect(factory.metalness).toBeGreaterThan(library.metalness);
    expect(factory.opacity).toBeLessThan(library.opacity);
    // Wall-backed night impostors: clearcoat only — transmission against plaster flashes black.
    expect(room.transmission).toBe(0);
    expect(room.opacity).toBe(1);
    expect(room.clearcoat).toBeGreaterThan(0.4);
    expect(crt.clearcoat).toBeGreaterThan(room.clearcoat);
    expect(crt.opacity).toBeGreaterThan(factory.opacity);
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
