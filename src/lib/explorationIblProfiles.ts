/**
 * Профили IBL для обхода (`@react-three/drei` `Environment preset`): без HDR-бинарников в репозитории.
 * Согласование volodka / district / mvd / интерьеры — разные пресеты и сила environment map.
 */

import type { SceneId } from '@/data/types';

/** Совпадает с доступными пресетами drei `Environment`. */
export type ExplorationIblPreset =
  | 'city'
  | 'sunset'
  | 'night'
  | 'warehouse'
  | 'forest'
  | 'studio'
  | 'apartment'
  | 'park'
  | 'lobby';

export type ExplorationIblProfile = {
  preset: ExplorationIblPreset | null;
  /** drei `Environment` — интенсивность отражений на PBR. */
  environmentIntensity: number;
};

export function getExplorationIblProfile(params: {
  sceneId: SceneId;
  visualLite: boolean;
  introCutsceneActive: boolean;
}): ExplorationIblProfile {
  const { sceneId, visualLite, introCutsceneActive } = params;
  if (visualLite || introCutsceneActive) {
    return { preset: null, environmentIntensity: 0 };
  }

  switch (sceneId) {
    case 'volodka_room':
    case 'blue_pit':
    case 'office_morning':
      return { preset: 'city', environmentIntensity: 0.46 };
    case 'district':
    case 'mvd':
      return { preset: 'city', environmentIntensity: 0.54 };
    case 'street_night':
    case 'street_winter':
      return { preset: 'city', environmentIntensity: 0.48 };
    case 'zarema_albert_room':
    case 'kitchen_night':
      return { preset: 'apartment', environmentIntensity: 0.42 };
    case 'volodka_corridor':
      return { preset: 'warehouse', environmentIntensity: 0.38 };
    default:
      return { preset: 'warehouse', environmentIntensity: 0.36 };
  }
}

/** При активном IBL снижаем «плоский» ambient относительно заполнения из HDR. */
export function explorationAmbientWithIbl(baseAmbientPlusBump: number, iblActive: boolean): number {
  if (!iblActive) return baseAmbientPlusBump;
  return baseAmbientPlusBump * 0.78;
}
