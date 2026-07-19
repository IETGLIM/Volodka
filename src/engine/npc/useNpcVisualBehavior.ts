/* ─── Volodka RPG – unified NPC FSM → visual state (GLB + procedural) ─── */

import { useEffect, useMemo, useState } from 'react';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';
import type { GamePhase } from '@/shared/gamePhase';
import { syncNpcBehaviorState } from '@/engine/interaction/npcRegistry';
import { onNpcAnimation } from '@/engine/npc/npcEventRouter';
import {
  resolveNpcActivityClipOverrides,
  resolveNpcVisualAnimationState,
} from '@/engine/npc/npcActivityAnimation';
import type { NpcAnimationClipOverrides } from '@/engine/npc/npcClipResolution';
import {
  resolveNpcBehaviorState,
  type NpcBehaviorState,
} from '@/engine/npc/npcStateMachine';

export interface UseNpcVisualBehaviorOptions {
  npcId: string;
  activity: string;
  patrolActivity?: 'idle' | 'walk';
  interactionState: InteractionState;
  isInteractionTarget: boolean;
  gamePhase: GamePhase;
  clipOverrides?: NpcAnimationClipOverrides;
}

export interface NpcVisualBehaviorResult {
  behavior: NpcBehaviorState;
  animState: NPCAnimationState;
  clipOverrides: NpcAnimationClipOverrides | undefined;
}

/**
 * Resolves behavioral FSM + animation state and syncs npcRegistry for any mesh type.
 * Subscribes to `npc:animation` bus overrides during active interaction.
 */
export function useNpcVisualBehavior({
  npcId,
  activity,
  patrolActivity,
  interactionState,
  isInteractionTarget,
  gamePhase,
  clipOverrides,
}: UseNpcVisualBehaviorOptions): NpcVisualBehaviorResult {
  const [busAnimState, setBusAnimState] = useState<NPCAnimationState | null>(null);

  const behavior = useMemo(
    () =>
      resolveNpcBehaviorState({
        activity,
        patrolActivity,
        interactionState,
        isInteractionTarget,
        inCombat: gamePhase === 'combat',
      }),
    [activity, patrolActivity, interactionState, isInteractionTarget, gamePhase],
  );

  const resolvedAnimState = useMemo(
    () =>
      resolveNpcVisualAnimationState({
        activity,
        patrolActivity,
        interactionState,
        isInteractionTarget,
      }),
    [activity, patrolActivity, interactionState, isInteractionTarget],
  );

  const activityClipOverrides = useMemo(
    () => resolveNpcActivityClipOverrides(activity),
    [activity],
  );

  const mergedClipOverrides = useMemo(() => {
    if (!activityClipOverrides && !clipOverrides) return undefined;
    return { ...clipOverrides, ...activityClipOverrides };
  }, [activityClipOverrides, clipOverrides]);

  const animState = busAnimState ?? resolvedAnimState;

  useEffect(() => {
    syncNpcBehaviorState(npcId, behavior);
  }, [npcId, behavior]);

  useEffect(() => onNpcAnimation(npcId, setBusAnimState), [npcId]);

  // Clear bus-driven anim state once the interaction ends so schedule/patrol
  // activities (sleep, work, walk) can drive the NPC again. Without this,
  // the last `npc:animation` event (typically `state:'idle'` emitted on
  // interaction:end) permanently shadows `resolvedAnimState`, leaving
  // patrolling NPCs sliding in idle pose and sleeping NPCs standing.
  useEffect(() => {
    if (!isInteractionTarget && interactionState === InteractionState.Idle) {
      setBusAnimState(null);
    }
  }, [isInteractionTarget, interactionState]);

  return {
    behavior,
    animState,
    clipOverrides: mergedClipOverrides,
  };
}
