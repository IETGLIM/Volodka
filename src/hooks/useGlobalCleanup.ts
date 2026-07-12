import { useEffect } from 'react';
import {
  registerGlobalCleanup,
  type GlobalCleanupHandler,
} from '@/engine/core/GlobalCleanupService';

/**
 * Register a global cleanup handler for scene unload, combat end, or orchestrator unmount.
 * Prefer EventBus `scene:unload` when you only need scene-scoped teardown.
 */
export function useGlobalCleanup(handler: GlobalCleanupHandler): void {
  useEffect(() => registerGlobalCleanup(handler), [handler]);
}
