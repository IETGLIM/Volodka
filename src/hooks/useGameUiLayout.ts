import { useCallback, useEffect, useMemo } from 'react';
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
    if (gameMode === 'exploration' || gameMode === 'combat') return true;
    return false;
  }, [phase, gameMode, hasCurrentNode, currentNodeId, storyOverlayEligible]);

  const handleTogglePanel = useCallback((key: string) => {
    togglePanel(key as keyof GamePanelsState);
  }, [togglePanel]);

  /** Горячие клавиши панелей (не перехватываем в полях ввода / в диалоге-катсцене). */
  useEffect(() => {
    if (phase !== 'game') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (
        e.target instanceof Element &&
        e.target.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }
      if (gameMode === 'dialogue' || gameMode === 'cutscene') return;

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === 'i') {
        e.preventDefault();
        togglePanel('inventory');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, gameMode, togglePanel]);

  return {
    showStoryOverlay,
    handleTogglePanel,
  };
}
