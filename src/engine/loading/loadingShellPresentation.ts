import { LOADING_EXIT_MS } from '@/shared/constants/transitionTimings';

const LOADING_EXIT_FALLBACK_SECONDS = 0.42;

/** Seconds for loading shell exit fade; 0 when reduced motion is requested. */
export function resolveLoadingShellDuration(reduceMotion: boolean): number {
  if (reduceMotion) return 0;
  if (typeof LOADING_EXIT_MS !== 'number' || !Number.isFinite(LOADING_EXIT_MS)) {
    return LOADING_EXIT_FALLBACK_SECONDS;
  }
  return LOADING_EXIT_MS / 1000;
}
