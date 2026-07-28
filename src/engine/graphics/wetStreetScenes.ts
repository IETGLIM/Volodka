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
