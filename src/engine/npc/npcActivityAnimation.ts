/* ─── Volodka RPG – schedule / patrol activity → GLB animation state ─── */

import { InteractionState } from '@/engine/interaction/interactionMachine';
import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';
import type { NpcAnimationClipOverrides } from '@/engine/npc/npcClipResolution';

/** GLB clip state while the interaction machine owns the NPC (dialogue, align, …). */
export function resolveInteractionNpcAnimationState(
  interactionState: InteractionState,
): NPCAnimationState {
  switch (interactionState) {
    case InteractionState.Dialogue:
    case InteractionState.Lock:
      return 'talk';
    case InteractionState.Align:
    case InteractionState.Cutscene:
      return 'listen';
    case InteractionState.Approach:
      return 'idle';
    case InteractionState.Exit:
    case InteractionState.Idle:
      return 'idle';
    default: {
      const _exhaustive: never = interactionState;
      return _exhaustive;
    }
  }
}

/**
 * Map schedule or patrol activity to an NPC GLB animation state.
 * Dialogue-driven talk/listen/gesture is handled via `npc:animation` events.
 */
export function resolveNpcAnimationFromActivity(activity: string): NPCAnimationState {
  switch (activity) {
    case 'walk':
      return 'walk';
    case 'talk':
      return 'talk';
    case 'work':
    case 'read':
    case 'rest':
      return 'sit';
    case 'sleep':
    case 'idle':
    default:
      return 'idle';
  }
}

/** Prefer shipped Mixamo (or Quaternius interim) clips for schedule activities. */
export function resolveNpcActivityClipOverrides(
  activity: string,
): NpcAnimationClipOverrides | undefined {
  switch (activity) {
    case 'work':
      return { sit: 'working' };
    case 'read':
    case 'rest':
      return { sit: 'sitting' };
    case 'sleep':
      return { idle: 'sleeping' };
    default:
      return undefined;
  }
}

export interface NpcVisualAnimationContext {
  readonly activity: string;
  readonly patrolActivity?: 'idle' | 'walk';
  readonly interactionState: InteractionState;
  readonly isInteractionTarget: boolean;
}

/**
 * Unified animation state for GLB and procedural NPC render paths.
 * Priority: interaction target → patrol walk → schedule activity.
 */
export function resolveNpcVisualAnimationState(
  ctx: NpcVisualAnimationContext,
): NPCAnimationState {
  if (shouldDeferToInteractionAnimation(ctx.interactionState, ctx.isInteractionTarget)) {
    return resolveInteractionNpcAnimationState(ctx.interactionState);
  }
  if (ctx.patrolActivity === 'walk') return 'walk';
  return resolveNpcAnimationFromActivity(ctx.activity);
}

/**
 * Whether activity-driven crossfade should defer to interaction event bus.
 * During active dialogue alignment/lock, InteractionSystemBridge emits states.
 */
export function shouldDeferToInteractionAnimation(
  interactionState: InteractionState,
  isInteractionTarget: boolean,
): boolean {
  if (!isInteractionTarget) return false;
  return (
    interactionState === InteractionState.Dialogue ||
    interactionState === InteractionState.Lock ||
    interactionState === InteractionState.Align ||
    interactionState === InteractionState.Cutscene ||
    interactionState === InteractionState.Approach
  );
}
