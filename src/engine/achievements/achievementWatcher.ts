/* ─── Volodka RPG – Trophy Achievement Watcher ─── */
/* React hook that subscribes to snapshot changes and triggers
 * automatic trophy condition evaluation. Purely reactive — no
 * manual dispatch needed after quests, combat, etc.
 *
 * PERF (v4.40): раньше checkTrophies() запускался на ЛЮБОЕ изменение
 * любого слайса (полный снапшот-подписка без селектора): аллокация Set,
 * перебор трофеев + динамический import() на каждый чих стора, включая
 * серийные мутации (квест = 10+ действий). Трофеи не требуют миллисекундной
 * реакции — коалесцируем микротаском + троттлим до одной проверки в 400 мс.
 */

import { useEffect, useRef } from 'react';
import { getGameSnapshot, subscribeGameSnapshot } from '@/shared/gameBridge/gameActionBridge';

/** Минимальный интервал между фактическими проверками трофеев (мс). */
const TROPHY_CHECK_MIN_INTERVAL_MS = 400;

/**
 * Mount this hook once (e.g. in GamePage) to enable automatic trophy checking.
 * On snapshot changes (coalesced), it calls checkTrophies on the achievement store.
 */
export function useTrophyAchievementWatcher(): void {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    // Initial check
    void triggerCheck();

    // Subscribe to future changes — coalesced + throttled (см. PERF v4.40).
    const unsub = subscribeGameSnapshot(() => {
      scheduleCheck();
    });

    return () => {
      mountedRef.current = false;
      unsub();
      cancelScheduledCheck();
    };
  }, []);
}

let scheduled = false;
let scheduledTimer: ReturnType<typeof setTimeout> | null = null;
let lastCheckMs = 0;

function scheduleCheck(): void {
  if (scheduled) return;
  scheduled = true;
  const elapsed = performance.now() - lastCheckMs;
  const delay = Math.max(0, TROPHY_CHECK_MIN_INTERVAL_MS - elapsed);
  scheduledTimer = setTimeout(() => {
    scheduled = false;
    scheduledTimer = null;
    lastCheckMs = performance.now();
    void triggerCheck();
  }, delay);
}

function cancelScheduledCheck(): void {
  if (scheduledTimer !== null) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
  scheduled = false;
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
