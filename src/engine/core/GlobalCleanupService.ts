/**
 * Central registry for scene/combat/unmount teardown hooks.
 * Orchestrators register via useGlobalCleanup(); SceneTransitionManager invokes on scene:unload.
 */

import type { SceneId } from '@/shared/types/game';

export type GlobalCleanupReason = 'scene-unload' | 'combat-end' | 'unmount';

export interface GlobalCleanupContext {
  reason: GlobalCleanupReason;
  sceneId: SceneId;
  nextSceneId?: SceneId;
}

export type GlobalCleanupHandler = (ctx: GlobalCleanupContext) => void;

const handlers = new Set<GlobalCleanupHandler>();
const moduleCleanupBinders = new Set<() => void>();

/** Register a global cleanup handler. Returns unsubscribe. */
export function registerGlobalCleanup(handler: GlobalCleanupHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

/**
 * Register a module-level cleanup binder (import-time singletons).
 * Called once at module load and again from `reviveModuleGlobalCleanupBindings()`.
 */
export function registerModuleGlobalCleanupBinder(bind: () => void): void {
  moduleCleanupBinders.add(bind);
}

/** Re-arm module-level cleanup handlers after `resetGlobalCleanupRegistry()`. */
export function reviveModuleGlobalCleanupBindings(): void {
  for (const bind of moduleCleanupBinders) {
    bind();
  }
}

/** Test / diagnostics — count of registered handlers. */
export function getRegisteredGlobalCleanupHandlerCount(): number {
  return handlers.size;
}

/** Run all registered handlers for a cleanup context (errors logged, never thrown). */
export function runGlobalCleanup(ctx: GlobalCleanupContext): void {
  for (const handler of handlers) {
    try {
      handler(ctx);
    } catch (err) {
      console.warn('[GlobalCleanupService] handler failed:', err);
    }
  }
}

export function runGlobalSceneUnload(fromSceneId: SceneId, nextSceneId: SceneId): void {
  runGlobalCleanup({
    reason: 'scene-unload',
    sceneId: fromSceneId,
    nextSceneId,
  });
}

export function runGlobalCombatEnd(sceneId: SceneId): void {
  runGlobalCleanup({
    reason: 'combat-end',
    sceneId,
  });
}

export function runGlobalUnmountCleanup(sceneId: SceneId): void {
  runGlobalCleanup({
    reason: 'unmount',
    sceneId,
  });
}

/** Clear registry on full engine dispose (HMR / orchestrator unmount). */
export function resetGlobalCleanupRegistry(): void {
  handlers.clear();
}
