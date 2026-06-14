import { useEffect, useState } from 'react';
import { useGameDataPreload } from '@/hooks/useGameDataPreload';
import { usePhysicsPreload } from '@/hooks/usePhysicsPreload';
import { markOrchestratorMount } from '@/engine/performance/LoadingTimeline';
import { useCanvasTransitionManager } from './useCanvasTransitionManager';
import type { GamePhase } from '@/shared/gamePhase';

const CANVAS_PHASES = new Set<GamePhase>(['intro', 'exploration', 'combat', 'cutscene']);

/** Loading, canvas mount, and transition state for the orchestrator. */
export function useOrchestratorLoading(mode: GamePhase) {
  const gameDataReady = useGameDataPreload();
  usePhysicsPreload(mode);
  const [canvasMounted, setCanvasMounted] = useState(false);
  const { canvasReady, isTransitioning, fadeOutMs } = useCanvasTransitionManager(mode);

  useEffect(() => {
    markOrchestratorMount();
  }, []);

  useEffect(() => {
    if (CANVAS_PHASES.has(mode)) {
      setCanvasMounted(true);
    }
  }, [mode]);

  return {
    gameDataReady,
    canvasMounted,
    canvasReady,
    isTransitioning,
    fadeOutMs,
  };
}
