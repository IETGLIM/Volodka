/** After WorldMap travel — pin / pulse the active quest objective at destination. */

import { eventBus } from '@/engine/EventBus';
import { getQuestDefinitions } from '@/data/gameDataLoader';
import { getQuestMarker } from '@/store/questStore';
import type { QuestState, SceneId } from '@/shared/types/game';

export type TravelQuestPin = {
  questId: string;
  title: string;
  sceneId: SceneId;
};

/** Prefer first active quest whose marker lands on the destination scene. */
export function resolveTravelQuestPin(
  destinationSceneId: SceneId,
  activeQuests: readonly QuestState[],
): TravelQuestPin | null {
  const defs = getQuestDefinitions();
  for (const quest of activeQuests) {
    if (quest.status !== 'active') continue;
    const marker = getQuestMarker(quest.questId);
    if (!marker?.sceneId || marker.sceneId !== destinationSceneId) continue;
    const title = defs.find((d) => d.id === quest.questId)?.title ?? quest.questId;
    return { questId: quest.questId, title, sceneId: destinationSceneId };
  }
  return null;
}

/** Emit marker pulse + short HUD cue after fast-travel arrives. */
export function emitTravelQuestPinOnArrival(pin: TravelQuestPin): void {
  eventBus.emit('quest:pulse_marker', {
    questId: pin.questId,
    sceneId: pin.sceneId,
  });
  eventBus.emit('ui:exploration_message', {
    text: `Цель: ${pin.title}`,
  });
}
