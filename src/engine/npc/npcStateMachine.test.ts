/* ─── Volodka RPG – NPC state machine unit tests ─── */

import { describe, expect, it } from 'vitest';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import {
  isValidNpcBehaviorTransition,
  npcBehaviorToAnimationState,
  resolveNpcBehaviorState,
} from '@/engine/npc/npcStateMachine';

describe('npcStateMachine', () => {
  it('resolves combat over schedule activity', () => {
    expect(
      resolveNpcBehaviorState({
        activity: 'walk',
        interactionState: InteractionState.Idle,
        isInteractionTarget: false,
        inCombat: true,
      }),
    ).toBe('combat');
  });

  it('resolves talk during dialogue lock', () => {
    expect(
      resolveNpcBehaviorState({
        activity: 'idle',
        interactionState: InteractionState.Dialogue,
        isInteractionTarget: true,
        inCombat: false,
      }),
    ).toBe('talk');
  });

  it('allows idle → walk and blocks walk → talk without intermediate', () => {
    expect(isValidNpcBehaviorTransition('idle', 'walk')).toBe(true);
    expect(isValidNpcBehaviorTransition('walk', 'talk')).toBe(true);
    expect(isValidNpcBehaviorTransition('combat', 'talk')).toBe(false);
  });

  it('maps combat behavior to combat animation family', () => {
    expect(npcBehaviorToAnimationState('combat')).toBe('combat');
  });
});
