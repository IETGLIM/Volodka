/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  isCinematicHoldActive,
  resetCinematicPresentation,
} from '@/engine/camera/cinematicPresentation';
import { useCinematicNarrativePresentation } from './useCinematicNarrativePresentation';

describe('useCinematicNarrativePresentation', () => {
  beforeEach(() => {
    resetCinematicPresentation();
  });

  afterEach(() => {
    resetCinematicPresentation();
  });

  it('activates cinematic hold for fullscreen beats', () => {
    const { unmount } = renderHook(() => useCinematicNarrativePresentation(true));
    expect(isCinematicHoldActive()).toBe(true);
    unmount();
    expect(isCinematicHoldActive()).toBe(false);
  });

  it('preserves exploration camera for diegetic overlays', () => {
    const { unmount } = renderHook(() =>
      useCinematicNarrativePresentation(true, { preserveExplorationCamera: true }),
    );
    expect(isCinematicHoldActive()).toBe(false);
    unmount();
    expect(isCinematicHoldActive()).toBe(false);
  });
});
