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

export function createNotificationPoolStore<T extends PoolEntryBase>(): NotificationPoolStore<T> {
  let nextId = 0;
  const pool: T[] = [];
  const listeners = new Set<() => void>();
  let cleanupTimer: ReturnType<typeof setInterval> | null = null;

  const notify = () => {
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
      return pool.slice();
    },
    getServerSnapshot() {
      return [];
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
