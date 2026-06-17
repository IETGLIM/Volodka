import { MAX_KCC_RECREATE_ATTEMPTS_PER_INCIDENT } from '@/engine/player/playerConstants';

/** Frames of successful KCC before clearing degraded movement mode. */
export const KCC_SUCCESS_FRAMES_BEFORE_RESTORE = 30;

export function shouldAttemptKccRecreate(
  recreateAttempts: number,
  maxAttempts: number = MAX_KCC_RECREATE_ATTEMPTS_PER_INCIDENT,
): boolean {
  return recreateAttempts < maxAttempts;
}

export function shouldEnterKccDegraded(
  failFrames: number,
  threshold: number,
): boolean {
  return failFrames >= threshold;
}

export function nextKccHealthyFrameCount(
  degraded: boolean,
  kccStepSucceeded: boolean,
  currentHealthyFrames: number,
): number {
  if (!degraded || !kccStepSucceeded) return 0;
  return currentHealthyFrames + 1;
}

export function shouldRestoreKccFromHealthyFrames(
  degraded: boolean,
  healthyFrames: number,
  successThreshold: number = KCC_SUCCESS_FRAMES_BEFORE_RESTORE,
): boolean {
  return degraded && healthyFrames >= successThreshold;
}
