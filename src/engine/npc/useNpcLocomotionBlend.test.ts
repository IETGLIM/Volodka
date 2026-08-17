import { describe, expect, it } from 'vitest';
import { isNpcLocomotionAnimState } from '@/engine/npc/useNpcLocomotionBlend';

describe('useNpcLocomotionBlend helpers', () => {
  it('treats idle, walk, and listen as locomotion states', () => {
    expect(isNpcLocomotionAnimState('idle')).toBe(true);
    expect(isNpcLocomotionAnimState('walk')).toBe(true);
    expect(isNpcLocomotionAnimState('listen')).toBe(true);
  });

  it('excludes talk, sit, work, and gesture from locomotion blend', () => {
    expect(isNpcLocomotionAnimState('talk')).toBe(false);
    expect(isNpcLocomotionAnimState('sit')).toBe(false);
    expect(isNpcLocomotionAnimState('work')).toBe(false);
    expect(isNpcLocomotionAnimState('gesture')).toBe(false);
  });
});
