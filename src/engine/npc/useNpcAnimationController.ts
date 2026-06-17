/* ─── Volodka RPG – NPC GLB animation: state machine + event bus ─── */

import { useEffect } from 'react';
import type * as THREE from 'three';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { useNPCAnimation } from '@/engine/npc/useNPCAnimation';
import type { NpcAnimationClipOverrides } from '@/engine/npc/npcClipResolution';
import { shouldDeferToInteractionAnimation } from '@/engine/npc/npcActivityAnimation';
import {
  npcBehaviorToAnimationState,
  resolveNpcBehaviorState,
} from '@/engine/npc/npcStateMachine';
import { setNpcBehaviorState } from '@/engine/interaction/npcRegistry';
import { useGamePhase } from '@/store/selectors';

export interface UseNpcAnimationControllerOptions {
  npcId: string;
  actions: Record<string, THREE.AnimationAction> | null | undefined;
  clipOverrides?: NpcAnimationClipOverrides;
  activity: string;
  patrolActivity?: 'idle' | 'walk';
  interactionState: InteractionState;
  isInteractionTarget: boolean;
}

/**
 * Crossfades NPC GLB clips from behavioral state machine and `npc:animation` events.
 */
export function useNpcAnimationController({
  npcId,
  actions,
  clipOverrides,
  activity,
  patrolActivity,
  interactionState,
  isInteractionTarget,
}: UseNpcAnimationControllerOptions) {
  const gamePhase = useGamePhase();
  const { crossfadeTo } = useNPCAnimation(npcId, actions, clipOverrides);

  useEffect(() => {
    if (shouldDeferToInteractionAnimation(interactionState, isInteractionTarget)) {
      const behavior = resolveNpcBehaviorState({
        activity,
        patrolActivity,
        interactionState,
        isInteractionTarget,
        inCombat: gamePhase === 'combat',
      });
      setNpcBehaviorState(npcId, behavior);
      crossfadeTo(npcBehaviorToAnimationState(behavior));
      return;
    }

    const behavior = resolveNpcBehaviorState({
      activity,
      patrolActivity,
      interactionState,
      isInteractionTarget,
      inCombat: gamePhase === 'combat',
    });
    setNpcBehaviorState(npcId, behavior);
    crossfadeTo(npcBehaviorToAnimationState(behavior));
  }, [
    activity,
    patrolActivity,
    interactionState,
    isInteractionTarget,
    gamePhase,
    npcId,
    crossfadeTo,
  ]);

  return { crossfadeTo };
}
