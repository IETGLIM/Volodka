import type { SceneId } from '@/shared/types/game';
import type { QualityPresetId } from './qualityPresets';
import { allowsHeavyGfxFeature, type HeavyGfxFeatureOptions } from './qualityFeatureGates';

/**
 * Scenes with rain-wet planar ground reflections.
 * Winter uses WetStreetGround ice sheen without planar reflector.
 */
export const WET_STREET_SCENE_IDS = [
  'street_night',
  'city_square',
  'river_pier',
  'pier_evening',
  'rooftop_edge',
] as const satisfies readonly SceneId[];

export type WetStreetSceneId = (typeof WET_STREET_SCENE_IDS)[number];

export function isWetStreetScene(sceneId: SceneId): sceneId is WetStreetSceneId {
  return (WET_STREET_SCENE_IDS as readonly string[]).includes(sceneId);
}

/**
 * Hubs that may mount a few MeshPhysical wet glass / puddle accents
 * (not every mesh — quality-gated via `meshPhysicalWet`).
 */
export const SELECTIVE_PHYSICAL_WET_SCENE_IDS = [
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
] as const satisfies readonly SceneId[];

export type SelectivePhysicalWetSceneId = (typeof SELECTIVE_PHYSICAL_WET_SCENE_IDS)[number];

export function isSelectivePhysicalWetScene(
  sceneId: SceneId,
): sceneId is SelectivePhysicalWetSceneId {
  return (SELECTIVE_PHYSICAL_WET_SCENE_IDS as readonly string[]).includes(sceneId);
}

/** True when this scene + quality preset may use selective MeshPhysical wet accents. */
export function allowsSelectiveMeshPhysicalWet(
  sceneId: SceneId,
  selectedPreset: QualityPresetId,
  options?: HeavyGfxFeatureOptions,
): boolean {
  return (
    isSelectivePhysicalWetScene(sceneId)
    && allowsHeavyGfxFeature(selectedPreset, 'meshPhysicalWet', options)
  );
}

export type WetPuddlePhysicalParams = {
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  opacity: number;
};

/** Rain-scaled puddle knobs for selective MeshPhysical discs (plaza / cafe spill). */
export function getWetPuddlePhysicalParams(rainIntensity: number): WetPuddlePhysicalParams {
  const t = Math.min(1, Math.max(0, rainIntensity));
  const wet = Math.max(0.15, t);
  return {
    roughness: 0.22 - 0.12 * wet,
    metalness: 0.18 + 0.14 * wet,
    clearcoat: 0.55 + 0.35 * wet,
    clearcoatRoughness: 0.28 - 0.16 * wet,
    opacity: Math.min(0.78, 0.28 + 0.42 * wet),
  };
}

export type WetGlassPhysicalKind =
  | 'plazaFacade'
  | 'cafePane'
  | 'neonFascia'
  | 'streetShopWindow'
  | 'pierLanternGlass'
  | 'rooftopSkylightGlass'
  | 'campfireBottleGlass'
  | 'winterShopWindow'
  | 'libraryStainedGlass'
  | 'officeCubicleGlass'
  | 'factoryBrokenGlass'
  | 'roomNightWindow'
  | 'crtTerminalGlass';

export type WetGlassPhysicalParams = {
  roughness: number;
  metalness: number;
  transmission: number;
  thickness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  opacity: number;
};

