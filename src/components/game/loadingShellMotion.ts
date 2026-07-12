import { useMemo } from 'react';
import { resolveLoadingShellDuration } from '@/engine/loading/loadingShellPresentation';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { MOTION_EASE } from '@/shared/constants/transitionTimings';

const LOADING_SHELL_EASE = MOTION_EASE.cinematicOut;

export type LoadingShellTransition = {
  duration: number;
  ease: typeof LOADING_SHELL_EASE;
};

/**
 * Returns Framer Motion transition params for boot / pipeline loading shell exit fade.
 * Duration is `0` when reduced motion is active; otherwise `LOADING_EXIT_MS / 1000`.
 */
export function useLoadingShellTransition(): LoadingShellTransition {
  const reduceMotion = useEffectiveReducedMotion();

  return useMemo(
    () => ({
      duration: resolveLoadingShellDuration(reduceMotion),
      ease: LOADING_SHELL_EASE,
    }),
    [reduceMotion],
  );
}
