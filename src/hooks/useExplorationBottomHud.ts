import { useMemo } from 'react';
import { useDiegeticNarrativeState } from '@/store/selectors';
import { useExamineOverlayOpen } from '@/hooks/useExamineOverlayOpen';
import { useGameStore } from '@/store/gameStore';

/** Hide bottom-center exploration bars while a full-screen text owner is
 *  active: the diegetic dialogue plate («Голос»), the examine panel, the
 *  story overlay (карточка «Голоса» с выборами 1/2) or a cutscene.
 *  v4.57.0 («Тихий HUD»): осмотр добавлен — панель осмотра владеет низом
 *  экрана, хотбар/поэзия/мобильные контролы молчат, пока она открыта.
 *  v4.58.0 («Ровный экран»): story-карточка с выборами и катсцена тоже
 *  владеют низом — хотбар больше не лежит поверх вариантов выбора
 *  (QA 2026-10-17: «Сразу к…» перекрывался панелью слотов). */
export function useSuppressExplorationBottomHud(): boolean {
  const diegetic = useDiegeticNarrativeState();
  const examineOpen = useExamineOverlayOpen();
  const storyOverlayOpen = useGameStore((s) => s.showStoryOverlay);
  const cutsceneActive = useGameStore((s) => s.activeCutsceneId != null);
  return diegetic != null || examineOpen || storyOverlayOpen || cutsceneActive;
}

/** Memoized style helper for components that need the flag without subscribing twice. */
export function useExplorationBottomHudVisible(): boolean {
  return !useSuppressExplorationBottomHud();
}

export function useExplorationBottomHudVisibilityStyle(): { visibility: 'visible' | 'hidden' } {
  const suppressed = useSuppressExplorationBottomHud();
  return useMemo(
    () => ({ visibility: suppressed ? 'hidden' : 'visible' }),
    [suppressed],
  );
}
