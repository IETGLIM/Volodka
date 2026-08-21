/**
 * Store→application event facade — no Engine import at call sites.
 * Bound to EventBus once in bindApplicationLayers().
 */

import type { ApplicationEventMap, ApplicationEventName } from './applicationEventMap';

import { devWarn } from '@/shared/utils/devLog';
export type AppEventUnsubscribe = () => void;

export interface AppEventBusBinding {
  emit<E extends ApplicationEventName>(event: E, payload: ApplicationEventMap[E]): void;
  on<E extends ApplicationEventName>(
    event: E,
    handler: (payload: ApplicationEventMap[E]) => void,
  ): AppEventUnsubscribe;
}

let binding: AppEventBusBinding | null = null;

type QueuedEmit<E extends ApplicationEventName = ApplicationEventName> = {
  event: E;
  payload: ApplicationEventMap[E];
};

const preBindQueue: QueuedEmit[] = [];

function flushPreBindQueue(): void {
  if (!binding || preBindQueue.length === 0) return;
  const queued = preBindQueue.splice(0);
  for (const item of queued) {
    binding.emit(item.event, item.payload);
  }
}

export function bindAppEventBus(next: AppEventBusBinding): void {
  binding = next;
  flushPreBindQueue();
}

export function emitAppEvent<E extends ApplicationEventName>(
  event: E,
  payload: ApplicationEventMap[E],
): void {
  if (!binding) {
    preBindQueue.push({ event, payload });
    if (import.meta.env?.DEV) {
      devWarn('[AppEventBus] emit before bind — queued:', event);
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
      devWarn('[AppEventBus] on before bind — no-op:', event);
    }
    return () => undefined;
  }
  return binding.on(event, handler);
}

/** Test helper — reset binding between unit tests. */
export function resetAppEventBusForTests(): void {
  binding = null;
  preBindQueue.length = 0;
}
