import { useEffect, useState } from 'react';
import { preloadGameData, isGameDataLoaded } from '@/data/gameDataLoader';
import { markGameDataReady } from '@/engine/performance/LoadingTimeline';

/** Preloads heavy game-data chunks before gameplay systems touch them. */
export function useGameDataPreload(): boolean {
  const [ready, setReady] = useState(isGameDataLoaded());

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    void preloadGameData()
      .then(() => {
        markGameDataReady();
        if (!cancelled) setReady(true);
      })
      .catch((error) => {
        console.error('[useGameDataPreload] Failed to load game data:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  return ready;
}
