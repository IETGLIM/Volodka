/**
 * Vite alias shim for @dimforge/rapier3d-compat.
 * Re-export upstream init — it inlines WASM bytes; calling rapier_wasm3d.js with {}
 * leaves module_or_path undefined and crashes production with "Invalid base URL".
 */
export * from '@dimforge/rapier3d-compat-original';
export { init } from '@dimforge/rapier3d-compat-original';
