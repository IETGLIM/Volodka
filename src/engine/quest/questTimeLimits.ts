/* ─── Quest time-limit helpers (world clock hours) ─── */

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

export function isQuestTimedOut(hoursElapsed: number, timeLimitHours: number): boolean {
  return hoursElapsed >= timeLimitHours;
}

export function remainingQuestHours(hoursElapsed: number, timeLimitHours: number): number {
  return Math.max(0, timeLimitHours - hoursElapsed);
}
