import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useLoadingShellTransition } from '@/components/game/loadingShellMotion';
import { LOADING_EXIT_MS, MOTION_EASE } from '@/shared/constants/transitionTimings';

const useEffectiveReducedMotionMock = vi.fn(() => false);

vi.mock('@/hooks/useEffectiveReducedMotion', () => ({
  useEffectiveReducedMotion: () => useEffectiveReducedMotionMock(),
}));

describe('useLoadingShellTransition', () => {
  it('uses zero duration when reduced motion is active', () => {
    useEffectiveReducedMotionMock.mockReturnValue(true);
    const { result } = renderHook(() => useLoadingShellTransition());
    expect(result.current.duration).toBe(0);
    expect(result.current.ease).toBe(MOTION_EASE.cinematicOut);
  });

  it('uses LOADING_EXIT_MS when motion is allowed', () => {
    useEffectiveReducedMotionMock.mockReturnValue(false);
    const { result } = renderHook(() => useLoadingShellTransition());
    expect(result.current.duration).toBe(LOADING_EXIT_MS / 1000);
  });

  it('returns a stable object when reduceMotion does not change', () => {
    useEffectiveReducedMotionMock.mockReturnValue(false);
    const { result, rerender } = renderHook(() => useLoadingShellTransition());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('returns a new object when reduceMotion changes', () => {
    useEffectiveReducedMotionMock.mockReturnValue(false);
    const { result, rerender } = renderHook(() => useLoadingShellTransition());
    const motionAllowed = result.current;

    useEffectiveReducedMotionMock.mockReturnValue(true);
    rerender();
    expect(result.current).not.toBe(motionAllowed);
    expect(result.current.duration).toBe(0);
  });
});
