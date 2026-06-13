/* ─── EventBus subscription scope — batch subscribe / one-shot dispose ─── */
/*
 * Use in orchestrators instead of manual unsubs[] arrays:
 *
 *   useEffect(() => {
 *     const scope = eventBus.createScope();
 *     scope.on('combat:turn', handler, EventBusPriority.UI);
 *     scope.add(useGameStore.subscribe(...)); // non-EventBus cleanups too
 *     return () => scope.dispose();
 *   }, []);
 *
 * No handler references needed for unsubscribe — scope.dispose() removes all.
 */

import type { EventMap } from '@/engine/events';

type EventHandler<T> = (payload: T) => void;
type AnyEventHandler = (event: string, payload: unknown) => void;

/** Minimal EventBus surface required by EventBusScope (avoids circular imports). */
export interface EventBusScopeHost<TMap extends Record<string, unknown> = EventMap> {
  on<K extends keyof TMap>(
    event: K,
    handler: EventHandler<TMap[K]>,
    priority?: number,
  ): () => void;
  onAny(handler: AnyEventHandler, priority?: number): () => void;
}

export class EventBusScope<TMap extends Record<string, unknown> = EventMap> {
  private readonly cleanups: (() => void)[] = [];
  private closed = false;

  constructor(private readonly bus: EventBusScopeHost<TMap>) {}

  get isDisposed(): boolean {
    return this.closed;
  }

  get size(): number {
    return this.cleanups.length;
  }

  /**
   * Subscribe to a typed event. Returns `this` for chaining.
   * Throws if the scope is already disposed.
   */
  on<K extends keyof TMap>(
    event: K,
    handler: EventHandler<TMap[K]>,
    priority?: number,
  ): this {
    this.track(this.bus.on(event, handler, priority));
    return this;
  }

  /** Subscribe to all events (DevPanel logging, etc.). */
  onAny(handler: AnyEventHandler, priority?: number): this {
    this.track(this.bus.onAny(handler, priority));
    return this;
  }

  /** Register any teardown callback (Zustand subscribe, timers, etc.). */
  add(cleanup: () => void): this {
    this.track(cleanup);
    return this;
  }

  /** Unsubscribe everything registered through this scope (LIFO). Idempotent. */
  dispose(): void {
    if (this.closed) return;
    this.closed = true;

    for (let i = this.cleanups.length - 1; i >= 0; i--) {
      try {
        this.cleanups[i]();
      } catch (err) {
        console.error('[EventBusScope] Cleanup error:', err);
      }
    }
    this.cleanups.length = 0;
  }

  private track(cleanup: () => void): void {
    if (this.closed) {
      throw new Error('[EventBusScope] Cannot subscribe on a disposed scope');
    }
    this.cleanups.push(cleanup);
  }
}

/**
 * Register subscriptions inside `register`, return a single dispose for useEffect.
 * On registration throw, already-registered listeners are torn down.
 */
export function bindEventBusScope<TMap extends Record<string, unknown> = EventMap>(
  bus: EventBusScopeHost<TMap>,
  register: (scope: EventBusScope<TMap>) => void,
): () => void {
  const scope = new EventBusScope(bus);
  try {
    register(scope);
  } catch (err) {
    scope.dispose();
    throw err;
  }
  return () => scope.dispose();
}
