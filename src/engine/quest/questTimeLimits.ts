/* ─── Quest time-limit helpers (world clock hours + wall-clock fallback) ─── */

import {
  MS_PER_GAME_HOUR,
  WORLD_CLOCK_HOURS_PER_TICK,
  WORLD_CLOCK_TICK_INTERVAL_S,
} from '@/engine/world/worldClockConstants';

/** @deprecated Use MS_PER_GAME_HOUR — kept for existing imports. */
export const REAL_MS_PER_GAME_HOUR = MS_PER_GAME_HOUR;

/** Real milliseconds between world-clock ticks (matches useWorldClock interval). */
export const WORLD_CLOCK_TICK_INTERVAL_MS = WORLD_CLOCK_TICK_INTERVAL_S * 1000;

/** Elapsed game hours from previousHour → hour, including midnight wrap. */
export function computeHourDelta(previousHour: number, hour: number): number {
  let delta = hour - previousHour;
  if (delta < 0) {
    delta += 24;
  }
  return delta;
}

/** Estimate elapsed hours from activation hour to the current clock hour. */
export function estimateElapsedFromStart(startedAtTime: number, currentHour: number): number {
  return computeHourDelta(startedAtTime, currentHour);
}

/** Wall-clock elapsed game hours since quest activation (fallback when hour events stall). */
export function estimateElapsedFromWallClock(
  startedAtWallMs: number,
  nowMs: number = Date.now(),
): number {
  const elapsedMs = Math.max(0, nowMs - startedAtWallMs);
  return elapsedMs / MS_PER_GAME_HOUR;
}

export function isQuestTimedOut(hoursElapsed: number, timeLimitHours: number): boolean {
  return hoursElapsed >= timeLimitHours;
}

export function remainingQuestHours(hoursElapsed: number, timeLimitHours: number): number {
  return Math.max(0, timeLimitHours - hoursElapsed);
}

/**
 * Game hours implied by elapsed real time when world-clock ticks were missed
 * (background tab, throttled timers). Counts whole ticks only.
 */
export function missedGameHoursFromElapsedMs(elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const ticks = Math.floor(elapsedMs / WORLD_CLOCK_TICK_INTERVAL_MS);
  return ticks * WORLD_CLOCK_HOURS_PER_TICK;
}

/**
 * Resolve elapsed hours from tracker state, world clock, and wall-clock fallback.
 * Wall-clock applies when in-game hour ticks stall (e.g. background tab).
 * When hoursElapsed is persisted, it is the primary in-game counter.
 */
export function resolveQuestElapsedHours(input: {
  hoursElapsed?: number;
  startedAtTime?: number;
  startedAtWallMs?: number;
  currentHour: number;
  nowMs?: number;
  /** When false, skip wall-clock (menu / combat / cutscene pause). */
  wallClockFallbackEnabled?: boolean;
}): number {
  const wallEnabled = input.wallClockFallbackEnabled !== false;

  if (input.hoursElapsed !== undefined) {
    return input.hoursElapsed;
  }

  const fromWorldClock =
    input.startedAtTime !== undefined
      ? estimateElapsedFromStart(input.startedAtTime, input.currentHour)
      : 0;

  if (!wallEnabled || input.startedAtWallMs === undefined) {
    return fromWorldClock;
  }

  const fromWall = estimateElapsedFromWallClock(input.startedAtWallMs, input.nowMs);
  return Math.max(fromWorldClock, fromWall);
}
