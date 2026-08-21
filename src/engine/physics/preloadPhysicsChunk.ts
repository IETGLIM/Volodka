import { devLog } from '@/shared/utils/devLog';
let physicsPreloadPromise: Promise<unknown> | null = null;

type WasmMetrics = {
  jsChunkMs: number;
  wasmInitMs: number;
  totalMs: number;
  wasmSizeKb?: number;
  mode: 'inline-base64' | 'external-fetch';
};

let lastMetrics: WasmMetrics | null = null;

function mark(name: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    try {
      performance.mark(name);
    } catch {
      // ignore if mark exists
    }
  }
}

function measure(name: string, start: string, end: string): number {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      const m = performance.measure(name, start, end);
      return m.duration;
    } catch {
      return 0;
    }
  }
  return 0;
}

/**
 * Warm physics-scene JS chunk AND Rapier WASM init.
 * Reporting `physics_wasm` after chunk-only import was premature — Suspense
 * could still show SimplePlayer while loading claimed ready.
 *
 * On failure the cached promise is cleared so a later call can retry
 * (transient network / WASM init errors should not poison the session).
 *
 * Performance marks:
 * - physics:js-start / physics:js-end
 * - physics:wasm-start / physics:wasm-end
 * - physics:total
 */
export function preloadPhysicsChunk(): Promise<void> {
  if (!physicsPreloadPromise) {
    physicsPreloadPromise = (async () => {
      const totalStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
      mark('physics:total-start');

      // Phase 1: JS chunk
      mark('physics:js-start');
      const jsStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
      await import('@/components/3d/PhysicsSceneInner');
      const jsEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
      mark('physics:js-end');
      const jsChunkMs = jsEnd - jsStart;
      measure('physics:js-chunk', 'physics:js-start', 'physics:js-end');

      // INP-CRITICAL: yield to the main thread between the two heaviest
      // blocking phases (JS chunk parse ~2s + WASM compile ~500ms). Without
      // this yield, any user interaction queued during the JS import waits
      // for BOTH the import AND the WASM compile to finish before its handler
      // can run — easily 2.5s+ of INP on its own. A single setTimeout(0)
      // flushes the input/paint queue between phases, halving the worst-case
      // interaction delay. (requestIdleCallback is too slow here — we still
      // want physics to init promptly so the 3D scene can mount.)
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      // Phase 2: WASM init
      mark('physics:wasm-start');
      const wasmStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const rapier = await import('@/engine/physics/rapierCompat');

      // Detect if external wasm file exists at /rapier/ (optional optimization)
      // If external fetch path is used, init will report external mode
      await rapier.init();
      const wasmEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
      mark('physics:wasm-end');
      const wasmInitMs = wasmEnd - wasmStart;
      measure('physics:wasm-init', 'physics:wasm-start', 'physics:wasm-end');

      mark('physics:total-end');
      measure('physics:total', 'physics:total-start', 'physics:total-end');

      const totalMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - totalStart;

      // Heuristic: if wasm init took <300ms, likely external fetch with streaming, if >800ms likely base64 decode
      const mode: WasmMetrics['mode'] = wasmInitMs < 400 ? 'external-fetch' : 'inline-base64';

      lastMetrics = {
        jsChunkMs,
        wasmInitMs,
        totalMs,
        mode,
      };

      if (process.env.NODE_ENV !== 'production') {
        devLog(`[physics] WASM ready in ${totalMs.toFixed(0)}ms (js:${jsChunkMs.toFixed(0)}ms wasm:${wasmInitMs.toFixed(0)}ms) mode:${mode}`);
      }

      // Expose for RuntimeBudgetMonitor
      if (typeof window !== 'undefined') {
        (window as unknown as { __VOLODKA_PHYSICS_METRICS__?: WasmMetrics }).__VOLODKA_PHYSICS_METRICS__ = lastMetrics;
      }
    })().catch((error) => {
      physicsPreloadPromise = null;
      lastMetrics = null;
      // Clean marks on failure so retry can re-mark
      if (typeof performance !== 'undefined' && performance.clearMarks) {
        try {
          performance.clearMarks('physics:js-start');
          performance.clearMarks('physics:wasm-start');
        } catch {}
      }
      throw error;
    });
  }
  return physicsPreloadPromise.then(() => undefined);
}

/** Test helper — drop cached promise between cases. */
export function resetPhysicsPreloadCacheForTests(): void {
  physicsPreloadPromise = null;
  lastMetrics = null;
}

export function getLastPhysicsMetrics(): WasmMetrics | null {
  return lastMetrics;
}
