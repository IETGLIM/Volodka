/** After WorldMap travel — pin / pulse the active quest objective at destination. */

import { eventBus } from '@/engine/EventBus';
import { getQuestDefinitions } from '@/data/gameDataLoader';
import { getNextTrackedObjective, getQuestMarker } from '@/store/questStore';
import type { QuestState, SceneId } from '@/shared/types/game';

export type TravelQuestPin = {
  questId: string;
  title: string;
  sceneId: SceneId;
  /** Next incomplete objective description when available. */
  objectiveText?: string;
  priority: number;
};

const QUEST_TYPE_PRIORITY: Record<string, number> = {
  main: 0,
  side: 1,
  daily: 2,
  hidden: 3,
};

function questPriority(questType: string | undefined): number {
  return QUEST_TYPE_PRIORITY[questType ?? ''] ?? 9;
}

/**
 * Prefer main quests over side/hidden when several active markers land on the
 * destination scene. Within the same type, keep definition order.
 */
export function resolveTravelQuestPin(
  destinationSceneId: SceneId,
  activeQuests: readonly QuestState[],
): TravelQuestPin | null {
  const defs = getQuestDefinitions();
  const candidates: TravelQuestPin[] = [];

  for (const quest of activeQuests) {
    if (quest.status !== 'active') continue;
    const marker = getQuestMarker(quest.questId);
    if (!marker?.sceneId || marker.sceneId !== destinationSceneId) continue;
    const def = defs.find((d) => d.id === quest.questId);
    const title = def?.title ?? quest.questId;
    const next = getNextTrackedObjective(quest.questId);
    candidates.push({
      questId: quest.questId,
      title,
      sceneId: destinationSceneId,
      objectiveText: next?.description,
      priority: questPriority(def?.questType),
    });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title, 'ru'));
  return candidates[0] ?? null;
}

/** Emit marker pulse + short HUD cue after fast-travel arrives. */
export function emitTravelQuestPinOnArrival(pin: TravelQuestPin): void {
  eventBus.emit('quest:pulse_marker', {
    questId: pin.questId,
    sceneId: pin.sceneId,
  });
  const detail = pin.objectiveText ? `${pin.title} — ${pin.objectiveText}` : pin.title;
  eventBus.emit('ui:exploration_message', {
    text: `Цель: ${detail}`,
  });
}
