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

/** Max dedup cache entries — prevents unbounded growth from large payload keys */
const MAX_DEDUP_CACHE_SIZE = 64;

/**
 * A lightweight, typed pub/sub event bus with payload-aware deduplication.
 *
 * Rule: emit/on only at layer boundaries (3D→DOM, engine→UI).
 * Never use for intra-layer communication.
 *
 * Dedup logic:
 *  - Key uses event name + primitive payload fields (no JSON.stringify) so
 *    different payloads for the same event are NOT suppressed.
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

  /** Dedup cache: compact key → timestamp when added */
  private dedupCache = new Map<string, number>();

  /** Handle for the periodic TTL cleanup timer */
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Bumped on dispose/stop so in-flight interval callbacks from a prior
   * generation become no-ops instead of touching cleared state.
   */
  private cleanupGeneration = 0;

  /** Catch-all handlers — called for every emitted event (used by DevPanel) */
  private anyHandlers = new Set<(event: string, payload: unknown) => void>();

  /** Whether this bus has been disposed and needs re-initialisation on next use */
  private disposed = false;

  /** Safety limit: warn if more than this many handlers are registered for a single event.
   *  Catches subscription leaks early (e.g., component subscribing in render instead of useEffect). */
  private static MAX_HANDLERS_PER_EVENT = 20;

  constructor() {
    // Timer is NOT started here — see ensureCleanupTimer() for lazy start
  }

  /** Stop the periodic cleanup timer and invalidate any in-flight callbacks. */
  private stopCleanupTimer(): void {
    this.cleanupGeneration++;
    const timer = this.cleanupTimer;
    this.cleanupTimer = null;
    if (timer !== null) {
      clearInterval(timer);
    }
  }

  /**
   * Lazily start the periodic cleanup timer.
   * Called on first `emit()` or `on()` so the timer only runs when needed.
   */
  private ensureCleanupTimer(): void {
    if (this.cleanupTimer !== null) return;
    this.disposed = false;

    const generation = this.cleanupGeneration;
    this.cleanupTimer = setInterval(() => {
      if (generation !== this.cleanupGeneration) return;

      const now = Date.now();
      for (const [key, ts] of this.dedupCache) {
        if (now - ts > DEDUP_WINDOW_MS) {
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
   * Build a compact dedup key from event name + primitive payload fields.
   * Skips nested objects/arrays to avoid retaining large serialized blobs.
   */
  private dedupKey(event: string, payload: unknown): string {
    if (payload === null || payload === undefined) return event;
    if (typeof payload !== 'object') return `${event}:${String(payload)}`;

    const obj = payload as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return event;

    const parts: string[] = [event];
    for (const key of keys.sort()) {
      const value = obj[key];
      if (value === undefined) continue;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        parts.push(`${key}=${value}`);
      } else if (
        Array.isArray(value) &&
        value.every((entry) => typeof entry === 'number' || typeof entry === 'string')
      ) {
        parts.push(`${key}=${value.join(',')}`);
      }
    }
    return parts.join('|');
  }

  /** Log handler errors without letting logging failures abort dispatch */
  private logHandlerError(message: string, err: unknown): void {
    try {
      console.error(message, err);
    } catch {
      try {
        console.warn(message);
      } catch {
        // Swallow — must not prevent remaining handlers from running
      }
    }
  }

  /** Record a dedup key with bounded cache size */
  private recordDedup(key: string, now: number): void {
    if (this.dedupCache.size >= MAX_DEDUP_CACHE_SIZE) {
      const oldest = this.dedupCache.keys().next().value;
      if (oldest !== undefined) {
        this.dedupCache.delete(oldest);
      }
    }
    this.dedupCache.set(key, now);
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

    // Safety: warn about potential subscription leaks
    if (set.size > EventBusClass.MAX_HANDLERS_PER_EVENT) {
      console.warn(
        `[EventBus] ${String(event)} has ${set.size} handlers (limit: ${EventBusClass.MAX_HANDLERS_PER_EVENT}). ` +
        `Possible subscription leak — ensure each eventBus.on() is cleaned up in useEffect return.`
      );
    }

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
      this.recordDedup(key, now);
    }

    // Notify catch-all handlers
    for (const anyHandler of this.anyHandlers) {
      try {
        anyHandler(eventStr, payload);
      } catch (err) {
        this.logHandlerError('[EventBus] Error in onAny handler:', err);
      }
    }

    const set = this.handlers.get(event);
    if (!set) return;

    for (const handler of set) {
      try {
        handler(payload);
      } catch (err) {
        this.logHandlerError(`[EventBus] Error in handler for "${String(event)}":`, err);
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
    this.stopCleanupTimer();
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
