import { useMemo } from 'react';
import { useDiegeticNarrativeState } from '@/store/selectors';
import { useExamineOverlayOpen } from '@/hooks/useExamineOverlayOpen';

/** Hide bottom-center exploration bars while a full-screen text owner is
 *  active: the diegetic dialogue plate («Голос») OR the examine panel.
 *  v4.57.0 («Тихий HUD»): осмотр добавлен — панель осмотра владеет низом
 *  экрана, хотбар/поэзия/мобильные контролы молчат, пока она открыта. */
export function useSuppressExplorationBottomHud(): boolean {
  const diegetic = useDiegeticNarrativeState();
  const examineOpen = useExamineOverlayOpen();
  return diegetic != null || examineOpen;
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
