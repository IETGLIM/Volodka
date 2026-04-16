import { useCallback, useMemo } from 'react';
import type { GamePanelsState } from '@/hooks/useGamePanels';

interface UseGameUiLayoutParams {
  phase: 'loading' | 'intro' | 'menu' | 'game';
  gameMode: 'visual-novel' | 'exploration' | 'dialogue' | 'combat' | 'dream-sequence';
  currentNodeId: string;
  hasCurrentNode: boolean;
  togglePanel: (key: keyof GamePanelsState) => void;
}

export function useGameUiLayout({
  phase,
  gameMode,
  currentNodeId,
  hasCurrentNode,
  togglePanel,
}: UseGameUiLayoutParams) {
  const showStoryPanel = useMemo(() => {
    return phase === 'game'
      && gameMode === 'visual-novel'
      && hasCurrentNode
      && currentNodeId !== 'explore_mode';
  }, [phase, gameMode, hasCurrentNode, currentNodeId]);

  const handleTogglePanel = useCallback((key: string) => {
    togglePanel(key as keyof GamePanelsState);
  }, [togglePanel]);

  return {
    showStoryPanel,
    handleTogglePanel,
  };
}
