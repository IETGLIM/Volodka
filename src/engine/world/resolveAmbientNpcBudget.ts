import { getSceneVisualProfile, isHeroScene } from '@/config/sceneVisualProfiles';
import { tierFromPresetId } from '@/engine/graphics/fxGovernor';
import type { SceneId } from '@/shared/types/game';

export const MAX_AMBIENT_NPC_INSTANCES = 8;

/** Scale background NPC count by hero scene and graphics tier. */
export function resolveAmbientNpcCount(
  sceneId: SceneId,
  baseCount: number,
  presetId: string,
): number {
  if (baseCount <= 0) return 0;

  let boost = 0;
  if (isHeroScene(sceneId)) {
    const tier = tierFromPresetId(presetId);
    boost = tier === 'high' ? 2 : tier === 'medium' ? 1 : 0;
    boost += getSceneVisualProfile(sceneId).ambientNpcCountBoost ?? 0;
  }

  return Math.min(baseCount + boost, MAX_AMBIENT_NPC_INSTANCES);
}

/** Hero districts feel more populated — slightly less ghostly silhouettes. */
export function resolveAmbientNpcOpacity(sceneId: SceneId, baseOpacity: number): number {
  if (!isHeroScene(sceneId)) return baseOpacity;
  return Math.min(0.85, baseOpacity + 0.16);
}
