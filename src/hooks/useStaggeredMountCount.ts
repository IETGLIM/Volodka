import { useEffect, useState } from 'react';

export interface StaggeredMountOptions {
  /** Ms between revealing each additional deferred item. */
  intervalMs?: number;
  /** Ms before the first deferred item appears. */
  startAfterMs?: number;
}

/**
 * Reveals deferred items one at a time across idle slices so GLB decode
 * does not stampede the main thread on scene enter.
 */
export function useStaggeredMountCount(
  total: number,
  { intervalMs = 120, startAfterMs = 250 }: StaggeredMountOptions = {},
): number {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (total <= 0) {
      setVisible(0);
      return;
    }

    setVisible(0);
    let cancelled = false;
    let idleHandle: ReturnType<typeof setTimeout> | number | null = null;

    const cancelPending = () => {
      if (idleHandle === null) return;
      if (typeof cancelIdleCallback !== 'undefined' && typeof idleHandle === 'number') {
        cancelIdleCallback(idleHandle);
      } else {
        clearTimeout(idleHandle as ReturnType<typeof setTimeout>);
      }
      idleHandle = null;
    };

    const schedule = (fn: () => void) => {
      cancelPending();
      if (typeof requestIdleCallback !== 'undefined') {
        idleHandle = requestIdleCallback(fn, { timeout: intervalMs + 48 });
      } else {
        idleHandle = setTimeout(fn, intervalMs);
      }
    };

    const revealNext = (next: number) => {
      if (cancelled) return;
      setVisible(next);
      if (next < total) schedule(() => revealNext(next + 1));
    };

    const startTimer = setTimeout(() => revealNext(1), startAfterMs);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      cancelPending();
    };
  }, [total, intervalMs, startAfterMs]);

  return visible;
}
