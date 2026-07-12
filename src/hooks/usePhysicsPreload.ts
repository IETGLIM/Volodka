import { useEffect, useRef } from 'react';
import { preloadPhysicsChunk } from '@/engine/physics/preloadPhysicsChunk';
import { loadingPipeline } from '@/engine/loading/LoadingPipeline';
import type { GamePhase } from '@/shared/gamePhase';

const PHYSICS_PHASES = new Set<GamePhase>(['intro', 'exploration', 'combat', 'cutscene']);

/** Warm Rapier WASM when entering 3D gameplay — skipped on menu boot to save ~900KB gzip. */
export function usePhysicsPreload(mode: GamePhase): void {
  const startedRef = useRef(false);

  useEffect(() => {
    if (!PHYSICS_PHASES.has(mode)) return;
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    void preloadPhysicsChunk()
      .then(() => {
        if (cancelled) return;
        loadingPipeline.reportStage('physics_wasm');
      })
      .catch((error) => {
        console.error('[usePhysicsPreload] Failed to load physics:', error);
        loadingPipeline.reportError(error);
      });

    return () => {
      cancelled = true;
    };
  }, [mode]);
}
