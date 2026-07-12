let physicsPreloadPromise: Promise<unknown> | null = null;

/** Warm Rapier WASM + physics-scene chunk when entering 3D gameplay (see usePhysicsPreload). */
export function preloadPhysicsChunk(): Promise<void> {
  if (!physicsPreloadPromise) {
    physicsPreloadPromise = import('@/components/3d/PhysicsSceneInner');
  }
  return physicsPreloadPromise.then(() => undefined);
}
