/* ─── Volodka RPG – typed event bus ─── */

import type { EventMap } from '@/engine/events';
import {
  clearDedupSlots,
  createDedupSlots,
  dedupShouldSuppress,
  DEDUP_WINDOW_MS,
  hashDedupPayload,
  type DedupSlot,
} from '@/engine/eventBusDedup';
import {
  EventBusPriority,
  snapshotListeners,
  type PrioritizedListener,
} from '@/engine/eventBusPriority';
import { EventBusScope, type EventBusScopeHost } from '@/engine/eventBusScope';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

export { EventBusPriority } from '@/engine/eventBusPriority';
export { EventBusScope, bindEventBusScope } from '@/engine/eventBusScope';
export type { EventBusScopeHost } from '@/engine/eventBusScope';
export type { EventMap, EventName, EmptyEventPayload } from '@/engine/events';
export { EMPTY_EVENT_PAYLOAD } from '@/engine/events';

type EventHandler<T> = (payload: T) => void;
type AnyEventHandler = (event: string, payload: unknown) => void;

/** Unsubscribe handle returned by eventBus.on() / onAny(). */
export type EventBusUnsubscribe = () => void;

/** Visual/atmospheric events where duplicate suppression within the window is safe. */
const DEDUP_ENABLED_EVENTS = [
  'fx:glitch',
  'fx:flash',
  'fx:shake',
  'fx:vignette',
  'camera:combat_impact',
  'camera:combat_shake',
  'weather:rain',
  'weather:snow',
] as const satisfies readonly (keyof EventMap)[];

const DEDUP_ENABLED = new Set<string>(DEDUP_ENABLED_EVENTS);

/**
 * A lightweight, typed pub/sub event bus with payload-aware deduplication.
 *
 * Rule: emit/on only at layer boundaries (3D→DOM, engine→UI).
 * Never use for intra-layer communication.
 *
 * Dedup logic:
 *  - Payload fingerprint is a 32-bit FNV hash of event + primitive fields only
 *    (no JSON.stringify, no retained key strings in the cache).
 *  - Fixed 64-slot array stores `{ hash, ts }` — O(64) lookup per emit, no Map churn.
 *  - Stale entries expire lazily inside dedupShouldSuppress on each emit (no background timer).
 *  - Dedup is opt-in: only events in DEDUP_ENABLED are suppressed when duplicated within the window.
 *
 * Dispatch order:
 *  - Typed handlers run first by ascending priority (Engine → Orchestrator → UI → FX).
 *  - onAny handlers run after typed handlers, also sorted by priority (Debug last).
 *  - Same priority tier preserves registration order (FIFO).
 *  - Pass `EventBusPriority.*` as the optional third argument to `on()` / `onAny()`.
 *
 * Dispatch safety:
 *  - Handlers are snapshotted per emit so subscribe/unsubscribe during dispatch is predictable.
 *  - dispose() bumps lifecycleGeneration; in-flight emit aborts before further onAny/typed handlers.
 *
 * Lifecycle:
 *  - Call `dispose()` to clear all state (e.g. on app unmount). The bus can be reused after
 *    handlers are re-subscribed.
 *  - Use `createScope()` in orchestrators — one `scope.dispose()` drops all listeners without
 *    storing handler references (see bindEventBusScope / useEventBusScope).
 *  - For testing, use `createEventBus()` to obtain an isolated instance.
 *  - In dev, `registerHmrDispose` clears the singleton when the module hot-reloads.
 */
