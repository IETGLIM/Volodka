/* ─── Volodka RPG – NPC Animation State Hook ─── */

import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';import {
  resolveNpcClipAction,
  type NpcAnimationClipOverrides,
} from '@/engine/npc/npcClipResolution';

/**
 * Hook that manages NPC animation state with crossfade.
 *
 * Clip actions come from embedded GLB clips plus optional overrides loaded from
 * `public/models/animations/` via `useMixamoAnimationClips` (see mixamoAnimationCatalog).
 *
 * Bus-driven overrides are handled by `useNpcVisualBehavior`; this hook only crossfades.
 */
export function useNPCAnimation(
  _npcId: string,  actions: Record<string, THREE.AnimationAction> | null | undefined,
  clipOverrides?: NpcAnimationClipOverrides,
) {
  const currentAnimRef = useRef<NPCAnimationState>('idle');
  const crossfadeDuration = 0.3;

  const findAction = useCallback(
    (state: NPCAnimationState): THREE.AnimationAction | null =>
      resolveNpcClipAction(state, actions, clipOverrides),
    [actions, clipOverrides],
  );

  const applyState = useCallback(
    (newState: NPCAnimationState, options?: { force?: boolean }) => {
      if (!actions) return;
      if (!options?.force && newState === currentAnimRef.current) return;

      currentAnimRef.current = newState;

      const targetAction = findAction(newState);
      if (!targetAction) return;

      for (const action of Object.values(actions)) {
        if (action === targetAction) {
          action.reset().fadeIn(crossfadeDuration).play();
        } else {
          action.fadeOut(crossfadeDuration);
        }
      }
    },
    [actions, findAction],
  );

  const crossfadeTo = useCallback(
    (newState: NPCAnimationState) => {
      applyState(newState);
    },
    [applyState],
  );

  // Force-idle ONLY on the very first action population — when the mixer
  // transitions from "no actions" to "has actions". Subsequent action
  // additions (deferred Mixamo clips loading one by one) should NOT
  // re-trigger the force-idle, because that would reset the currently-
  // playing action to frame 0 and cause a visible "stumble" each time
  // a new clip loads (4 deferred clips = 4 stumbles).
  const hasBoundInitialRef = useRef(false);
  useEffect(() => {
    if (hasBoundInitialRef.current) return;
    const idleAction = findAction('idle');
    if (!idleAction) return;
    hasBoundInitialRef.current = true;
    applyState('idle', { force: true });
  }, [applyState, findAction]);

  // Reset the initial-bound flag if the entire actions object is replaced
  // (e.g. mixer recreated on scene change) so the force-idle can re-fire.
  useEffect(() => {
    if (!actions) {
      hasBoundInitialRef.current = false;
    }
  }, [actions]);

  useEffect(() => {
    return () => {
      if (!actions) return;
      for (const action of Object.values(actions)) {
        action?.stop();
      }
    };
  }, [actions]);

  return {
    currentAnim: currentAnimRef,
    crossfadeTo,
  };
}
