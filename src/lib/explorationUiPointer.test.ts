import { describe, it, expect } from 'vitest';
import { explorationPointerBlocksCameraOrbit, EXPLORATION_UI_ATTR } from './explorationUiPointer';

describe('explorationUiPointer', () => {
  it('returns true when target is inside marked subtree', () => {
    const root = document.createElement('div');
    root.setAttribute(EXPLORATION_UI_ATTR, 'true');
    const btn = document.createElement('button');
    root.appendChild(btn);
    expect(explorationPointerBlocksCameraOrbit(btn)).toBe(true);
  });

  it('returns false for bare target', () => {
    const el = document.createElement('div');
    expect(explorationPointerBlocksCameraOrbit(el)).toBe(false);
  });
});
