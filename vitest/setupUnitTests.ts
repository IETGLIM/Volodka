/**
 * Vitest setup for unit tests (Node.js environment).
 *
 * Three.js and some browser-oriented modules reference `self`, which is a
 * Web API not available in Node.js. Polyfill it so GLB-loading tests
 * (gltfScale.volodka, gltfScale.quaternius) don't crash with
 * "self is not defined".
 *
 * [VITE-8] vitest 4 tears down environments faster than vitest 3.
 * Lazy import chains (story/dialogue/quests/sceneDefinitions) may still
 * be resolving when the environment is destroyed → EnvironmentTeardownError.
 * We wait for dynamic imports to settle in afterEach before allowing teardown.
 */
import { afterEach, vi } from 'vitest';

(globalThis as Record<string, unknown>).self = globalThis;

afterEach(async () => {
  await vi.dynamicImportSettled();
});
