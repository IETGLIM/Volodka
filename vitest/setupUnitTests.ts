/**
 * Vitest setup for unit tests (Node.js environment).
 *
 * Three.js and some browser-oriented modules reference `self`, which is a
 * Web API not available in Node.js. Polyfill it so GLB-loading tests
 * (gltfScale.volodka, gltfScale.quaternius) don't crash with
 * "self is not defined".
 */
(globalThis as Record<string, unknown>).self = globalThis;
