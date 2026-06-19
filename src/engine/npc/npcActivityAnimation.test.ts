import { describe, expect, it } from 'vitest';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import {
  resolveNpcActivityClipOverrides,
  resolveNpcAnimationFromActivity,
  resolveInteractionNpcAnimationState,
  shouldDeferToInteractionAnimation,
} from './npcActivityAnimation';

describe('npcActivityAnimation', () => {
  it('maps schedule activities to animation states', () => {
    expect(resolveNpcAnimationFromActivity('idle')).toBe('idle');
    expect(resolveNpcAnimationFromActivity('walk')).toBe('walk');
    expect(resolveNpcAnimationFromActivity('talk')).toBe('talk');
    expect(resolveNpcAnimationFromActivity('work')).toBe('sit');
    expect(resolveNpcAnimationFromActivity('read')).toBe('sit');
    expect(resolveNpcAnimationFromActivity('rest')).toBe('sit');
    expect(resolveNpcAnimationFromActivity('sleep')).toBe('idle');
  });

  it('maps schedule activities to Mixamo clip overrides', () => {
    expect(resolveNpcActivityClipOverrides('work')).toEqual({ sit: 'working' });
    expect(resolveNpcActivityClipOverrides('rest')).toEqual({ sit: 'sitting' });
    expect(resolveNpcActivityClipOverrides('read')).toEqual({ sit: 'sitting' });
    expect(resolveNpcActivityClipOverrides('sleep')).toEqual({ idle: 'sleeping' });
    expect(resolveNpcActivityClipOverrides('idle')).toBeUndefined();
  });

  it('maps interaction states to talk/listen/idle GLB clips', () => {
    expect(resolveInteractionNpcAnimationState(InteractionState.Dialogue)).toBe('talk');
    expect(resolveInteractionNpcAnimationState(InteractionState.Lock)).toBe('talk');
    expect(resolveInteractionNpcAnimationState(InteractionState.Align)).toBe('listen');
    expect(resolveInteractionNpcAnimationState(InteractionState.Cutscene)).toBe('listen');
    expect(resolveInteractionNpcAnimationState(InteractionState.Approach)).toBe('idle');
  });

  it('defers to interaction bus during dialogue alignment', () => {
    expect(
      shouldDeferToInteractionAnimation(InteractionState.Dialogue, true),
    ).toBe(true);
    expect(
      shouldDeferToInteractionAnimation(InteractionState.Idle, true),
    ).toBe(false);
    expect(
      shouldDeferToInteractionAnimation(InteractionState.Dialogue, false),
    ).toBe(false);
  });
});