/** Selective wet glass / neon fascia params — few meshes per hub. */
export function getWetGlassPhysicalParams(kind: WetGlassPhysicalKind): WetGlassPhysicalParams {
  if (kind === 'cafePane') {
    return {
      roughness: 0.08,
      metalness: 0.08,
      transmission: 0.28,
      thickness: 0.4,
      clearcoat: 0.6,
      clearcoatRoughness: 0.22,
      opacity: 0.88,
    };
  }
  if (kind === 'neonFascia') {
    return {
      roughness: 0.24,
      metalness: 0.48,
      transmission: 0.06,
      thickness: 0.12,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
      opacity: 0.95,
    };
  }
  if (kind === 'streetShopWindow') {
    // Night street shopfront — darker, less transmission than plaza.
    return {
      roughness: 0.1,
      metalness: 0.12,
      transmission: 0.14,
      thickness: 0.28,
      clearcoat: 0.58,
      clearcoatRoughness: 0.24,
      opacity: 0.62,
    };
  }
  if (kind === 'pierLanternGlass') {
    // Dock lantern / bottle glass — warm wet sheen over dark water.
    return {
      roughness: 0.12,
      metalness: 0.1,
      transmission: 0.18,
      thickness: 0.22,
      clearcoat: 0.62,
      clearcoatRoughness: 0.2,
      opacity: 0.72,
    };
  }
  if (kind === 'rooftopSkylightGlass') {
    // Stairwell door pane / HVAC gauge — rain-streaked rooftop glass.
    return {
      roughness: 0.14,
      metalness: 0.16,
      transmission: 0.12,
      thickness: 0.2,
      clearcoat: 0.58,
      clearcoatRoughness: 0.26,
      opacity: 0.55,
    };
  }
  if (kind === 'campfireBottleGlass') {
    // Portwine «777» bottle — dew/ash sheen by campfire (no planar reflector).
    return {
      roughness: 0.16,
      metalness: 0.08,
      transmission: 0.1,
      thickness: 0.18,
      clearcoat: 0.52,
      clearcoatRoughness: 0.28,
      opacity: 0.78,
    };
  }
  if (kind === 'winterShopWindow') {
    // Frosted winter shopfront — colder, lower transmission than rain night glass.
    return {
      roughness: 0.22,
      metalness: 0.14,
      transmission: 0.08,
      thickness: 0.24,
      clearcoat: 0.48,
      clearcoatRoughness: 0.34,
      opacity: 0.7,
    };
  }
  if (kind === 'libraryStainedGlass') {
    // Dusty gothic panes — low transmission, warm clearcoat over emissive color wash.
    return {
      roughness: 0.18,
      metalness: 0.06,
      transmission: 0.12,
      thickness: 0.35,
      clearcoat: 0.55,
      clearcoatRoughness: 0.3,
      opacity: 0.82,
    };
  }
  if (kind === 'officeCubicleGlass') {
    // Sterile IT meeting-room partitions — cool clearcoat, low transmission.
    return {
      roughness: 0.06,
      metalness: 0.12,
      transmission: 0.22,
      thickness: 0.18,
      clearcoat: 0.62,
      clearcoatRoughness: 0.18,
      opacity: 0.32,
    };
  }
  if (kind === 'factoryBrokenGlass') {
    // Rain-streaked industrial panes / floor shards — oily clearcoat, low transmission.
    return {
      roughness: 0.16,
      metalness: 0.22,
      transmission: 0.1,
      thickness: 0.14,
      clearcoat: 0.48,
      clearcoatRoughness: 0.32,
      opacity: 0.42,
    };
  }
  if (kind === 'roomNightWindow') {
    // Wall-backed night city-glow impostors (Volodka / Zarema rooms). No exterior
    // volume exists behind the pane — MeshPhysical transmission samples the plaster
    // 3 cm away and reads as black flashing squares. Keep clearcoat wet sheen only.
    return {
      roughness: 0.14,
      metalness: 0.06,
      transmission: 0,
      thickness: 0.18,
      clearcoat: 0.55,
      clearcoatRoughness: 0.24,
      opacity: 1,
    };
  }
  if (kind === 'crtTerminalGlass') {
    // Guild/bunker CRT face — glossy phosphor glass over emissive screen.
    return {
      roughness: 0.1,
      metalness: 0.18,
      transmission: 0.08,
      thickness: 0.12,
      clearcoat: 0.72,
      clearcoatRoughness: 0.16,
      opacity: 0.88,
    };
  }
  // plazaFacade
  return {
    roughness: 0.07,
    metalness: 0.14,
    transmission: 0.2,
    thickness: 0.32,
    clearcoat: 0.55,
    clearcoatRoughness: 0.26,
    opacity: 0.55,
  };
}

/**
 * Industrial / campfire damp sheen — no planar reflector, darker wet concrete / ash.
 * Applied as material polish (factory oil, campfire damp ring).
 */
export const INDUSTRIAL_DAMP_SHEEN_SCENE_IDS = [
  'abandoned_factory',
  'factory_roof',
  'factory_basement',
  'library_basement',
  'chk_forest_zorge',
  'chk_campfire_night',
  'park_day',
  'guild_mainframe',
  'underground_bunker',
  'albert_backroom',
] as const satisfies readonly SceneId[];

export type IndustrialDampSheenSceneId = (typeof INDUSTRIAL_DAMP_SHEEN_SCENE_IDS)[number];

export function isIndustrialDampSheenScene(
  sceneId: SceneId,
): sceneId is IndustrialDampSheenSceneId {
  return (INDUSTRIAL_DAMP_SHEEN_SCENE_IDS as readonly string[]).includes(sceneId);
}

/**
 * Indoor / semi-indoor scenes that inherit wet sheen from outdoor rain
 * (stairs, loading docks, basement spill-in — no planar reflector).
 */
export const RAIN_SPILL_IN_SCENE_IDS = [
  'factory_basement',
  'abandoned_factory',
  'library_basement',
  'volodka_corridor',
] as const satisfies readonly SceneId[];

export type RainSpillInSceneId = (typeof RAIN_SPILL_IN_SCENE_IDS)[number];

export function isRainSpillInScene(sceneId: SceneId): sceneId is RainSpillInSceneId {
  return (RAIN_SPILL_IN_SCENE_IDS as readonly string[]).includes(sceneId);
}

