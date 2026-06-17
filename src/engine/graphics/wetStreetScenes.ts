import type { SceneId } from '@/shared/types/game';
import type { QualityPresetId } from './qualityPresets';

/** Night street scenes with rain-wet planar ground reflections (not winter). */
export const WET_STREET_SCENE_IDS = ['street_night', 'city_square'] as const satisfies readonly SceneId[];

export type WetStreetSceneId = (typeof WET_STREET_SCENE_IDS)[number];

export function isWetStreetScene(sceneId: SceneId): sceneId is WetStreetSceneId {
  return (WET_STREET_SCENE_IDS as readonly string[]).includes(sceneId);
}

export interface ReflectorMaterialSettings {
  resolution: number;
  blur: [number, number];
  mixStrength: number;
}

/** Tiered reflector cost — high uses a lighter buffer than ultra. */
export function getReflectorMaterialSettings(
  presetId: Exclude<QualityPresetId, 'auto'>,
): ReflectorMaterialSettings {
  if (presetId === 'ultra') {
    return { resolution: 512, blur: [256, 128], mixStrength: 0.65 };
  }
  return { resolution: 384, blur: [192, 96], mixStrength: 0.55 };
}
