import { useCallback, useEffect, useMemo } from 'react';
import type { GamePanelsState } from '@/hooks/useGamePanels';
import type { GameMode } from '@/data/rpgTypes';
import type { StoryNode } from '@/data/types';
import type { AppPhase } from '@/state/appStore';
import { useGamePhaseStore } from '@/state/gamePhaseStore';
import { storyNodeShowsStoryOverlay } from '@/lib/storyOverlayEligibility';

interface UseGameUiLayoutParams {
  phase: AppPhase;
  gameMode: GameMode;
  hasCurrentNode: boolean;
  /** Текущий узел `STORY_NODES` — единственный источник правды для оверлея поверх 3D (см. ADR `docs/ADR-single-exploration-narrative-layer.md`). */
  currentNode: StoryNode | undefined;
  togglePanel: (key: keyof GamePanelsState) => void;
}

export function useGameUiLayout({
  phase,
  gameMode,
  hasCurrentNode,
  currentNode,
  togglePanel,
}: UseGameUiLayoutParams) {
  /** Фаза 3D-ввода (`IntroCutsceneOverlays` / подписи) — не смешивать с нижним `StoryRenderer` (иначе z-index и полупрозрачность дают «двойной» текст). */
  const explorationPhase = useGamePhaseStore((s) => s.phase);

  const storyOverlayEligible = useMemo(
    () => storyNodeShowsStoryOverlay(currentNode),
    [currentNode],
  );

  /** Показать нижний оверлей сюжета (`StoryRenderer`) поверх живого exploration — тот же граф узлов, без отдельного «VN-слоя». */
  const showStoryOverlay = useMemo(() => {
    if (phase !== 'game' || !hasCurrentNode) return false;
    if (!storyOverlayEligible) return false;
    if (gameMode === 'dialogue' || gameMode === 'cutscene') return false;
    if (gameMode === 'exploration' && explorationPhase === 'intro_cutscene') return false;
    if (gameMode === 'exploration' || gameMode === 'combat') return true;
    return false;
  }, [phase, gameMode, hasCurrentNode, storyOverlayEligible, explorationPhase]);

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
