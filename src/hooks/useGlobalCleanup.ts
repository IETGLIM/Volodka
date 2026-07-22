import { useEffect, useRef } from 'react';
import {
  registerGlobalCleanup,
  type GlobalCleanupHandler,
  type GlobalCleanupContext,
} from '@/engine/core/GlobalCleanupService';

/**
 * Register a global cleanup handler for scene unload, combat end, or orchestrator unmount.
 * Prefer EventBus `scene:unload` when you only need scene-scoped teardown.
 *
 * Uses a ref to avoid re-registering when the handler reference changes
 * (e.g. inline function in the calling component).
 */
export function useGlobalCleanup(handler: GlobalCleanupHandler): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const ref = handlerRef;
    const wrapped: GlobalCleanupHandler = (ctx: GlobalCleanupContext) => ref.current(ctx);
    return registerGlobalCleanup(wrapped);
  }, []);
}
