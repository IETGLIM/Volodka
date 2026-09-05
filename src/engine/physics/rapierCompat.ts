/**
 * Vite alias shim for @dimforge/rapier3d-compat.
 *
 * Re-exports the high-level Rapier API (World, RigidBody, etc.) from rapier.mjs.
 * Init strategy: fetch external WASM file → pass URL to rapier's init.
 * No HEAD probe (saves 1 RTT). Falls back to inline base64 if external fails.
 *
 * NOTE: rapier.mjs (2.2MB) contains inline base64 WASM as a fallback. We always
 * pass module_or_path: EXTERNAL_WASM_URL, so the base64 path is never executed
 * at runtime — but it's still in the bundle. Stripping it would require either:
 * (a) a Vite plugin that rewrites rapier.mjs to remove the base64 literal, or
 * (b) switching to the low-level rapier_wasm3d.js API (Raw* classes) — but that
 *     would break @react-three/rapier which expects World/RigidBody.
 * For now, we accept the 829KB gzip as the cost of using @react-three/rapier.
 * The chunk is lazy-loaded (only on first 3D exploration), so it doesn't affect
 * LCP or menu INP.
 */

import * as RapierOriginal from '@dimforge/rapier3d-compat-original';

import { devLog, devWarn } from '@/shared/utils/devLog';
import { markRapierStatus } from '@/engine/diagnostics/runtimeDiagnostics';
// Re-export all original exports (World, RigidBody, etc.)
export * from '@dimforge/rapier3d-compat-original';

let initPromise: Promise<void> | null = null;
let initMode: 'pending' | 'external' | 'inline' | 'failed' = 'pending';

const EXTERNAL_WASM_URL = '/rapier/rapier_wasm3d_bg.wasm';

/**
 * Initialize Rapier WASM. Tries external file first (no HEAD probe — saves 1 RTT),
 * falls back to inline base64 if fetch fails.
 *
 * Dedup across module instances: relies on `resolve.dedupe` in vite.config.ts.
 */
export async function init(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (typeof performance !== 'undefined' && performance.mark) {
      try {
        performance.mark('rapier:init-start');
      } catch {}
    }

    // Strategy 1: external WASM file (production + dev with public/rapier/)
    // No HEAD probe — saves 1 RTT (~50-200ms). If the fetch fails, the catch
    // falls back to inline base64. vercel.json headers guarantee the file exists
    // with immutable cache in production.
    if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      try {
        await (RapierOriginal as unknown as { init: (opts?: unknown) => Promise<void> }).init({
          module_or_path: EXTERNAL_WASM_URL,
        });
        initMode = 'external';
        markRapierStatus('external');
        if (process.env.NODE_ENV !== 'production') {
          devLog(`[rapierCompat] ✓ Initialized with external WASM: ${EXTERNAL_WASM_URL}`);
        }
        return;
      } catch (e) {
        devWarn(`[rapierCompat] External WASM init failed, falling back to inline:`, e);
      }
    }

    // Strategy 2: inline base64 fallback (dev without public/rapier/)
    const originalWarn = console.warn;
    try {
      console.warn = (...args: unknown[]) => {
        if (typeof args[0] === 'string' && args[0].includes('deprecated parameters')) return;
        originalWarn.apply(console, args as never);
      };
      await (RapierOriginal as unknown as { init: (opts?: unknown) => Promise<void> }).init({});
      initMode = 'inline';
      markRapierStatus('inline');
      if (process.env.NODE_ENV !== 'production') {
        devLog('[rapierCompat] ✓ Initialized with inline base64 WASM (fallback)');
      }
    } catch (err) {
      console.warn = originalWarn;
      initMode = 'failed';
      markRapierStatus('failed');
      initPromise = null;
      throw err;
    } finally {
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
