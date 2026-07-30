import { useEffect, useRef } from 'react';
import { preloadPhysicsChunk } from '@/engine/physics/preloadPhysicsChunk';
import { loadingPipeline } from '@/engine/loading/LoadingPipeline';
import type { GamePhase } from '@/shared/gamePhase';

const PHYSICS_PHASES = new Set<GamePhase>(['intro', 'exploration', 'combat', 'cutscene']);
const RETRY_MS = 1_500;

/** Warm Rapier WASM when entering 3D gameplay — skipped on menu boot to save ~900KB gzip. */
export function usePhysicsPreload(mode: GamePhase): void {
  const successRef = useRef(false);

  useEffect(() => {
    if (!PHYSICS_PHASES.has(mode)) return;
    if (successRef.current) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

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

    attempt();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [mode]);
}
