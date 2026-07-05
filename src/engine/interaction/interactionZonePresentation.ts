import type { TriggerZone } from '@/data/triggerZones';

/** Story doors — one E press, no examine-then-continue friction. */
export function shouldOpenLinkedStoryDirectly(
  zone: Pick<TriggerZone, 'interactionType' | 'linkedStoryNodeId'>,
): boolean {
  return zone.interactionType === 'open' && zone.linkedStoryNodeId != null;
}
