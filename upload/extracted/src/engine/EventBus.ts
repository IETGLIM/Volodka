/* ─── Volodka RPG – typed event bus ─── */

import type { EventMap } from '@/shared/types/game';

type EventHandler<T> = (payload: T) => void;

/** Events that should never be deduped — each emission must fire */
const DEDUP_EXEMPT = new Set([
  'combat:hit',
  'combat:damage',
  'combat:heal',
  'combat:victory',
  'combat:defeat',
  'scene:enter',
  'object:interact',
  'npc:interact_staged',
  'interaction:end',
]);

/** Dedup window in milliseconds — suppress identical (event+payload) repeats within this window */
const DEDUP_WINDOW_MS = 500;

/**
 * A lightweight, typed pub/sub event bus with payload-aware deduplication.
 *
 * Rule: emit/on only at layer boundaries (3D→DOM, engine→UI).
 * Never use for intra-layer communication.
 *
 * Dedup logic:
 *  - Key is `${event}:${JSON.stringify(payload)}` so different payloads for the
 *    same event are NOT suppressed.
 *  - Entries older than DEDUP_WINDOW_MS are pruned on every emit and via a
 *    periodic cleanup timer (lazily started on first activity).
 *  - Events listed in DEDUP_EXEMPT always fire, bypassing dedup entirely.
 *
 * Lifecycle:
 *  - The periodic cleanup timer is **not** started in the constructor — it is
 *    lazily initialised on the first `emit()` or `on()` call to avoid running
 *    a 1-second interval when the game is not active.
 *  - Call `dispose()` to stop the timer and clear all state (e.g. on app
 *    unmount). After disposal, the bus can be reused — subscriptions and
 *    emissions will auto-restart the timer.
 *  - For testing, use `createEventBus()` to obtain an isolated instance.
 */
export class EventBusClass {
  private handlers = new Map<keyof EventMap, Set<EventHandler<any>>>();
  private debug = false;

  /** Dedup cache: key = `${event}:${JSON.stringify(payload)}`, value = timestamp when added */
  private dedupCache = new Map<string, number>();

  /** Handle for the periodic TTL cleanup timer */
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  /** Catch-all handlers — called for every emitted event (used by DevPanel) */
  private anyHandlers = new Set<(event: string, payload: unknown) => void>();

  /** Whether this bus has been disposed and needs re-initialisation on next use */
  private disposed = false;

  constructor() {
    // Timer is NOT started here — see ensureCleanupTimer() for lazy start
  }

  /**
   * Lazily start the periodic cleanup timer.
   * Called on first `emit()` or `on()` so the timer only runs when needed.
   */
  private ensureCleanupTimer(): void {
    if (this.cleanupTimer !== null) return;
    this.disposed = false;

    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, ts] of this.dedupCache) {
        if (now - ts > 1000) {
          this.dedupCache.delete(key);
        }
      }
    }, 1000);
  }

  /** Enable or disable debug logging of emitted events. */
  setDebug(enabled: boolean) {
    this.debug = enabled;
  }

  /**
   * Build the dedup key for an event + payload pair.
   * Falls back to event-only key if payload serialization fails.
   */
  private dedupKey(event: string, payload: unknown): string {
    try {
      return `${event}:${JSON.stringify(payload)}`;
    } catch {
      return `${event}:<unserializable>`;
    }
  }

  /**
   * Subscribe to ALL events (catch-all). Used by DevPanel for event logging.
   * Returns an unsubscribe function.
   */
  onAny(handler: (event: string, payload: unknown) => void): () => void {
    this.ensureCleanupTimer();
    this.anyHandlers.add(handler);
    return () => {
      this.anyHandlers.delete(handler);
    };
  }

  /**
   * Subscribe to an event.
   * Returns an unsubscribe function — call it to remove the handler.
   */
  on<K extends keyof EventMap>(
    event: K,
    handler: EventHandler<EventMap[K]>,
  ): () => void {
    this.ensureCleanupTimer();

    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler);

    // Return unsubscribe closure
    return () => {
      const s = this.handlers.get(event);
      if (s) {
        s.delete(handler);
        if (s.size === 0) {
          this.handlers.delete(event);
        }
      }
    };
  }

  /**
   * Emit an event with its typed payload.
   * Calls every registered handler for the event key.
   *
   * Dedup: if the same (event, payload) pair was emitted within the last
   * DEDUP_WINDOW_MS, subsequent emissions are suppressed unless the event
   * is in DEDUP_EXEMPT.
   */
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    this.ensureCleanupTimer();

    if (this.debug) {
      console.log(`[EventBus] ${String(event)}`, payload);
    }

    // Exempt events always fire
    const eventStr = String(event);
    if (!DEDUP_EXEMPT.has(eventStr)) {
      const key = this.dedupKey(eventStr, payload);
      const now = Date.now();

      // Prune stale entries on every emit
      for (const [k, ts] of this.dedupCache) {
        if (now - ts > DEDUP_WINDOW_MS) {
          this.dedupCache.delete(k);
        }
      }

      // Check if we've seen this exact (event, payload) recently
      const lastSeen = this.dedupCache.get(key);
      if (lastSeen !== undefined && now - lastSeen < DEDUP_WINDOW_MS) {
        if (this.debug) {
          console.log(`[EventBus] Deduped ${eventStr} (within ${DEDUP_WINDOW_MS}ms window)`);
        }
        return; // suppressed
      }

      // Record this emission
      this.dedupCache.set(key, now);
    }

    // Notify catch-all handlers
    for (const anyHandler of this.anyHandlers) {
      try {
        anyHandler(eventStr, payload);
      } catch (err) {
        console.error('[EventBus] Error in onAny handler:', err);
      }
    }

    const set = this.handlers.get(event);
    if (!set) return;

    for (const handler of set) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${String(event)}":`, err);
      }
    }
  }

  /**
   * Remove a specific handler for an event.
   */
  off<K extends keyof EventMap>(
    event: K,
    handler: EventHandler<EventMap[K]>,
  ): void {
    const set = this.handlers.get(event);
    if (!set) return;

    set.delete(handler);
    if (set.size === 0) {
      this.handlers.delete(event);
    }
  }

  /**
   * Dispose of the event bus — stops timers and clears all caches/handlers.
   * Call this when the bus is no longer needed (e.g. app unmount).
   *
   * After disposal, the bus can still be used — the next `emit()` or `on()`
   * call will automatically re-initialise the timer (lazy start pattern).
   */
  dispose(): void {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.dedupCache.clear();
    this.handlers.clear();
    this.anyHandlers.clear();
    this.disposed = true;
  }

  /** Returns whether this bus instance has been disposed. */
  isDisposed(): boolean {
    return this.disposed;
  }
}

/**
 * Factory function to create an isolated EventBus instance.
 * Primarily intended for testing — each test gets a fresh bus
 * without polluting the global singleton.
 */
export function createEventBus(): EventBusClass {
  return new EventBusClass();
}

/** Singleton event bus instance */
export const eventBus = new EventBusClass();
