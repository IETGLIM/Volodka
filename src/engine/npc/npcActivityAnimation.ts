/* ─── Volodka RPG – schedule / patrol activity → GLB animation state ─── */

import { InteractionState } from '@/engine/interaction/interactionMachine';
import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';

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
