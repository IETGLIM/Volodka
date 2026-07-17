/* ─── Volodka RPG – NPC behavioral state machine ─── */

import { InteractionState } from '@/engine/interaction/interactionMachine';
import { devWarn } from '@/shared/utils/devLog';

/** High-level NPC behavior — drives animation and registry lookups. */
export type NpcBehaviorState = 'idle' | 'walk' | 'talk' | 'combat';

export const NPC_BEHAVIOR_STATE_LABELS: Record<NpcBehaviorState, string> = {
  idle: 'Idle',
  walk: 'Walk',
  talk: 'Talk',
  combat: 'Combat',
};

/** Allowed behavioral transitions (self-transitions always permitted).
 *  `combat → talk` is intentionally blocked: an NPC must exit combat to `idle`
 *  before entering `talk`, so the combat animation never blends straight into a
 *  dialogue pose. `syncNpcBehaviorState` still bypasses this for authoritative
 *  FSM resync (e.g. when the resolver force-clears combat). */
export const VALID_NPC_BEHAVIOR_TRANSITIONS: Record<
  NpcBehaviorState,
  readonly NpcBehaviorState[]
> = {
  idle: ['walk', 'talk', 'combat'],
  walk: ['idle', 'talk', 'combat'],
  talk: ['idle', 'walk', 'combat'],
  combat: ['idle', 'walk'],
};

export interface NpcBehaviorContext {
  readonly activity: string;
  readonly patrolActivity?: 'idle' | 'walk';
  readonly interactionState: InteractionState;
  readonly isInteractionTarget: boolean;
  readonly inCombat: boolean;
}

export function isValidNpcBehaviorTransition(
  from: NpcBehaviorState,
  to: NpcBehaviorState,
): boolean {
  if (from === to) return true;
  return VALID_NPC_BEHAVIOR_TRANSITIONS[from].includes(to);
}

/**
 * Resolve the behavioral state for an NPC from schedule, patrol, interaction, and combat.
 */
export function resolveNpcBehaviorState(ctx: NpcBehaviorContext): NpcBehaviorState {
  if (ctx.inCombat) return 'combat';

  if (ctx.isInteractionTarget) {
    switch (ctx.interactionState) {
      case InteractionState.Dialogue:
      case InteractionState.Lock:
      case InteractionState.Align:
      case InteractionState.Cutscene:
        return 'talk';
      case InteractionState.Approach:
        return 'walk';
      case InteractionState.Exit:
      case InteractionState.Idle:
        return 'idle';
      default: {
        const _exhaustive: never = ctx.interactionState;
        return _exhaustive;
      }
    }
  }

  if (ctx.patrolActivity === 'walk') return 'walk';

  switch (ctx.activity) {
    case 'walk':
      return 'walk';
    case 'talk':
      return 'talk';
    case 'work':
    case 'read':
    case 'rest':
    case 'sleep':
    case 'idle':
      return 'idle';
    default:
      devWarn(`[npcStateMachine] Unknown activity "${ctx.activity}", falling back to idle`);
      return 'idle';
  }
}

/** Map behavioral state to GLB animation clip family. */
export function npcBehaviorToAnimationState(
  behavior: NpcBehaviorState,
): 'idle' | 'walk' | 'talk' | 'sit' | 'listen' | 'gesture' | 'combat' {
  switch (behavior) {
    case 'walk':
      return 'walk';
    case 'talk':
      return 'talk';
    case 'combat':
      return 'combat';
    case 'idle':
    default:
      return 'idle';
  }
}
