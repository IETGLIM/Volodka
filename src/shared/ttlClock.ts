/* Monotonic TTL clock — performance.now() for in-session expiry comparisons. */

/** Current monotonic time for TTL comparisons (ms since navigation start). */
export function ttlNow(): number {
  return performance.now();
}

/** Expiry timestamp in monotonic time from a duration. */
export function ttlExpiryFromDurationMs(durationMs: number): number {
  return performance.now() + durationMs;
}

/** Convert monotonic expiry to epoch ms for localStorage persistence. */
export function ttlExpiryToPersisted(monotonicExpiry: number): number {
  return Date.now() + (monotonicExpiry - performance.now());
}

/** Restore monotonic expiry from persisted epoch ms on load. */
export function ttlExpiryFromPersisted(persistedExpiry: number): number {
  return performance.now() + Math.max(0, persistedExpiry - Date.now());
}
