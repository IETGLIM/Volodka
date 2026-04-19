'use client';

import { useMemo } from 'react';
import type { RefObject } from 'react';
import type { TriggerZone } from '@/data/rpgTypes';
import { isPlayerInTriggerZone } from '@/components/game/InteractiveTrigger';

export const EXPLORATION_INTERACTION_HINT_MAX_DISTANCE = 2.85;

type InteractionHintProps = {
  enabled: boolean;
  tick: number;
  sceneTriggers: TriggerZone[];
  availableInteractionIds: ReadonlySet<string>;
  playerPositionRef: RefObject<{ x: number; y: number; z: number } | null>;
  distanceThreshold?: number;
};

/**
 * Lightweight prompt when the player stands in an `interactionId` trigger zone.
 */
export function InteractionHint({
  enabled,
  tick,
  sceneTriggers,
  availableInteractionIds,
  playerPositionRef,
  distanceThreshold = EXPLORATION_INTERACTION_HINT_MAX_DISTANCE,
}: InteractionHintProps) {
  const show = useMemo(() => {
    void tick;
    if (!enabled || availableInteractionIds.size === 0) return false;
    const pos = playerPositionRef.current;
    if (!pos) return false;
    for (const trigger of sceneTriggers) {
      if (!trigger.interactionId || !availableInteractionIds.has(trigger.interactionId)) continue;
      if (!isPlayerInTriggerZone(pos, trigger)) continue;
      const dx = pos.x - trigger.position.x;
      const dy = pos.y - trigger.position.y;
      const dz = pos.z - trigger.position.z;
      const d = Math.hypot(dx, dy, dz);
      if (d <= distanceThreshold) return true;
    }
    return false;
  }, [enabled, tick, sceneTriggers, availableInteractionIds, playerPositionRef, distanceThreshold]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed bottom-28 left-1/2 z-[60] -translate-x-1/2 rounded-md border border-cyan-500/40 bg-black/70 px-4 py-2 font-mono text-xs tracking-wide text-cyan-200 shadow-lg">
      <span className="text-cyan-400">[E]</span> Interact
    </div>
  );
}
