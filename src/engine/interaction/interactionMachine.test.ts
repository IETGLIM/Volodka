import { describe, expect, it } from 'vitest';
import {
  InteractionState,
  isValidInteractionTransition,
  VALID_INTERACTION_TRANSITIONS,
} from '@/engine/interaction/interactionMachine';

describe('interactionMachine', () => {
  it('allows idle → approach only from idle', () => {
    expect(isValidInteractionTransition(InteractionState.Idle, InteractionState.Approach)).toBe(true);
    expect(isValidInteractionTransition(InteractionState.Dialogue, InteractionState.Approach)).toBe(false);
  });

  it('allows dialogue → exit and idle', () => {
    expect(isValidInteractionTransition(InteractionState.Dialogue, InteractionState.Exit)).toBe(true);
    expect(isValidInteractionTransition(InteractionState.Dialogue, InteractionState.Idle)).toBe(true);
  });

  it('covers every state in transition table', () => {
    for (const state of Object.values(InteractionState).filter((v) => typeof v === 'number')) {
      expect(VALID_INTERACTION_TRANSITIONS[state as InteractionState]).toBeDefined();
    }
  });
});
