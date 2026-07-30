import { describe, expect, it } from 'vitest';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import {
  resolveNpcVisualAnimationState,
  resolveInteractionNpcAnimationState,
} from '@/engine/npc/npcActivityAnimation';

describe('resolveNpcVisualAnimationState', () => {
  it('maps interaction target Dialogue to talk', () => {
    expect(
      resolveNpcVisualAnimationState({
        activity: 'idle',
        interactionState: InteractionState.Dialogue,
        isInteractionTarget: true,
      }),
    ).toBe('talk');
  });

  it('maps interaction target Align to listen', () => {
    expect(
      resolveNpcVisualAnimationState({
        activity: 'idle',
        interactionState: InteractionState.Align,
        isInteractionTarget: true,
      }),
    ).toBe('listen');
  });

  it('maps interaction target Cutscene to listen', () => {
    expect(
      resolveNpcVisualAnimationState({
        activity: 'walk',
        interactionState: InteractionState.Cutscene,
        isInteractionTarget: true,
      }),
    ).toBe('listen');
  });

  it('maps interaction target Lock to talk', () => {
    expect(
      resolveNpcVisualAnimationState({
        activity: 'idle',
        interactionState: InteractionState.Lock,
        isInteractionTarget: true,
      }),
    ).toBe('talk');
  });

  it('maps patrol walk when not interaction target', () => {
    expect(
      resolveNpcVisualAnimationState({
        activity: 'idle',
        patrolActivity: 'walk',
        interactionState: InteractionState.Idle,
        isInteractionTarget: false,
      }),
    ).toBe('walk');
  });

  it('maps schedule work to work (Mixamo working clip)', () => {
    expect(
      resolveNpcVisualAnimationState({
        activity: 'work',
        interactionState: InteractionState.Idle,
        isInteractionTarget: false,
      }),
    ).toBe('work');
  });

  it('maps schedule sleep to idle', () => {
    expect(
      resolveNpcVisualAnimationState({
        activity: 'sleep',
        interactionState: InteractionState.Idle,
        isInteractionTarget: false,
      }),
    ).toBe('idle');
  });

  it('ignores interaction state when not the target', () => {
    expect(
      resolveNpcVisualAnimationState({
        activity: 'read',
        interactionState: InteractionState.Dialogue,
        isInteractionTarget: false,
      }),
    ).toBe('sit');
  });
});

describe('resolveInteractionNpcAnimationState', () => {
  it('covers all InteractionState variants', () => {
    expect(resolveInteractionNpcAnimationState(InteractionState.Dialogue)).toBe('talk');
    expect(resolveInteractionNpcAnimationState(InteractionState.Lock)).toBe('talk');
    expect(resolveInteractionNpcAnimationState(InteractionState.Align)).toBe('listen');
    expect(resolveInteractionNpcAnimationState(InteractionState.Cutscene)).toBe('listen');
    expect(resolveInteractionNpcAnimationState(InteractionState.Approach)).toBe('idle');
    expect(resolveInteractionNpcAnimationState(InteractionState.Exit)).toBe('idle');
    expect(resolveInteractionNpcAnimationState(InteractionState.Idle)).toBe('idle');
  });
});
