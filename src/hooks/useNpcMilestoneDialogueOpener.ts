/* ─── Volodka RPG – NPC relation milestone → dialogue opener ───
 * Always-mounted hook (called from the orchestrator) that listens for
 * `npc:relation_milestone` events and auto-opens the linked dialogue node
 * when no other narrative overlay is active.
 *
 * Why a separate hook AND the listener in DialogueRenderer.tsx?
 *  - DialogueRenderer is only mounted while a dialogue overlay is active,
 *    so its listener cannot catch milestones fired from OUTSIDE a dialogue
 *    (e.g. a gift given from the NPC relationship panel).
 *  - This hook is mounted for the whole gameplay session, so it catches
 *    those out-of-dialogue milestones.
 *  - Both listeners share `consumeMilestoneDialogue` for dedup — whichever
 *    fires first wins; the other skips.
 */

import { useEffect, useRef } from 'react';
import { eventBus } from '@/engine/EventBus';
import { openNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { consumeMilestoneDialogue } from '@/engine/npc/npcMilestoneDialogueDedup';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';

/**
 * Subscribe to `npc:relation_milestone` for the lifetime of the calling
 * component. When a milestone fires AND no narrative overlay is active,
 * opens the milestone dialogue node. Mid-dialogue milestones are left for
 * DialogueRenderer to queue.
 */
export function useNpcMilestoneDialogueOpener(): void {
  // Track whether a narrative overlay is currently active. Updated on every
  // store change so the event listener (registered once) always reads the
  // freshest value.
  const overlayActiveRef = useRef(false);

  useEffect(() => {
    const unsubscribeStore = useGameStore.subscribe((state) => {
      // Any of these flags being true means a narrative/cutscene/combat
      // overlay is active — we must not interrupt it with a milestone popup.
      overlayActiveRef.current =
        state.showStoryOverlay ||
        state.combatActive ||
        state.introActive ||
        state.mainMenuOpen ||
        state.activeCutsceneId !== null;
    });
    return () => {
      unsubscribeStore();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = eventBus.on('npc:relation_milestone', (payload) => {
      // Don't auto-open during menu/intro/cutscene/combat/active dialogue —
      // those phases own the screen and a milestone popup would interrupt.
      const state = useGameStore.getState();
      const phase = readGamePhase({
        mainMenuOpen: state.mainMenuOpen,
        introActive: state.introActive,
        combatActive: state.combatActive,
        activeCutsceneId: state.activeCutsceneId,
      });
      if (phase !== 'exploration') return;
      if (overlayActiveRef.current) return;

      // Dedup: DialogueRenderer's listener may have already consumed this
      // milestone (e.g. if a dialogue is open and the player picked a choice
      // that crossed a threshold). If so, skip.
      if (!consumeMilestoneDialogue(payload.npcId, payload.milestoneValue)) return;

      openNarrativeOverlay(payload.dialogueNodeId, 'dialogue');
    });
    return () => {
      unsubscribe();
    };
  }, []);
}
