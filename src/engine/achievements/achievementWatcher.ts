/* ─── Volodka RPG – Trophy Achievement Watcher ─── */
/* React hook that subscribes to snapshot changes and triggers
 * automatic trophy condition evaluation. Purely reactive — no
 * manual dispatch needed after quests, combat, etc.
 */

import { useEffect, useRef } from 'react';
import { getGameSnapshot, subscribeGameSnapshot } from '@/shared/gameBridge/gameActionBridge';

/**
 * Mount this hook once (e.g. in GamePage) to enable automatic trophy checking.
 * On every snapshot change, it calls checkTrophies on the achievement store.
 */
export function useTrophyAchievementWatcher(): void {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    // Initial check
    void triggerCheck();

    // Subscribe to future changes
    const unsub = subscribeGameSnapshot(() => {
      void triggerCheck();
    });

    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, []);
}

function triggerCheck(): void {
  // Dynamic import to avoid circular dependency at module level.
  // The store is guaranteed to be initialized by the time this runs
  // (only called from useEffect / subscription callbacks).
  import('@/store/stores/achievementStore').then(({ getAchievementStoreState }) => {
    const snapshot = getGameSnapshot();
    getAchievementStoreState().checkTrophies(snapshot);
  }).catch(() => {
    // Silently ignore — store may not be ready during hot reload.
  });
}