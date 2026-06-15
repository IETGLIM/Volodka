import { describe, expect, it } from 'vitest';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import {
  resolveNpcAnimationFromActivity,
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
