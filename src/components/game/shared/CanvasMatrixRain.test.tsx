import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CanvasMatrixRain } from './CanvasMatrixRain';

let rafCalls: number;
const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  rafCalls = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => {
    rafCalls += 1;
    return 1;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  window.matchMedia = originalMatchMedia;
});

function stubMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('CanvasMatrixRain', () => {
  it('does not start the animation loop under reduced motion', () => {
    stubMatchMedia(true);
    render(<CanvasMatrixRain />);
    expect(rafCalls).toBe(0);
  });

  it('starts the animation loop when reduced motion is not active', () => {
    stubMatchMedia(false);
    render(<CanvasMatrixRain />);
    expect(rafCalls).toBeGreaterThan(0);
  });
});
