import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { LOADING_EXIT_MS, MOTION_EASE } from '@/shared/constants/transitionTimings';

/** Shared fade timing for boot / pipeline loading shells. */
export function useLoadingShellTransition() {
  const reduceMotion = useEffectiveReducedMotion();
  const duration = reduceMotion ? 0 : LOADING_EXIT_MS / 1000;
  return {
    duration,
    ease: MOTION_EASE.cinematicOut,
  };
}
