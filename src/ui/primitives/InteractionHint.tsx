'use client';

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { TriggerZone } from '@/data/rpgTypes';
import { isPlayerInTriggerZone } from '@/ui/game/InteractiveTrigger';

export const EXPLORATION_INTERACTION_HINT_MAX_DISTANCE = 3.15;

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
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = hintRef.current;
    if (!el) return;
    let show = false;
    if (!enabled || availableInteractionIds.size === 0) {
      el.hidden = true;
      return;
    }
    const pos = playerPositionRef.current;
    if (pos) {
      for (const trigger of sceneTriggers) {
        if (!trigger.interactionId || !availableInteractionIds.has(trigger.interactionId)) continue;
        if (!isPlayerInTriggerZone(pos, trigger)) continue;
        const dx = pos.x - trigger.position.x;
        const dy = pos.y - trigger.position.y;
        const dz = pos.z - trigger.position.z;
        const d = Math.hypot(dx, dy, dz);
        if (d <= distanceThreshold) {
          show = true;
          break;
        }
      }
    }
    el.hidden = !show;
  }, [enabled, tick, sceneTriggers, availableInteractionIds, playerPositionRef, distanceThreshold]);

  return (
    <div
      ref={hintRef}
      hidden
      className="pointer-events-none fixed bottom-28 left-1/2 z-[60] -translate-x-1/2 rounded-md border border-cyan-500/40 bg-black/70 px-4 py-2 font-mono text-xs tracking-wide text-cyan-200 shadow-lg"
    >
      <span className="text-cyan-400">[E]</span> Взаимодействие
    </div>
  );
}
