import { describe, expect, it } from 'vitest';
import { moveMenuFocusIndex, resolveGamepadMenuAction } from '@/engine/input/gamepadMenuNavigation';

describe('gamepadMenuNavigation', () => {
  it('detects activate on A press edge', () => {
    const prev = Array(16).fill(false);
    const next = [...prev];
    next[0] = true;
    expect(resolveGamepadMenuAction(next, prev)).toBe('activate');
  });

  it('detects back on B press edge', () => {
    const prev = Array(16).fill(false);
    const next = [...prev];
    next[1] = true;
    expect(resolveGamepadMenuAction(next, prev)).toBe('back');
  });

  it('wraps focus indices', () => {
    expect(moveMenuFocusIndex(2, 3, 'next')).toBe(0);
    expect(moveMenuFocusIndex(0, 3, 'prev')).toBe(2);
  });
});
