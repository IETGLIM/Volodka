import { useCallback, useMemo } from 'react';
import type { GameMode } from '@/data/rpgTypes';
import type { SaveGameOptions } from '@/store/gameStore';

interface UseGameSessionFlowParams {
  setPhase: (phase: 'loading' | 'intro' | 'menu' | 'game') => void;
  /** Оставлены для совместимости с `useActionHandler`; сброс режима/узла делает `resetGameStore`. */
  setGameMode?: (mode: GameMode) => void;
  setCurrentNode?: (nodeId: string) => void;
  saveGameToStore: (options?: SaveGameOptions) => void;
  loadGameFromStore: () => boolean;
  resetGameStore: () => void;
}

const SAVE_KEY = 'volodka_save_v3';

export function useGameSessionFlow({
  setPhase,
  saveGameToStore,
  loadGameFromStore,
  resetGameStore,
}: UseGameSessionFlowParams) {
  const hasSavedGame = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(SAVE_KEY);
  }, []);

  const handleLoadingReady = useCallback(() => {
    setPhase('menu');
  }, [setPhase]);

  const handleSaveGame = useCallback(() => {
    saveGameToStore({ source: 'manual' });
  }, [saveGameToStore]);

  const handleStartNewGame = useCallback(() => {
    resetGameStore();
    setPhase('intro');
  }, [resetGameStore, setPhase]);

  const handleLoadGame = useCallback(() => {
    if (loadGameFromStore()) setPhase('game');
  }, [loadGameFromStore, setPhase]);

  const handleIntroComplete = useCallback(() => {
    setPhase('game');
  }, [setPhase]);

  return {
    hasSavedGame,
    handleLoadingReady,
    handleSaveGame,
    handleStartNewGame,
    handleLoadGame,
    handleIntroComplete,
  };
}
