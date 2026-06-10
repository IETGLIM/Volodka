import type { TriggerZone } from '@/data/triggerZones';

/** Linked narrative/minigame that requires explicit Continue from ExaminePanel. */
export function zoneHasLinkedContent(
  zone: Pick<TriggerZone, 'linkedDialogueNodeId' | 'linkedStoryNodeId' | 'linkedMinigame'>,
): boolean {
  return !!(zone.linkedDialogueNodeId || zone.linkedStoryNodeId || zone.linkedMinigame);
}

/**
 * One-time examine zones with linked content must not burn until the player
 * presses Continue — otherwise ESC closes the panel and permanently blocks dialogue.
 */
export function shouldDeferOneTimeMark(
  zone: Pick<
    TriggerZone,
    'isOneTime' | 'examineData' | 'linkedDialogueNodeId' | 'linkedStoryNodeId' | 'linkedMinigame'
  >,
): boolean {
  if (!zone.isOneTime || !zone.examineData) return false;
  return zoneHasLinkedContent(zone);
}
