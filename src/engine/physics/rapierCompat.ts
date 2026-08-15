/**
 * Vite alias shim for @dimforge/rapier3d-compat.
 * Re-export upstream init — it inlines WASM bytes; calling rapier_wasm3d.js with {}
 * leaves module_or_path undefined and crashes production with "Invalid base URL".
 *
 * Improvements:
 * - Expose wrapped init that supports external wasm path /rapier/rapier_wasm3d_bg.wasm
 *   when file exists in public/ (allows caching, streaming compilation).
 * - Add performance marks and fallback to inline base64 if external fetch fails.
 * - Keep original re-exports for compatibility with @react-three/rapier.
 */

import * as RapierOriginal from '@dimforge/rapier3d-compat-original';

// Re-export all original exports (World, RigidBody, etc.)
export * from '@dimforge/rapier3d-compat-original';

let initPromise: Promise<void> | null = null;
let initMode: 'pending' | 'external' | 'inline' | 'failed' = 'pending';

const EXTERNAL_WASM_URL = '/rapier/rapier_wasm3d_bg.wasm';

/**
 * Try to init with external wasm file if available.
 * Falls back to inline base64 (default behavior) if fetch fails or not deployed.
 */
export async function init(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Mark start
    if (typeof performance !== 'undefined' && performance.mark) {
      try {
        performance.mark('rapier:init-start');
      } catch {}
    }

    // First, attempt external wasm fetch if we're in browser and file likely exists
    // We probe via HEAD request to avoid double-download if file missing
    if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      try {
        // Quick existence check — only if SKIP external not set
        const probeController = new AbortController();
        const timeout = setTimeout(() => probeController.abort(), 1500);
        const probe = await fetch(EXTERNAL_WASM_URL, { method: 'HEAD', signal: probeController.signal }).catch(() => null);
        clearTimeout(timeout);

        if (probe && probe.ok) {
          // External file exists — try initializing with it
          // wasm-bindgen supports {module_or_path: string | URL | Response}
          try {
            await (RapierOriginal as unknown as { init: (opts?: unknown) => Promise<void> }).init({
              module_or_path: EXTERNAL_WASM_URL,
            });
            initMode = 'external';
            if (process.env.NODE_ENV !== 'production') {
              console.log(`[rapierCompat] ✓ Initialized with external WASM: ${EXTERNAL_WASM_URL}`);
            }
            return;
          } catch (e) {
            console.warn(`[rapierCompat] External WASM init failed, falling back to inline:`, e);
            // fall through to inline
          }
        }
      } catch {
        // probe failed, fall through
      }
    }

    // Fallback: inline base64 (default from rapier.mjs).
    // NOTE: rapier3d-compat@0.19.3 has an internal bug — when using the inline
    // base64 WASM fallback, it calls its own init function with a Uint8Array
    // (not an options object), which triggers the console warning:
    //   "using deprecated parameters for the initialization function"
    // This is NOT from our code — it's from rapier's internal default path.
    // We suppress the warning during init to keep the console clean.
    const originalWarn = console.warn;
    try {
      console.warn = (...args: unknown[]) => {
        if (typeof args[0] === 'string' && args[0].includes('deprecated parameters')) {
          return;
        }
        originalWarn.apply(console, args as never);
      };
      await (RapierOriginal as unknown as { init: (opts?: unknown) => Promise<void> }).init({});
      initMode = 'inline';
      if (process.env.NODE_ENV !== 'production') {
        console.log('[rapierCompat] ✓ Initialized with inline base64 WASM');
      }
    } catch (err) {
      console.warn = originalWarn;
      initMode = 'failed';
      initPromise = null;
      throw err;
    } finally {
      // Ensure console.warn is always restored even if init threw
      console.warn = originalWarn;
      if (typeof performance !== 'undefined' && performance.mark) {
        try {
          performance.mark('rapier:init-end');
          performance.measure('rapier:init', 'rapier:init-start', 'rapier:init-end');
        } catch {}
      }
    }
  })();

  return initPromise;
}

export function getRapierInitMode(): typeof initMode {
  return initMode;
}

export function resetRapierInitForTests(): void {
  initPromise = null;
  initMode = 'pending';
}
