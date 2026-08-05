import { getSceneVisualProfile, isHeroScene } from '@/config/sceneVisualProfiles';
import { tierFromPresetId } from '@/engine/graphics/fxGovernor';
import type { SceneId } from '@/shared/types/game';

export const MAX_AMBIENT_NPC_INSTANCES = 16;

/** Scale background NPC count by hero scene and graphics tier — AAA density */
export function resolveAmbientNpcCount(
  sceneId: SceneId,
  baseCount: number,
  presetId: string,
): number {
  if (baseCount <= 0) return 0;

  let boost = 2; // base AAA lift
  if (isHeroScene(sceneId)) {
    const tier = tierFromPresetId(presetId);
    boost += tier === 'ultra' ? 6 : tier === 'high' ? 4 : tier === 'medium' ? 2 : 1;
    boost += getSceneVisualProfile(sceneId).ambientNpcCountBoost ?? 0;
  } else {
    const tier = tierFromPresetId(presetId);
    boost += tier === 'ultra' ? 3 : tier === 'high' ? 2 : 0;
  }

  return Math.min(baseCount + boost, MAX_AMBIENT_NPC_INSTANCES);
}

/** Hero districts feel more populated — slightly less ghostly silhouettes. */
export function resolveAmbientNpcOpacity(sceneId: SceneId, baseOpacity: number): number {
  if (!isHeroScene(sceneId)) return baseOpacity;
  return Math.min(0.85, baseOpacity + 0.16);
}
