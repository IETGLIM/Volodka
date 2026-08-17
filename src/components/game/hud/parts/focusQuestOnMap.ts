/** Focus active quest on world map + pulse in-world waypoint. */

import { eventBus } from '@/engine/EventBus';
import { getQuestMarker } from '@/store/questStore';
import type { SceneId } from '@/shared/types/game';

export type FocusQuestOnMapResult = 'map' | 'pulse_only' | 'none';

/**
 * Pulse the quest marker; open world map when the objective is off-scene.
 * Same shipping pattern as QuestsPanel objective click.
 */
export function focusQuestOnMap(
  questId: string,
  currentSceneId: SceneId,
): FocusQuestOnMapResult {
  const marker = getQuestMarker(questId);
  if (!marker?.sceneId) {
    eventBus.emit('quest:pulse_marker', { questId });
    return 'none';
  }

  eventBus.emit('quest:pulse_marker', {
    questId,
    sceneId: marker.sceneId,
  });

  if (marker.sceneId !== currentSceneId) {
    eventBus.emit('ui:open_panel', {
      panel: 'worldMap',
      sceneId: marker.sceneId,
      questId,
    });
    return 'map';
  }

  return 'pulse_only';
}
