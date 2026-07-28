/**
 * Deferred Web Audio node teardown after fade-outs.
 * Used by ambient drone / ambient-music stop paths so new scenes can start
 * while old nodes finish releasing.
 */

export interface DeferredCleanupHandle {
  timer: ReturnType<typeof setTimeout> | null;
  cleanup: (() => void) | null;
}

export function createDeferredCleanupHandle(): DeferredCleanupHandle {
  return { timer: null, cleanup: null };
}

/** Flush any pending teardown immediately (dispose / scene switch). */
export function flushDeferredCleanup(handle: DeferredCleanupHandle): void {
  if (handle.timer) {
    clearTimeout(handle.timer);
    handle.timer = null;
  }
  handle.cleanup?.();
  handle.cleanup = null;
}

/**
 * Schedule a cleanup after `delayMs`, or run immediately when `immediate` is true
 * (typically when the owning engine is already disposed).
 */
export function scheduleDeferredCleanup(
  handle: DeferredCleanupHandle,
  release: () => void,
  delayMs: number,
  immediate: boolean,
): void {
  if (immediate) {
    release();
    return;
  }
  handle.cleanup = release;
  handle.timer = setTimeout(() => {
    handle.timer = null;
    handle.cleanup = null;
    release();
  }, delayMs);
}
