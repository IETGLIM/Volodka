/* ─── Volodka RPG – NPC GLB animation: state machine + event bus ─── */

import type * as THREE from 'three';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { useNPCAnimation } from '@/engine/npc/useNPCAnimation';
import { useNpcLocomotionBlend } from '@/engine/npc/useNpcLocomotionBlend';
import type { NpcAnimationClipOverrides } from '@/engine/npc/npcClipResolution';
import type { GamePhase } from '@/shared/gamePhase';
import { useNpcVisualBehavior } from '@/engine/npc/useNpcVisualBehavior';

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
 * Crossfades NPC GLB clips from unified visual behavior + `npc:animation` events.
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
  const { animState, clipOverrides: mergedClipOverrides, emotion } = useNpcVisualBehavior({
    npcId,
    activity,
    patrolActivity,
    interactionState,
    isInteractionTarget,
    gamePhase,
    clipOverrides,
  });

  const { crossfadeTo } = useNPCAnimation(npcId, actions, mergedClipOverrides, {
    locomotionBlend: true,
  });

  useNpcLocomotionBlend({
    npcId,
    actions,
    animState,
    clipOverrides: mergedClipOverrides,
    crossfadeTo,
  });

  return { crossfadeTo, animState, clipOverrides: mergedClipOverrides, emotion };
}
