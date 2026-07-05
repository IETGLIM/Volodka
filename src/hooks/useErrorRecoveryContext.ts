/* ─── Volodka RPG – live recovery context for error boundary wrapper ─── */

import { useMemo } from 'react';
import { useGamePhase } from '@/store/selectors';
import { useGameStore } from '@/store/gameStore';
import { buildErrorRecoveryContext } from '@/engine/recovery/buildErrorRecoveryContext';
import type { ErrorRecoveryContext } from '@/engine/recovery/errorRecoveryTypes';

/** Snapshot of game state for error diagnostics — safe when store is healthy. */
export function useErrorRecoveryContext(): ErrorRecoveryContext {
  const gameMode = useGamePhase();
  const sceneId = useGameStore((state) => state.exploration.currentSceneId);
  const playerLevel = useGameStore((state) => state.playerState.progression.level);

  return useMemo(
    () => ({
      ...buildErrorRecoveryContext(),
      sceneId,
      gameMode,
      playerLevel,
    }),
    [gameMode, playerLevel, sceneId],
  );
}
