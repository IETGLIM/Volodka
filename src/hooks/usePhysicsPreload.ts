import { useEffect, useRef } from 'react';
import { preloadPhysicsChunk } from '@/engine/physics/preloadPhysicsChunk';
import { loadingPipeline } from '@/engine/loading/LoadingPipeline';
import type { GamePhase } from '@/shared/gamePhase';

const PHYSICS_PHASES = new Set<GamePhase>(['intro', 'exploration', 'combat', 'cutscene']);
const RETRY_MS = 1_500;

/**
 * Warm Rapier WASM when entering 3D gameplay — skipped on menu boot to save ~900KB gzip.
 *
 * INP-CRITICAL: preload is deferred to the next idle callback (or a 0ms
 * setTimeout fallback) so the first paint of the intro/menu is NOT blocked by
 * the ~2s PhysicsSceneInner JS chunk import + ~500ms WASM compile. Previously
 * preload ran synchronously inside the effect, which blocked the main thread
 * and made interactions (e.g. clicking "Пропустить вступление") wait 2-4s
 * before the click handler could run — driving INP to ~12s on slow devices.
 */
export function usePhysicsPreload(mode: GamePhase): void {
  const successRef = useRef(false);

  useEffect(() => {
    if (!PHYSICS_PHASES.has(mode)) return;
    if (successRef.current) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let idleHandle: number | null = null;
    let idleFallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const attempt = (): void => {
      void preloadPhysicsChunk()
        .then(() => {
          if (cancelled) return;
          successRef.current = true;
          loadingPipeline.reportStage('physics_wasm');
        })
        .catch((error) => {
          console.error('[usePhysicsPreload] Failed to load physics:', error);
          if (cancelled) return;
          loadingPipeline.reportError(error);
          // Transient WASM/chunk failures should retry — do not permanently poison the session.
          retryTimer = setTimeout(attempt, RETRY_MS);
        });
    };

    // Defer the actual preload until the browser is idle. This lets React
    // finish painting the intro/menu first, so the user sees something
    // immediately and can interact without waiting for Rapier WASM (2-3s).
    const schedulePreload = (): void => {
      if (cancelled) return;
      // requestIdleCallback: browser picks a free slot (after paint, between
      // input handling). Timeout 2000ms ensures we don't wait forever on a
      // busy main thread — physics must still init before 3D scene entry.
      if (typeof (window as unknown as { requestIdleCallback?: unknown }).requestIdleCallback === 'function') {
        idleHandle = (window as unknown as {
          requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
        }).requestIdleCallback(attempt, { timeout: 2000 });
      } else {
        // Safari/Firefox fallback: setTimeout(0) yields to the current task
        // queue, letting paint/input run before the heavy preload starts.
        idleFallbackTimer = setTimeout(attempt, 0);
      }
    };

    schedulePreload();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (idleFallbackTimer) clearTimeout(idleFallbackTimer);
      if (idleHandle !== null && typeof (window as unknown as { cancelIdleCallback?: unknown }).cancelIdleCallback === 'function') {
        (window as unknown as { cancelIdleCallback: (h: number) => void }).cancelIdleCallback(idleHandle);
      }
    };
  }, [mode]);
}
