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

import { devLog, devWarn } from '@/shared/utils/devLog';
export { EventBusPriority } from '@/engine/eventBusPriority';
export { EventBusScope, bindEventBusScope } from '@/engine/eventBusScope';
export type { EventBusScopeHost } from '@/engine/eventBusScope';
export type { EventMap, EventName, EmptyEventPayload } from '@/engine/events';
export { EMPTY_EVENT_PAYLOAD } from '@/engine/events';

export interface EventBusOptions {
  /** Hard cap on typed handlers per event key (default 20). */
  maxHandlersPerEvent?: number;
  /** Hard cap on onAny catch-all handlers (default 20). */
  maxAnyHandlers?: number;
}

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
 *  - Call `dispose()` to clear all state (e.g. on app unmount).
 *  - Call `revive()` before `on()` / `onAny()` after disposal (e.g. `reviveGameEngine()`).
 *  - Subscribing on a disposed bus throws — never silently clears the disposed flag.
 *  - Per-event and onAny handler counts are hard-capped (default 20); overflow throws.
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

  /** Monotonic listener ids for O(1) unsubscribe */
  private nextListenerId = 0;

  /** listener id → current index in a handler list */
  private listenerIndexById = new Map<number, number>();

  /** Hard caps — subscription throws when exceeded (catches listener leaks). */
  private readonly maxHandlersPerEvent: number;
  private readonly maxAnyHandlers: number;

  /** Whether this bus has been disposed — subscribe only after revive(). */
  private disposed = false;

  /**
   * Count of auto-revives triggered by subscribe on a disposed bus.
   * Non-zero indicates a Strict Mode timing race (child effect before parent revive).
   * Inspectable in dev tools for debugging handler leaks.
   */
  private autoReviveCount = 0;

  constructor(options: EventBusOptions = {}) {
    this.maxHandlersPerEvent = options.maxHandlersPerEvent ?? 20;
    this.maxAnyHandlers = options.maxAnyHandlers ?? 20;
  }

  private assertHandlerCapacity(currentCount: number, limit: number, label: string): void {
    if (currentCount < limit) return;
    throw new Error(
      `[EventBus] Cannot subscribe — ${label} already has ${currentCount} handlers (limit: ${limit}). ` +
        'Fix the subscription leak or call the returned unsubscribe function.',
    );
  }

  private assertSubscribable(operation: 'on' | 'onAny'): void {
    if (!this.disposed) return;
    // Auto-revive: in React Strict Mode the singleton bus may be disposed
    // during the first unmount while child effects from the second mount
    // race to subscribe before the parent's revive call.  Reviving here
    // is safe — the bus has already been cleared by dispose().
    this.autoReviveCount++;
    if (process.env.NODE_ENV !== 'production') {
      devWarn(
        `[EventBus] Auto-revive #${this.autoReviveCount} on ${operation}(). ` +
        'A handler was subscribed on a disposed bus. This is expected in React ' +
        'Strict Mode (child effect before parent revive). If you see this outside ' +
        'Strict Mode, a subscription leak or lifecycle ordering bug may exist.',
      );
    }
    this.disposed = false;
    clearDedupSlots(this.dedupSlots);
  }

  /** Enable or disable debug logging of emitted events. */
  setDebug(enabled: boolean): void {
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
        devWarn(message);
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
    const listenerId = this.nextListenerId++;
    const entry: PrioritizedListener<T> = {
      handler,
      priority,
      order: this.nextListenerOrder++,
      id: listenerId,
    };
    const index = list.length;
    list.push(entry);
    this.listenerIndexById.set(listenerId, index);
    return () => {
      this.removeListenerById(list, listenerId);
    };
  }

  private removeListenerById<T>(list: PrioritizedListener<T>[], listenerId: number): void {
    const index = this.listenerIndexById.get(listenerId);
    if (index === undefined || index >= list.length || list[index].id !== listenerId) {
      return;
    }

    this.listenerIndexById.delete(listenerId);
    const lastIndex = list.length - 1;
    if (index !== lastIndex) {
      const last = list[lastIndex];
      list[index] = last;
      this.listenerIndexById.set(last.id, index);
    }
    list.pop();
  }

  /**
   * Subscribe to ALL events (catch-all). Used by DevPanel for event logging.
   * Returns an unsubscribe function.
   */
  onAny(
    handler: AnyEventHandler,
    priority: number = EventBusPriority.Normal,
  ): EventBusUnsubscribe {
    this.assertSubscribable('onAny');
    this.assertHandlerCapacity(this.anyHandlers.length, this.maxAnyHandlers, 'onAny');
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
    this.assertSubscribable('on');

    let list = this.handlers.get(event);
    if (!list) {
      list = [];
      this.handlers.set(event, list);
    }

    this.assertHandlerCapacity(list.length, this.maxHandlersPerEvent, String(event));

    const unsubscribe = this.registerListener(list, handler, priority);

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
      devLog(`[EventBus] ${String(event)}`, payload);
    }

    const eventStr = String(event);
    if (DEDUP_ENABLED.has(eventStr)) {
      const now = Date.now();
      if (this.shouldSuppressDedup(eventStr, payload, now)) {
        if (this.debug) {
          devLog(`[EventBus] Deduped ${eventStr} (within ${DEDUP_WINDOW_MS}ms window)`);
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
      this.removeListenerById(list, list[idx].id);
    }
    if (list.length === 0) {
      this.handlers.delete(event);
    }
  }

  /**
   * Dispose of the event bus — clears all caches/handlers and cancels in-flight dispatch.
   * Call this when the bus is no longer needed (e.g. app unmount).
   * After disposal, call `revive()` before subscribing again.
   */
  dispose(): void {
    this.lifecycleGeneration++;
    clearDedupSlots(this.dedupSlots);
    this.handlers.clear();
    this.anyHandlers.length = 0;
    this.listenerIndexById.clear();
    this.disposed = true;
    this.autoReviveCount = 0;
  }

  /**
   * HMR-safe reset: clears all state (handlers, dedup, generation) but
   * does NOT set the disposed flag.  Used by the singleton eventBus so
   * that components re-mounted after a hot-module replacement can
   * subscribe without hitting the disposed-bus guard.
   */
  resetForHmr(): void {
    this.lifecycleGeneration++;
    clearDedupSlots(this.dedupSlots);
    this.handlers.clear();
    this.anyHandlers.length = 0;
    this.listenerIndexById.clear();
  }

  /** Returns whether this bus instance has been disposed. */
  isDisposed(): boolean {
    return this.disposed;
  }

  /** Returns the number of auto-revives since the last dispose(). Non-zero in dev indicates Strict Mode races. */
  getAutoReviveCount(): number {
    return this.autoReviveCount;
  }

  /** Whether at least one typed handler is registered for the event. */
  hasHandlers<K extends keyof TMap>(event: K): boolean {
    const list = this.handlers.get(event);
    return list !== undefined && list.length > 0;
  }

  /** Re-arm after orchestrator remount (React StrictMode). Idempotent while already live. */
  revive(): void {
    if (!this.disposed) return;
    this.disposed = false;
    clearDedupSlots(this.dedupSlots);
  }
}

/**
 * Factory function to create an isolated EventBus instance.
 * Primarily intended for testing — each test gets a fresh bus
 * without polluting the global singleton.
 */
export function createEventBus<TMap extends object = EventMap>(
  options?: EventBusOptions,
): EventBusClass<TMap> {
  return new EventBusClass<TMap>(options);
}

/** Singleton event bus instance — typed with the consolidated EventMap. */
export const eventBus = createEventBus();

export function disposeEventBus(): void {
  eventBus.dispose();
}

export function reviveEventBus(): void {
  eventBus.revive();
}

/**
 * HMR-safe reset for the singleton eventBus: clears handlers and
 * dedup state but does NOT mark the bus as disposed, so components
 * re-mounted after HMR can subscribe without errors.
 */
function hmrSafeResetEventBus(): void {
  eventBus.resetForHmr();
}

registerHmrDispose(hmrSafeResetEventBus);
