import { useCallback, useMemo } from 'react';
import type { GamePanelsState } from '@/hooks/useGamePanels';
import type { GameMode } from '@/data/rpgTypes';

interface UseGameUiLayoutParams {
  phase: 'loading' | 'intro' | 'menu' | 'game';
  gameMode: GameMode;
  currentNodeId: string;
  hasCurrentNode: boolean;
  /** У текущего узла есть текст/выборы/мини-игра — показывать оверлей и в 3D. */
  storyOverlayEligible: boolean;
  togglePanel: (key: keyof GamePanelsState) => void;
}

export function useGameUiLayout({
  phase,
  gameMode,
  currentNodeId,
  hasCurrentNode,
  storyOverlayEligible,
  togglePanel,
}: UseGameUiLayoutParams) {
  /** Показать нижний оверлей сюжета (`StoryRenderer`), не путать с удалённым `StoryPanel`. */
  const showStoryOverlay = useMemo(() => {
    if (phase !== 'game' || !hasCurrentNode || currentNodeId === 'explore_mode') return false;
    if (!storyOverlayEligible) return false;
    if (gameMode === 'dialogue' || gameMode === 'cutscene') return false;
    if (gameMode === 'visual-novel') return true;
    if (gameMode === 'exploration') return true;
    return false;
  }, [phase, gameMode, hasCurrentNode, currentNodeId, storyOverlayEligible]);

  const handleTogglePanel = useCallback((key: string) => {
    togglePanel(key as keyof GamePanelsState);
  }, [togglePanel]);

  return {
    showStoryOverlay,
    handleTogglePanel,
  };
}
