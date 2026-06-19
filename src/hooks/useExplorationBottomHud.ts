import { useMemo } from 'react';
import { useDiegeticNarrativeState } from '@/store/selectors';

/** Hide bottom-center exploration bars while diegetic dialogue owns the lower screen. */
export function useSuppressExplorationBottomHud(): boolean {
  const diegetic = useDiegeticNarrativeState();
  return diegetic != null;
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
