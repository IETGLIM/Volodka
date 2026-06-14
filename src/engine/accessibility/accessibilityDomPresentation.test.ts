import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_ACCESSIBILITY_SETTINGS, createSubtitleScale } from './accessibilityConstraints';
import { applyAccessibilityDomHooks } from './accessibilityDomPresentation';

function createDomRoot() {
  return {
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    style: { setProperty: vi.fn() },
  } as unknown as HTMLElement;
}

describe('accessibilityDomPresentation', () => {
  it('applies css var hooks from the mapping', () => {
    const root = createDomRoot();
    applyAccessibilityDomHooks(root, { ...DEFAULT_ACCESSIBILITY_SETTINGS, subtitleScale: createSubtitleScale(1.3) }, 'subtitleScale');
    expect(root.style.setProperty).toHaveBeenCalledWith('--subtitle-scale', '1.3');
  });

  it('applies data-attribute hooks and removes defaults', () => {
    const root = createDomRoot();
    applyAccessibilityDomHooks(
      root,
      { ...DEFAULT_ACCESSIBILITY_SETTINGS, reducedMotionOverride: true },
      'reducedMotionOverride',
    );
    expect(root.setAttribute).toHaveBeenCalledWith('data-reduced-motion', 'true');

    applyAccessibilityDomHooks(root, DEFAULT_ACCESSIBILITY_SETTINGS, 'colorBlindMode');
    expect(root.removeAttribute).toHaveBeenCalledWith('data-color-blind-mode');
  });

  it('applies every hook when changedKey is all', () => {
    const root = createDomRoot();
    applyAccessibilityDomHooks(root, DEFAULT_ACCESSIBILITY_SETTINGS, 'all');
    expect(root.style.setProperty).toHaveBeenCalledWith('--subtitle-scale', '1');
    expect(root.removeAttribute).toHaveBeenCalledWith('data-reduced-motion');
  });
});