/** Factory oil / damp concrete material knobs (no rain required). */
export function getIndustrialDampFloorSettings(sceneId: SceneId): {
  roughness: number;
  metalness: number;
  oilMetalness: number;
  oilRoughness: number;
} | null {
  if (!isIndustrialDampSheenScene(sceneId)) return null;
  if (sceneId === 'chk_forest_zorge') {
    // Night moss + light snow dew — cooler sheen than factory oil, no planar reflector.
    return { roughness: 0.78, metalness: 0.07, oilMetalness: 0.16, oilRoughness: 0.52 };
  }
  if (sceneId === 'chk_campfire_night') {
    return { roughness: 0.72, metalness: 0.08, oilMetalness: 0.2, oilRoughness: 0.45 };
  }
  if (sceneId === 'park_day') {
    // Gothic memorial park — morning mist dew on grass/gravel (no planar reflector).
    return { roughness: 0.82, metalness: 0.06, oilMetalness: 0.14, oilRoughness: 0.48 };
  }
  if (sceneId === 'factory_basement') {
    return { roughness: 0.48, metalness: 0.22, oilMetalness: 0.62, oilRoughness: 0.18 };
  }
  if (sceneId === 'library_basement') {
    return { roughness: 0.58, metalness: 0.16, oilMetalness: 0.48, oilRoughness: 0.28 };
  }
  if (sceneId === 'guild_mainframe') {
    return { roughness: 0.42, metalness: 0.38, oilMetalness: 0.58, oilRoughness: 0.2 };
  }
  if (sceneId === 'underground_bunker') {
    return { roughness: 0.62, metalness: 0.14, oilMetalness: 0.4, oilRoughness: 0.32 };
  }
  if (sceneId === 'albert_backroom') {
    return { roughness: 0.7, metalness: 0.1, oilMetalness: 0.28, oilRoughness: 0.4 };
  }
  return { roughness: 0.55, metalness: 0.18, oilMetalness: 0.55, oilRoughness: 0.22 };
}

/**
 * Extra floor wetness when outdoor rain bleeds into spill-in scenes.
 * rainIntensity 0–1; returns null when dry or scene not eligible.
 */
export function getRainSpillInFloorBoost(
  sceneId: SceneId,
  rainIntensity: number,
): { roughnessDrop: number; metalnessBoost: number; puddleOpacity: number } | null {
  if (!isRainSpillInScene(sceneId)) return null;
  const t = Math.min(1, Math.max(0, rainIntensity));
  if (t <= 0.05) return null;
  const corridorBoost = sceneId === 'volodka_corridor' || sceneId === 'library_basement' ? 1.08 : 1;
  return {
    roughnessDrop: (0.08 + 0.18 * t) * corridorBoost,
    metalnessBoost: (0.06 + 0.14 * t) * corridorBoost,
    puddleOpacity: Math.min(0.72, (0.2 + 0.35 * t) * corridorBoost),
  };
}

/** Winter sidewalk ice sheen — no planar reflector, cooler metal gloss. */
export function getWinterIceSheenSettings(): {
  groundColor: string;
  dryRoughness: number;
  dryMetalness: number;
  sheenBoost: number;
} {
  return {
    groundColor: '#a8b0c0',
    dryRoughness: 0.36,
    dryMetalness: 0.34,
    sheenBoost: 0.12,
  };
}

/**
 * Rain-wet sidewalk knobs for street_night concrete strip
 * (ground uses planar reflector; sidewalk is a raised mesh).
 */
export function getRainWetSidewalkSettings(rainIntensity: number): {
  roughness: number;
  metalness: number;
} {
  const t = Math.min(1, Math.max(0, rainIntensity));
  return {
    roughness: Math.max(0.28, 0.86 - t * 0.48),
    metalness: Math.min(0.28, 0.04 + t * 0.22),
  };
}

/**
 * Rain-wet wooden pier plank deck — darker sheen than asphalt apron.
 */
export function getRainWetPlankSettings(rainIntensity: number): {
  roughness: number;
  metalness: number;
} {
  const t = Math.min(1, Math.max(0, rainIntensity));
  return {
    roughness: Math.max(0.28, 0.9 - t * 0.52),
    metalness: Math.min(0.32, 0.05 + t * 0.24),
  };
}

export interface ReflectorMaterialSettings {
  resolution: number;
  blur: [number, number];
  mixStrength: number;
}

/** Tiered reflector cost — medium is lightest; high lighter than ultra. */
export function getReflectorMaterialSettings(
  presetId: Exclude<QualityPresetId, 'auto'>,
): ReflectorMaterialSettings {
  if (presetId === 'ultra') {
    return { resolution: 512, blur: [256, 128], mixStrength: 0.65 };
  }
  if (presetId === 'high') {
    return { resolution: 384, blur: [192, 96], mixStrength: 0.55 };
  }
  // medium (and low fallback if ever gated)
  return { resolution: 256, blur: [128, 64], mixStrength: 0.4 };
}

/**
 * Scale planar reflector mix by live rain intensity.
 * Keeps a faint wet sheen at light rain; full preset strength in a storm.
 */
export function scaleReflectorMixStrength(baseMix: number, rainIntensity: number): number {
  const t = Math.min(1, Math.max(0, rainIntensity));
  return baseMix * (0.25 + 0.75 * t);
}
