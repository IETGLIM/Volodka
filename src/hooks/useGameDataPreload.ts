import { useEffect, useState } from 'react';
import {
  preloadNarrativeGameData,
  isGameDataLoaded,
} from '@/data/gameDataLoader';
import { markGameDataReady } from '@/engine/performance/LoadingTimeline';
import { loadingPipeline } from '@/engine/loading/LoadingPipeline';

function preloadCombatUiChunk(): Promise<unknown> {
  return import('@/components/game/CombatUI');
}

/** Boot data loads in main.tsx; narrative + combat UI. Rapier deferred to usePhysicsPreload. */
export function useGameDataPreload(): boolean {
  const [ready, setReady] = useState(isGameDataLoaded());

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    loadingPipeline.reportStage('orchestrator');
    void preloadNarrativeGameData()
      .then(() => {
        loadingPipeline.reportStage('narrative_data');
        return preloadCombatUiChunk();
      })
      .then(() => {
        loadingPipeline.reportStage('combat_ui');
        markGameDataReady();
        if (!cancelled) setReady(true);
      })
      .catch((error) => {
        console.error('[useGameDataPreload] Failed to load narrative data:', error);
        loadingPipeline.reportError(error);
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  return ready;
}
