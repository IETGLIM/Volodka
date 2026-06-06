
/* ─── Volodka RPG – useQuestTracker hook ─── */

import { useEffect } from 'react';
import { questTracker } from '@/engine/QuestTracker';
import { preloadGameData } from '@/data/gameDataLoader';

/**
 * Hook that initializes the QuestTracker engine on mount
 * and tears it down on unmount.
 *
 * Drop this into any component rendered during gameplay
 * (e.g., page.tsx) — it does not render any UI.
 */
export function useQuestTracker() {
  useEffect(() => {
    let cancelled = false;
    void preloadGameData().then(() => {
      if (!cancelled) questTracker.start();
    });
    return () => {
      cancelled = true;
      questTracker.stop();
    };
  }, []);
}
