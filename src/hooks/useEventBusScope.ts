import { useEffect, type DependencyList } from 'react';
import { eventBus, type EventBusClass } from '@/engine/EventBus';
import { bindEventBusScope, type EventBusScope } from '@/engine/eventBusScope';
import { withHmrCleanup } from '@/shared/dev/hmrDispose';

/**
 * React helper — register EventBus listeners in `register(scope)`;
 * scope.dispose() runs automatically on unmount or before re-register.
 */
export function useEventBusScope(
  register: (scope: EventBusScope) => void,
  deps: DependencyList,
  bus: EventBusClass = eventBus,
): void {
  useEffect(
    () => withHmrCleanup(bindEventBusScope(bus, register)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- register callback identity is caller-controlled
    deps,
  );
}
