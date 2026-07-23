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
import { eventBus } from '@/engine/EventBus';
import type { NpcEmotion } from '@/engine/npc/npcEmotionTypes';
import {
  getNpcEmotion,
  resolveEmotionBehavior,
  mergeEmotionClipOverrides,
} from '@/engine/npc/npcEmotionalReactions';
import { resolveEffectiveIdleClipOverrides } from '@/engine/npc/npcIdleVariants';
import {
  pauseHeadTracking,
  resumeHeadTrackingDelayed,
  setHeadTrackingEmotion,
} from '@/engine/npc/headTracking';
import { findNpcById } from '@/data/allNpcDefinitions';

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
  /** Current NPC emotion (for downstream systems like ambient barks). */
  emotion: NpcEmotion;
}

/**
 * Resolves behavioral FSM + animation state and syncs npcRegistry for any mesh type.
 * Subscribes to `npc:animation` bus overrides during active interaction.
 * Integrates emotion-driven animation overrides and idle variant selection.
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
  const [currentEmotion, setCurrentEmotion] = useState<NpcEmotion>('neutral');

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

  // Resolve emotion-driven animation state override
  const emotionAnimOverride = useMemo(() => {
    const emotion = getNpcEmotion(npcId);
    setCurrentEmotion(emotion);
    if (emotion === 'neutral') return undefined;
    const emotionBehavior = resolveEmotionBehavior(emotion);
    return emotionBehavior.animStateOverride;
  }, [npcId]);

  const activityClipOverrides = useMemo(
    () => resolveNpcActivityClipOverrides(activity),
    [activity],
  );

  // Resolve NPC definition idle variant
  const definitionIdleVariant = useMemo(() => {
    const def = findNpcById(npcId);
    return def?.idleVariant;
  }, [npcId]);

  // Merge clip overrides: activity → idle variant → emotion
  const mergedClipOverrides = useMemo(() => {
    // Start with activity overrides
    let base: NpcAnimationClipOverrides | undefined = undefined;
    if (activityClipOverrides || clipOverrides) {
      base = { ...clipOverrides, ...activityClipOverrides };
    }

    // Add idle variant overrides (if NPC definition specifies one)
    const idleVariantOverrides = resolveEffectiveIdleClipOverrides(
      currentEmotion,
      definitionIdleVariant,
    );
    if (idleVariantOverrides) {
      base = { ...base, ...idleVariantOverrides };
    }

    // Emotion overrides take highest priority
    return mergeEmotionClipOverrides(currentEmotion, base);
  }, [activityClipOverrides, clipOverrides, currentEmotion, definitionIdleVariant]);

  // Final animation state: bus override → emotion override → resolved state
  const animState = busAnimState ?? emotionAnimOverride ?? resolvedAnimState;

  // Sync behavior state to npcRegistry
  useEffect(() => {
    syncNpcBehaviorState(npcId, behavior);
  }, [npcId, behavior]);

  // Subscribe to animation bus events
  useEffect(() => onNpcAnimation(npcId, setBusAnimState), [npcId]);

  // Clear bus-driven anim state once the interaction ends
  useEffect(() => {
    if (!isInteractionTarget && interactionState === InteractionState.Idle) {
      setBusAnimState(null);
    }
  }, [isInteractionTarget, interactionState]);

  // Pause/resume head tracking during dialogue
  useEffect(() => {
    if (isInteractionTarget && interactionState === InteractionState.Dialogue) {
      pauseHeadTracking(npcId);
    } else if (!isInteractionTarget && interactionState === InteractionState.Idle) {
      resumeHeadTrackingDelayed(npcId);
    }
  }, [npcId, isInteractionTarget, interactionState]);

  // Subscribe to emotion events and update head tracking
  useEffect(() => {
    const unsub = eventBus.on('npc:emotion_triggered', ({ npcId: targetId, emotion }) => {
      if (targetId !== npcId) return;
      setCurrentEmotion(emotion);
      setHeadTrackingEmotion(npcId, emotion);
    });
    return unsub;
  }, [npcId]);

  useEffect(() => {
    const unsub = eventBus.on('npc:emotion_decayed', ({ npcId: targetId }) => {
      if (targetId !== npcId) return;
      setCurrentEmotion('neutral');
      setHeadTrackingEmotion(npcId, 'neutral');
    });
    return unsub;
  }, [npcId]);

  return {
    behavior,
    animState,
    clipOverrides: mergedClipOverrides,
    emotion: currentEmotion,
  };
}
