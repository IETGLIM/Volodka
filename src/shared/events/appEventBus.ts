/**
 * Store→application event facade — no Engine import at call sites.
 * Bound to EventBus once in bindApplicationLayers().
 */

import type { ApplicationEventMap, ApplicationEventName } from './applicationEventMap';

export type AppEventUnsubscribe = () => void;

export interface AppEventBusBinding {
  emit<E extends ApplicationEventName>(event: E, payload: ApplicationEventMap[E]): void;
  on<E extends ApplicationEventName>(
    event: E,
    handler: (payload: ApplicationEventMap[E]) => void,
  ): AppEventUnsubscribe;
}

let binding: AppEventBusBinding | null = null;

export function bindAppEventBus(next: AppEventBusBinding): void {
  binding = next;
}

export function emitAppEvent<E extends ApplicationEventName>(
  event: E,
  payload: ApplicationEventMap[E],
): void {
  if (!binding) {
    if (import.meta.env?.DEV) {
      console.warn('[AppEventBus] emit before bind — dropped:', event);
    }
    return;
  }
  binding.emit(event, payload);
}

export function onAppEvent<E extends ApplicationEventName>(
  event: E,
  handler: (payload: ApplicationEventMap[E]) => void,
): AppEventUnsubscribe {
  if (!binding) {
    if (import.meta.env?.DEV) {
      console.warn('[AppEventBus] on before bind — no-op:', event);
    }
    return () => undefined;
  }
  return binding.on(event, handler);
}

/** Test helper — reset binding between unit tests. */
export function resetAppEventBusForTests(): void {
  binding = null;
}
