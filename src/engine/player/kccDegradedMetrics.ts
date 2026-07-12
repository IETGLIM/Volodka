/* Session counters for KCC degraded-mode frequency (direct movement fallback). */

let degradedFrameCount = 0;
let degradedEntryCount = 0;
let lastReason: string | null = null;
let lastSceneId: string | null = null;

export interface KccDegradedMetricsSnapshot {
  degradedFrameCount: number;
  degradedEntryCount: number;
  lastReason: string | null;
  lastSceneId: string | null;
}

export function recordKccDegradedEntry(reason: string, sceneId: string): void {
  degradedEntryCount += 1;
  lastReason = reason;
  lastSceneId = sceneId;
}

export function recordKccDegradedFrame(): void {
  degradedFrameCount += 1;
}

export function getKccDegradedMetrics(): KccDegradedMetricsSnapshot {
  return {
    degradedFrameCount,
    degradedEntryCount,
    lastReason,
    lastSceneId,
  };
}

export function resetKccDegradedMetrics(): void {
  degradedFrameCount = 0;
  degradedEntryCount = 0;
  lastReason = null;
  lastSceneId = null;
}
