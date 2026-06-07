let physicsPreloadPromise: Promise<unknown> | null = null;

/** Warm Rapier WASM + physics-scene chunk during menu / narrative preload. */
export function preloadPhysicsChunk(): Promise<void> {
  if (!physicsPreloadPromise) {
    physicsPreloadPromise = import('@/components/3d/PhysicsSceneInner');
  }
  return physicsPreloadPromise.then(() => undefined);
}
