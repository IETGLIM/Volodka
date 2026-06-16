/** Frames of successful KCC before clearing degraded movement mode. */
export const KCC_SUCCESS_FRAMES_BEFORE_RESTORE = 30;

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
