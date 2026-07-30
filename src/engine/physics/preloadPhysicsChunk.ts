let physicsPreloadPromise: Promise<unknown> | null = null;

/**
 * Warm physics-scene JS chunk AND Rapier WASM init.
 * Reporting `physics_wasm` after chunk-only import was premature — Suspense
 * could still show SimplePlayer while loading claimed ready.
 *
 * On failure the cached promise is cleared so a later call can retry
 * (transient network / WASM init errors should not poison the session).
 */
export function preloadPhysicsChunk(): Promise<void> {
  if (!physicsPreloadPromise) {
    physicsPreloadPromise = (async () => {
      await import('@/components/3d/PhysicsSceneInner');
      const rapier = await import('@/engine/physics/rapierCompat');
      await rapier.init();
    })().catch((error) => {
      physicsPreloadPromise = null;
      throw error;
    });
  }
  return physicsPreloadPromise.then(() => undefined);
}

/** Test helper — drop cached promise between cases. */
export function resetPhysicsPreloadCacheForTests(): void {
  physicsPreloadPromise = null;
}
