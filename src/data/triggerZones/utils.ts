/* ─── Volodka RPG – trigger zone utilities ─── */

import type { TriggerZone } from './types';
import type { InteractionType } from '@/shared/types/game';
import type { ActiveTTLFlagMap } from '@/shared/activeTTLFlags';
import { isActiveTTLFlagLive } from '@/shared/activeTTLFlags';

export const INTERACTION_LABELS: Record<InteractionType, string> = {
  examine: 'Осмотреть',
  read: 'Прочитать',
  take: 'Взять',
  hack: 'Взломать',
  open: 'Открыть',
  talk: 'Поговорить',
  use: 'Использовать',
  push: 'Толкнуть',
  default: 'Взаимодействовать',
};

export function findTriggerZoneByNpcId(
  zones: readonly TriggerZone[],
  npcId: string,
  sceneId?: string,
): TriggerZone | undefined {
  if (sceneId) {
    return zones.find((z) => z.linkedNpcId === npcId && z.sceneId === sceneId);
  }
  return zones.find((z) => z.linkedNpcId === npcId);
}

export function findTriggerZoneByDialogueNodeId(
  zones: readonly TriggerZone[],
  dialogueNodeId: string,
): TriggerZone | undefined {
  return zones.find((z) => z.linkedDialogueNodeId === dialogueNodeId);
}

/** Whether a trigger zone is visible/interactable for the current player state. */
export function isTriggerZoneAvailable(
  zone: TriggerZone,
  flags: Record<string, boolean | undefined>,
  currentAct: number,
  activeTTLFlags?: ActiveTTLFlagMap,
): boolean {
  if (zone.requiredAct && currentAct < zone.requiredAct) return false;
  if (zone.requiredFlag && !flags[zone.requiredFlag]) return false;
  if (zone.hiddenWhenFlag && flags[zone.hiddenWhenFlag]) return false;
  if (zone.hiddenUntilPoemFlag && !isActiveTTLFlagLive(activeTTLFlags, zone.hiddenUntilPoemFlag)) {
    return false;
  }
  return true;
}
