/* ─── Quest time-limit helpers (wall-clock fallback) ─── */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  estimateElapsedFromWallClock,
  resolveQuestElapsedHours,
  REAL_MS_PER_GAME_HOUR,
} from '@/engine/quest/questTimeLimits';

describe('questTimeLimits wall-clock fallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T12:00:00Z'));
  });

  it('estimates elapsed game hours from wall-clock ms', () => {
    const start = Date.now();
    vi.advanceTimersByTime(REAL_MS_PER_GAME_HOUR * 2);
    expect(estimateElapsedFromWallClock(start)).toBeCloseTo(2, 5);
  });

  it('prefers wall-clock when it exceeds world-clock estimate', () => {
    const startedAtWallMs = Date.now();
    vi.advanceTimersByTime(REAL_MS_PER_GAME_HOUR * 3);
    const elapsed = resolveQuestElapsedHours({
      startedAtTime: 8,
      startedAtWallMs,
      currentHour: 9,
    });
    expect(elapsed).toBeCloseTo(3, 5);
  });

  it('uses persisted hoursElapsed when wall-clock has not stalled', () => {
    expect(
      resolveQuestElapsedHours({
        hoursElapsed: 1.5,
        startedAtWallMs: Date.now() - REAL_MS_PER_GAME_HOUR * 0.5,
        currentHour: 20,
      }),
    ).toBe(1.5);
  });
});
