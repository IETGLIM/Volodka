import { useEffect, useState } from 'react';
import {
  preloadNarrativeGameData,
  isGameDataLoaded,
  isQuestsGameDataLoaded,
} from '@/data/gameDataLoader';
import { markGameDataReady } from '@/engine/performance/LoadingTimeline';

/** Re-render when quest definitions become available (staged narrative preload). */
export function useQuestsGameDataReady(): boolean {
  const [ready, setReady] = useState(isQuestsGameDataLoaded());

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    void preloadNarrativeGameData()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((error) => {
        console.error('[useQuestsGameDataReady] Failed to load quest data:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  return ready;
}

/** Boot data loads in main.tsx; this hook finishes narrative preload for gameplay. */
export function useGameDataPreload(): boolean {
  const [ready, setReady] = useState(isGameDataLoaded());

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    void preloadNarrativeGameData()
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
