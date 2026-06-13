import { useEffect, useState } from 'react';
import {
  preloadNarrativeGameData,
  isGameDataLoaded,
} from '@/data/gameDataLoader';
import { preloadPhysicsChunk } from '@/engine/physics/preloadPhysicsChunk';
import { markGameDataReady } from '@/engine/performance/LoadingTimeline';
import { loadingPipeline } from '@/engine/loading/LoadingPipeline';

function preloadCombatUiChunk(): Promise<unknown> {
  return import('@/components/game/CombatUI');
}

/** Boot data loads in main.tsx; this hook finishes narrative + physics preload. */
export function useGameDataPreload(): boolean {
  const [ready, setReady] = useState(isGameDataLoaded());

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    loadingPipeline.reportStage('orchestrator');
    void preloadNarrativeGameData()
      .then(() => {
        loadingPipeline.reportStage('narrative_data');
        return preloadPhysicsChunk();
      })
      .then(() => {
        loadingPipeline.reportStage('physics_wasm');
        return preloadCombatUiChunk();
      })
      .then(() => {
        loadingPipeline.reportStage('combat_ui');
        markGameDataReady();
        if (!cancelled) setReady(true);
      })
      .catch((error) => {
        console.error('[useGameDataPreload] Failed to load narrative data:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  return ready;
}
