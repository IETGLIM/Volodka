/**
 * Vite alias shim for @dimforge/rapier3d-compat.
 * Upstream init() passes WASM bytes positionally (deprecated); we call wasm init
 * with the object form so production consoles stay clean.
 */
export * from '@dimforge/rapier3d-compat-original';

let initialized = false;

export async function init(): Promise<void> {
  if (initialized) return;
  const wasmInit = (await import('@dimforge/rapier3d-compat/rapier_wasm3d.js')).default;
  await wasmInit({});
  initialized = true;
}
