let physicsPreloadPromise: Promise<unknown> | null = null;

/**
 * Warm physics-scene JS chunk AND Rapier WASM init.
 * Reporting `physics_wasm` after chunk-only import was premature — Suspense
 * could still show SimplePlayer while loading claimed ready.
 */
export function preloadPhysicsChunk(): Promise<void> {
  if (!physicsPreloadPromise) {
    physicsPreloadPromise = (async () => {
      await import('@/components/3d/PhysicsSceneInner');
      const rapier = await import('@/engine/physics/rapierCompat');
      await rapier.init();
    })();
  }
  return physicsPreloadPromise.then(() => undefined);
}
