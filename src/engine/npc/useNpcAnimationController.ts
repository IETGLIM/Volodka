/* ─── Volodka RPG – NPC GLB animation: state machine + event bus ─── */

import { useEffect } from 'react';
import type * as THREE from 'three';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { useNPCAnimation } from '@/engine/npc/useNPCAnimation';
import type { NpcAnimationClipOverrides } from '@/engine/npc/npcClipResolution';
import {
  resolveNpcActivityClipOverrides,
  resolveNpcAnimationFromActivity,
  shouldDeferToInteractionAnimation,
} from '@/engine/npc/npcActivityAnimation';
import {
  npcBehaviorToAnimationState,
  resolveNpcBehaviorState,
} from '@/engine/npc/npcStateMachine';
import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';
import type { GamePhase } from '@/shared/gamePhase';
import { setNpcBehaviorState } from '@/engine/interaction/npcRegistry';

export interface UseNpcAnimationControllerOptions {
  npcId: string;
  actions: Record<string, THREE.AnimationAction> | null | undefined;
  clipOverrides?: NpcAnimationClipOverrides;
  activity: string;
  patrolActivity?: 'idle' | 'walk';
  interactionState: InteractionState;
  isInteractionTarget: boolean;
  gamePhase: GamePhase;
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
  gamePhase,
}: UseNpcAnimationControllerOptions) {
  const activityClipOverrides = resolveNpcActivityClipOverrides(activity);
  const mergedClipOverrides =
    activityClipOverrides || clipOverrides
      ? { ...clipOverrides, ...activityClipOverrides }
      : clipOverrides;

  const { crossfadeTo } = useNPCAnimation(npcId, actions, mergedClipOverrides);

  useEffect(() => {
    const behavior = resolveNpcBehaviorState({
      activity,
      patrolActivity,
      interactionState,
      isInteractionTarget,
      inCombat: gamePhase === 'combat',
    });
    setNpcBehaviorState(npcId, behavior);

    let animState: NPCAnimationState;
    if (shouldDeferToInteractionAnimation(interactionState, isInteractionTarget)) {
      animState = npcBehaviorToAnimationState(behavior);
    } else if (patrolActivity === 'walk') {
      animState = 'walk';
    } else {
      animState = resolveNpcAnimationFromActivity(activity);
    }

    crossfadeTo(animState);
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
