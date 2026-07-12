import { describe, expect, it } from 'vitest';
import {
  KCC_SUCCESS_FRAMES_BEFORE_RESTORE,
  nextKccHealthyFrameCount,
  shouldAttemptKccRecreate,
  shouldEnterKccDegraded,
  shouldRestoreKccFromHealthyFrames,
} from './kccRecoveryState';
import { MAX_KCC_RECREATE_ATTEMPTS_PER_INCIDENT } from './playerConstants';

describe('kccRecoveryState', () => {
  it('shouldAttemptKccRecreate respects per-incident cap', () => {
    expect(shouldAttemptKccRecreate(MAX_KCC_RECREATE_ATTEMPTS_PER_INCIDENT - 1)).toBe(true);
    expect(shouldAttemptKccRecreate(MAX_KCC_RECREATE_ATTEMPTS_PER_INCIDENT)).toBe(false);
  });

  it('shouldEnterKccDegraded at fail threshold', () => {
    expect(shouldEnterKccDegraded(59, 60)).toBe(false);
    expect(shouldEnterKccDegraded(60, 60)).toBe(true);
  });

  it('accumulates healthy frames only while degraded and KCC succeeds', () => {
    expect(nextKccHealthyFrameCount(false, true, 5)).toBe(0);
    expect(nextKccHealthyFrameCount(true, false, 5)).toBe(0);
    expect(nextKccHealthyFrameCount(true, true, 5)).toBe(6);
  });

  it('shouldRestoreKccFromHealthyFrames after success threshold', () => {
    expect(
      shouldRestoreKccFromHealthyFrames(
        true,
        KCC_SUCCESS_FRAMES_BEFORE_RESTORE - 1,
      ),
    ).toBe(false);
    expect(
      shouldRestoreKccFromHealthyFrames(
        true,
        KCC_SUCCESS_FRAMES_BEFORE_RESTORE,
      ),
    ).toBe(true);
    expect(shouldRestoreKccFromHealthyFrames(false, 100)).toBe(false);
  });
});
