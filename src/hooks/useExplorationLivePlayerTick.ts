'use client';

import { useEffect, useState } from 'react';

/**
 * Шаг 2 (стабилизация): после отключения частого `setPlayerPosition` позиция в сторе в обходе отстаёт;
 * UI, которому нужны актуальные XZ, опрашивает **`explorationLivePlayerBridge`** по таймеру.
 */
/** Возвращает счётчик тика — включите в deps `useMemo`, если читаете мост внутри мемо. */
export function useExplorationLivePlayerTick(enabled: boolean, intervalMs = 110): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      setTick((n) => n + 1);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs]);
  return tick;
}
