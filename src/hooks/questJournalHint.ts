/** Contextual journal / HUD hints for active quests. */

import { getSceneConfig } from '@/config/scenes';
import { getFirstReadingHint } from '@/engine/guidedStory/firstReadingHint';
import {
  getIncidentScrollHint,
  getMariaConnectionHint,
  getPoetryCollectionHint,
} from '@/engine/guidedStory/act1QuestHints';
import { buildGuidanceDirectionHint } from '@/engine/guidedStory/guidanceLocation';
import {
  getNextTrackedObjective,
  getQuestMarker,
} from '@/store/questStore';
import type { SceneId } from '@/shared/types/game';

/**
 * Prefer live Act-1 spine cues; otherwise next objective + scene travel hint.
 */
export function buildQuestJournalContextualHint(
  questId: string,
  currentSceneId: SceneId,
): string | null {
  if (questId === 'first_reading') {
    const early = getFirstReadingHint();
    if (early) return early;
  }
  if (questId === 'maria_connection') {
    const live = getMariaConnectionHint();
    if (live) return live;
  }
  if (questId === 'incident_scroll_4729') {
    const live = getIncidentScrollHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'poetry_collection') {
    const live = getPoetryCollectionHint();
    if (live) return live;
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

/** Short route CTA when the quest marker is off-scene. */
export function buildQuestJournalRouteCta(
  questId: string,
  currentSceneId: SceneId,
): string | null {
  const marker = getQuestMarker(questId);
  if (!marker?.sceneId || marker.sceneId === currentSceneId) return null;
  const name = getSceneConfig(marker.sceneId).name;
  return `Маршрут → ${name}`;
}
