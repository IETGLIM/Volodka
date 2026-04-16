import { useCallback, useMemo } from 'react';
import { eventBus } from '@/engine/EventBus';

interface UseGameSessionFlowParams {
  setPhase: (phase: 'loading' | 'intro' | 'menu' | 'game') => void;
  setGameMode: (mode: 'visual-novel' | 'exploration' | 'dialogue' | 'combat' | 'dream-sequence') => void;
  setCurrentNode: (nodeId: string) => void;
  saveGameToStore: () => void;
  loadGameFromStore: () => boolean;
  resetGameStore: () => void;
  showSaveNotif: (message: string) => void;
}

const SAVE_KEY = 'volodka_save_v3';

export function useGameSessionFlow({
  setPhase,
  setGameMode,
  setCurrentNode,
  saveGameToStore,
  loadGameFromStore,
  resetGameStore,
  showSaveNotif,
}: UseGameSessionFlowParams) {
  const hasSavedGame = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(SAVE_KEY);
  }, []);

  const handleLoadingReady = useCallback(() => {
    setPhase('menu');
  }, [setPhase]);

  const handleSaveGame = useCallback(() => {
    saveGameToStore();
    showSaveNotif('Игра сохранена!');
    eventBus.emit('game:saved', { timestamp: Date.now() });
  }, [saveGameToStore, showSaveNotif]);

  const handleStartNewGame = useCallback(() => {
    resetGameStore();
    setGameMode('visual-novel');
    setCurrentNode('start');
    setPhase('intro');
  }, [resetGameStore, setGameMode, setCurrentNode, setPhase]);

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