export class EventBusClass<TMap extends object = EventMap>
  implements EventBusScopeHost<TMap>
{
  private handlers = new Map<keyof TMap, PrioritizedListener[]>();
  private debug = false;

  /** Fixed-size dedup slots — numeric hashes only */
  private dedupSlots: DedupSlot[] = createDedupSlots();

  /**
   * Bumped at the start of dispose() so an in-flight emit stops before onAny/typed dispatch.
   */
  private lifecycleGeneration = 0;

  /** Catch-all handlers — called after typed handlers (DevPanel logging) */
  private anyHandlers: PrioritizedListener<AnyEventHandler>[] = [];

  /** Monotonic registration order for stable tie-breaking */
  private nextListenerOrder = 0;

  /** Whether this bus has been disposed and needs re-initialisation on next use */
  private disposed = false;

  /** Safety limit: warn if more than this many handlers are registered for a single event.
   *  Catches subscription leaks early (e.g., component subscribing in render instead of useEffect). */
  private static MAX_HANDLERS_PER_EVENT = 20;

  /** Enable or disable debug logging of emitted events. */
  setDebug(enabled: boolean) {
    this.debug = enabled;
  }

  /** Create a scope that tracks subscriptions for batch dispose (orchestrator pattern). */
  createScope(): EventBusScope<TMap> {
    return new EventBusScope(this);
  }

  /** Record a dedup fingerprint — handled inside dedupShouldSuppress */
  private shouldSuppressDedup(event: string, payload: unknown, now: number): boolean {
    const hash = hashDedupPayload(event, payload);
    return dedupShouldSuppress(this.dedupSlots, hash, now);
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

  private isDispatchCancelled(dispatchGeneration: number): boolean {
    return dispatchGeneration !== this.lifecycleGeneration;
  }

  private registerListener<T>(
    list: PrioritizedListener<T>[],
    handler: T,
    priority: number,
  ): () => void {
    const entry: PrioritizedListener<T> = {
      handler,
      priority,
      order: this.nextListenerOrder++,
    };
    list.push(entry);
    return () => {
      const idx = list.findIndex((item) => item.handler === handler);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
    };
  }

  /**
   * Subscribe to ALL events (catch-all). Used by DevPanel for event logging.
   * Returns an unsubscribe function.
   */
  onAny(
    handler: AnyEventHandler,
    priority: number = EventBusPriority.Normal,
  ): EventBusUnsubscribe {
    this.disposed = false;
    return this.registerListener(this.anyHandlers, handler, priority);
  }

  /**
   * Subscribe to an event.
   * Returns an unsubscribe function — call it to remove the handler.
   *
   * @param priority Lower runs first — use `EventBusPriority` tiers (default: Normal/UI).
   */
  on<K extends keyof TMap>(
    event: K,
    handler: EventHandler<TMap[K]>,
    priority: number = EventBusPriority.Normal,
  ): EventBusUnsubscribe {
    this.disposed = false;

    let list = this.handlers.get(event);
    if (!list) {
      list = [];
      this.handlers.set(event, list);
    }

    const unsubscribe = this.registerListener(list, handler, priority);

    if (list.length > EventBusClass.MAX_HANDLERS_PER_EVENT) {
      console.warn(
        `[EventBus] ${String(event)} has ${list.length} handlers (limit: ${EventBusClass.MAX_HANDLERS_PER_EVENT}). ` +
        `Possible subscription leak — ensure each eventBus.on() is cleaned up in useEffect return.`
      );
    }

    return () => {
      unsubscribe();
      const remaining = this.handlers.get(event);
      if (remaining && remaining.length === 0) {
        this.handlers.delete(event);
      }
    };
  }

  /**
   * Emit an event with its typed payload.
   * Calls every registered handler for the event key in priority order.
   *
   * Dedup: for events in DEDUP_ENABLED, if the same (event, payload) pair was
   * emitted within the last DEDUP_WINDOW_MS, subsequent emissions are suppressed.
   */
  emit<K extends keyof TMap>(event: K, payload: TMap[K]): void {
    const dispatchGeneration = this.lifecycleGeneration;

    if (this.debug) {
      console.log(`[EventBus] ${String(event)}`, payload);
    }

    const eventStr = String(event);
    if (DEDUP_ENABLED.has(eventStr)) {
      const now = Date.now();
      if (this.shouldSuppressDedup(eventStr, payload, now)) {
        if (this.debug) {
          console.log(`[EventBus] Deduped ${eventStr} (within ${DEDUP_WINDOW_MS}ms window)`);
        }
        return;
      }
    }

    if (this.isDispatchCancelled(dispatchGeneration)) {
      return;
    }

    const anySnapshot =
      this.anyHandlers.length > 0 ? snapshotListeners(this.anyHandlers) : [];

    const list = this.handlers.get(event);
    if (list && list.length > 0) {
      const handlerSnapshot = snapshotListeners(list);
      for (const { handler } of handlerSnapshot) {
        if (this.isDispatchCancelled(dispatchGeneration)) {
          return;
        }
        try {
          (handler as EventHandler<TMap[K]>)(payload);
        } catch (err) {
          this.logHandlerError(`[EventBus] Error in handler for "${String(event)}":`, err);
        }
      }
    }

    if (this.isDispatchCancelled(dispatchGeneration)) {
      return;
    }

    if (this.anyHandlers.length > 0) {
      for (const { handler: anyHandler } of anySnapshot) {
        if (this.isDispatchCancelled(dispatchGeneration)) {
          return;
        }
        try {
          anyHandler(eventStr, payload);
        } catch (err) {
          this.logHandlerError('[EventBus] Error in onAny handler:', err);
        }
      }
    }
  }

  /**
   * Remove a specific handler for an event.
   */
  off<K extends keyof TMap>(
    event: K,
    handler: EventHandler<TMap[K]>,
  ): void {
    const list = this.handlers.get(event);
    if (!list) return;

    const idx = list.findIndex((entry) => entry.handler === handler);
    if (idx !== -1) {
      list.splice(idx, 1);
    }
    if (list.length === 0) {
      this.handlers.delete(event);
    }
  }

  /**
   * Dispose of the event bus — clears all caches/handlers and cancels in-flight dispatch.
   * Call this when the bus is no longer needed (e.g. app unmount).
   *
   * After disposal, the bus can still be used — re-subscribe handlers before emitting.
   */
  dispose(): void {
    this.lifecycleGeneration++;
    clearDedupSlots(this.dedupSlots);
    this.handlers.clear();
    this.anyHandlers.length = 0;
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
export function createEventBus<TMap extends object = EventMap>(): EventBusClass<TMap> {
  return new EventBusClass<TMap>();
}

/** Singleton event bus instance — typed with the consolidated EventMap. */
export const eventBus = createEventBus();

export function disposeEventBus(): void {
  eventBus.dispose();
}

registerHmrDispose(disposeEventBus);
