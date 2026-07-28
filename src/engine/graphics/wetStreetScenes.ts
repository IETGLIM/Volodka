import type { SceneId } from '@/shared/types/game';
import type { QualityPresetId } from './qualityPresets';

/**
 * Scenes with rain-wet planar ground reflections.
 * Winter uses WetStreetGround ice sheen without planar reflector.
 */
export const WET_STREET_SCENE_IDS = [
  'street_night',
  'city_square',
  'river_pier',
  'pier_evening',
] as const satisfies readonly SceneId[];

export type WetStreetSceneId = (typeof WET_STREET_SCENE_IDS)[number];

export function isWetStreetScene(sceneId: SceneId): sceneId is WetStreetSceneId {
  return (WET_STREET_SCENE_IDS as readonly string[]).includes(sceneId);
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
  'chk_campfire_night',
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
  if (sceneId === 'chk_campfire_night') {
    return { roughness: 0.72, metalness: 0.08, oilMetalness: 0.2, oilRoughness: 0.45 };
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
