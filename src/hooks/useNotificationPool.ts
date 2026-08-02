export type PoolEntryBase = {
  id: number;
  createdAt: number;
};

export type NotificationPoolStore<T extends PoolEntryBase> = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => readonly T[];
  getServerSnapshot: () => readonly T[];
  push: (entry: Omit<T, 'id' | 'createdAt'>, options: PoolPushOptions) => void;
};

export type PoolPushOptions = {
  ttlMs: number;
  maxSize: number;
  cleanupIntervalMs: number;
};

// Stable empty array for getServerSnapshot — returning `[]` inline creates a new
// reference each call, which breaks useSyncExternalStore's Object.is check (same
// infinite-loop bug as getSnapshot returning pool.slice()).
const EMPTY_READONLY: readonly never[] = Object.freeze([]) as readonly never[];

export function createNotificationPoolStore<T extends PoolEntryBase>(): NotificationPoolStore<T> {
  let nextId = 0;
  const pool: T[] = [];
  const listeners = new Set<() => void>();
  let cleanupTimer: ReturnType<typeof setInterval> | null = null;

  // Cached snapshot — useSyncExternalStore compares snapshots with Object.is.
  // Returning pool.slice() every call creates a new array reference each time →
  // Object.is(prev, next) is always false → React re-renders → getSnapshot again
  // → infinite loop (React error #185 "Maximum update depth exceeded").
  // Fix: cache the sliced array and invalidate (set to null) on every mutation
  // (push/prune). getSnapshot re-slices only when invalidated.
  let cachedSnapshot: readonly T[] | null = null;
  const invalidateSnapshot = () => {
    cachedSnapshot = null;
  };

  const notify = () => {
    invalidateSnapshot();
    for (const listener of listeners) listener();
  };

  const pruneExpired = (ttlMs: number) => {
    const now = Date.now();
    const before = pool.length;
    while (pool.length > 0 && now - pool[0]!.createdAt > ttlMs) {
      pool.shift();
    }
    if (pool.length !== before) notify();
  };

  const ensureCleanupTimer = (ttlMs: number, intervalMs: number) => {
    if (cleanupTimer) return;
    cleanupTimer = setInterval(() => {
      if (pool.length === 0) {
        if (cleanupTimer) {
          clearInterval(cleanupTimer);
          cleanupTimer = null;
        }
        return;
      }
      pruneExpired(ttlMs);
      if (pool.length === 0 && cleanupTimer) {
        clearInterval(cleanupTimer);
        cleanupTimer = null;
      }
    }, intervalMs);
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      // Re-slice only when invalidated by a mutation; otherwise return the
      // stable cached reference so useSyncExternalStore's Object.is check passes.
      if (cachedSnapshot === null) {
        cachedSnapshot = pool.slice();
      }
      return cachedSnapshot;
    },
    getServerSnapshot() {
      return EMPTY_READONLY;
    },
    push(entry, options) {
      const full = {
        ...entry,
        id: nextId++,
        createdAt: Date.now(),
      } as T;
      pool.push(full);
      while (pool.length > options.maxSize) pool.shift();
      pruneExpired(options.ttlMs);
      ensureCleanupTimer(options.ttlMs, options.cleanupIntervalMs);
      notify();
    },
  };
}
