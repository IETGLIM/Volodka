import type { SceneId } from '@/shared/types/game';
import type { TriggerZone } from '@/data/triggerZones';
import { findTriggerZoneByNpcId, TRIGGER_ZONES } from '@/data/triggerZones';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';

export type NpcNarrativeTarget =
  | { kind: 'story'; nodeId: string }
  | { kind: 'dialogue'; nodeId: string }
  | { kind: 'default_dialogue'; nodeId: string };

/** Scene-first NPC zone lookup — avoids corridor zone winning in other scenes. */
export function findNpcTriggerZoneForScene(
  npcId: string,
  sceneId: SceneId,
  fallbackDialogueNodeId?: string,
  zones: readonly TriggerZone[] = TRIGGER_ZONES,
): TriggerZone | undefined {
  return (
    findTriggerZoneByNpcId(zones, npcId, sceneId)
    ?? (fallbackDialogueNodeId
      ? zones.find(
          (z) => z.linkedDialogueNodeId === fallbackDialogueNodeId && z.sceneId === sceneId,
        )
      : undefined)
  );
}

/**
 * Resolve which narrative node to open when the player talks to an NPC.
 * Zone-linked story/dialogue in the current scene takes priority over the NPC default.
 */
export function resolveNpcNarrativeTarget(
  npcId: string,
  defaultDialogueNodeId: string | undefined,
  sceneId?: SceneId,
): NpcNarrativeTarget | null {
  const currentScene = sceneId ?? getGameSnapshot().exploration.currentSceneId;
  const zone = findNpcTriggerZoneForScene(npcId, currentScene, defaultDialogueNodeId);

  if (zone?.linkedStoryNodeId) {
    return { kind: 'story', nodeId: zone.linkedStoryNodeId };
  }
  if (zone?.linkedDialogueNodeId) {
    return { kind: 'dialogue', nodeId: zone.linkedDialogueNodeId };
  }
  if (defaultDialogueNodeId) {
    return { kind: 'default_dialogue', nodeId: defaultDialogueNodeId };
  }
  return null;
}
