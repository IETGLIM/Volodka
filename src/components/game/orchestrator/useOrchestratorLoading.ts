import { useEffect, useState } from 'react';
import { useGameDataPreload } from '@/hooks/useGameDataPreload';
import { markOrchestratorMount } from '@/engine/performance/LoadingTimeline';
import { useCanvasTransitionManager } from './useCanvasTransitionManager';
import type { GamePhase } from '@/shared/gamePhase';

/** Loading, canvas mount, and transition state for the orchestrator. */
export function useOrchestratorLoading(mode: GamePhase, mainMenuOpen: boolean) {
  const gameDataReady = useGameDataPreload();
  const [canvasMounted, setCanvasMounted] = useState(mainMenuOpen);
  const { canvasReady, isTransitioning, fadeOutMs } = useCanvasTransitionManager(mode);

  useEffect(() => {
    markOrchestratorMount();
  }, []);

  useEffect(() => {
    if (mainMenuOpen) setCanvasMounted(true);
  }, [mainMenuOpen]);

  useEffect(() => {
    if (mode === 'cutscene' || mode === 'exploration' || mode === 'combat') {
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
