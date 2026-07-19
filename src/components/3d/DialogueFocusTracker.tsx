/* ─── Volodka RPG – Dialogue Focus Tracker ───
 *
 *  Subscribes to interaction / scene events and syncs the module-level
 *  `dialogueFocusTarget` singleton with the NPC currently in dialogue.
 *
 *  The tracker is rendered inside the R3F canvas (always-mounted, returns null).
 *  It performs no per-frame work — only event-driven updates.
 */

import { useEffect } from 'react';
import { eventBus } from '@/engine/EventBus';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { dialogueFocusTarget } from '@/engine/graphics/dialogueFocusTarget';

/**
 * Mount this component anywhere inside the always-mounted canvas subtree.
 * It syncs `dialogueFocusTarget` with the active dialogue NPC.
 */
export function DialogueFocusTracker() {
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      eventBus.on('interaction:state_change', ({ state, npcId }) => {
        if (state === InteractionState.Dialogue) {
          // Entering dialogue — set focus target to the NPC.
          if (npcId) {
            dialogueFocusTarget.setActive(npcId);
          }
        } else if (
          state === InteractionState.Exit
          || state === InteractionState.Idle
        ) {
          // Leaving dialogue — clear focus target.
          dialogueFocusTarget.setActive(null);
        }
        // Approach / Cutscene / Align / Lock — leave focus target unchanged
        // (it may still be set from a previous dialogue, but that's fine —
        // the consumer only reads it when active).
      }),
    );

    // Clear on scene transitions — prevents stale focus target across scenes.
    unsubs.push(
      eventBus.on('scene:transition_start', () => {
        dialogueFocusTarget.clear();
      }),
    );
    unsubs.push(
      eventBus.on('scene:enter', () => {
        dialogueFocusTarget.clear();
      }),
    );

    return () => {
      unsubs.forEach((u) => u());
      // Defensive: clear on unmount (canvas torn down).
      dialogueFocusTarget.clear();
    };
  }, []);

  return null;
}
