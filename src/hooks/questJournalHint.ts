/** Contextual journal / HUD hints for active quests. */

import { getSceneConfig } from '@/config/scenes';
import { getFirstReadingHint } from '@/engine/guidedStory/firstReadingHint';
import { buildGuidanceDirectionHint } from '@/engine/guidedStory/guidanceLocation';
import {
  getNextTrackedObjective,
  getQuestMarker,
} from '@/store/questStore';
import type { SceneId } from '@/shared/types/game';

/**
 * Prefer live first_reading desk/monitor cue; otherwise next objective + scene travel hint.
 */
export function buildQuestJournalContextualHint(
  questId: string,
  currentSceneId: SceneId,
): string | null {
  if (questId === 'first_reading') {
    const early = getFirstReadingHint();
    if (early) return early;
  }

  const next = getNextTrackedObjective(questId);
  if (!next) return null;

  const marker = getQuestMarker(questId);
  const direction = buildGuidanceDirectionHint(marker?.sceneId, currentSceneId);

  if (direction && marker?.sceneId && marker.sceneId !== currentSceneId) {
    return `${next.description} · ${direction}`;
  }
  if (direction && marker?.sceneId === currentSceneId) {
    return `${next.description} · ${direction}`;
  }
  if (marker?.sceneId && marker.sceneId !== currentSceneId) {
    const name = getSceneConfig(marker.sceneId).name;
    return `${next.description} · Перейдите: ${name}`;
  }
  return next.description;
}
