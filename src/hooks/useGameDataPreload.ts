import { useEffect, useState } from 'react';
import {
  preloadNarrativeGameData,
  isGameDataLoaded,
} from '@/data/gameDataLoader';
import { preloadPhysicsChunk } from '@/engine/physics/preloadPhysicsChunk';
import { markGameDataReady } from '@/engine/performance/LoadingTimeline';

/** Boot data loads in main.tsx; this hook finishes narrative + physics preload. */
export function useGameDataPreload(): boolean {
  const [ready, setReady] = useState(isGameDataLoaded());

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    void Promise.all([preloadNarrativeGameData(), preloadPhysicsChunk()])
      .then(() => {
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
