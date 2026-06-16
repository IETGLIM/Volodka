/* ─── Volodka RPG – NPC GLB animation: event bus + schedule activity ─── */

import { useEffect } from 'react';
import type * as THREE from 'three';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { useNPCAnimation } from '@/engine/npc/useNPCAnimation';
import type { NpcAnimationClipOverrides } from '@/engine/npc/npcClipResolution';
import {
  resolveInteractionNpcAnimationState,
  resolveNpcAnimationFromActivity,
  shouldDeferToInteractionAnimation,
} from '@/engine/npc/npcActivityAnimation';

export interface UseNpcAnimationControllerOptions {
  npcId: string;
  actions: Record<string, THREE.AnimationAction> | null | undefined;
  clipOverrides?: NpcAnimationClipOverrides;
  activity: string;
  interactionState: InteractionState;
  isInteractionTarget: boolean;
}

/**
 * Crossfades NPC GLB clips from schedule/patrol activity and `npc:animation` events.
 */
export function useNpcAnimationController({
  npcId,
  actions,
  clipOverrides,
  activity,
  interactionState,
  isInteractionTarget,
}: UseNpcAnimationControllerOptions) {
  const { crossfadeTo } = useNPCAnimation(npcId, actions, clipOverrides);

  useEffect(() => {
    if (shouldDeferToInteractionAnimation(interactionState, isInteractionTarget)) {
      crossfadeTo(resolveInteractionNpcAnimationState(interactionState));
      return;
    }
    crossfadeTo(resolveNpcAnimationFromActivity(activity));
  }, [activity, interactionState, isInteractionTarget, crossfadeTo]);

  return { crossfadeTo };
}
