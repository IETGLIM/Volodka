/**
 * Interaction zone routing helper — NOT zone visual presentation.
 *
 * This module contains only `shouldOpenLinkedStoryDirectly`, a small routing
 * utility that decides whether a trigger zone should open a story node
 * immediately on interaction (one E-press flow).
 *
 * Actual zone **visual** presentation (rendering, highlight rings, proximity
 * prompts, etc.) lives in:
 *   - `TriggerZoneComponent.tsx`  — 3D trigger zone meshes & debug visuals
 *   - `InteractiveTriggers.tsx`   — HUD prompts & interaction affordances
 *
 * If you came here looking for how zones look or animate, check those files
 * instead.
 */

import type { TriggerZone } from '@/data/triggerZones';

/** Story doors — one E press, no examine-then-continue friction. */
export function shouldOpenLinkedStoryDirectly(
  zone: Pick<TriggerZone, 'interactionType' | 'linkedStoryNodeId'>,
): boolean {
  return zone.interactionType === 'open' && zone.linkedStoryNodeId != null;
}
