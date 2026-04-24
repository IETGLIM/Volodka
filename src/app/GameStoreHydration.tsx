'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/state/gameStore';

const PERF_MARK_START = 'gs:hydrate:start';
const PERF_MEASURE = 'gs:hydrate';

/** Один проход эффекта даже при remount в StrictMode (React 18). */
let hydrationEffectCommitted = false;

/**
 * Восстанавливает сохранённое состояние из localStorage после гидратации React-дерева.
 * Обработка ошибок, метрики производительности и однократный вызов гидратации стора.
 */
export function GameStoreHydration() {
  useEffect(() => {
    if (hydrationEffectCommitted) return;
    hydrationEffectCommitted = true;

    if (typeof performance !== 'undefined' && performance.mark) {
      try {
        performance.mark(PERF_MARK_START);
      } catch {
        /* ignore */
      }
    }

    try {
      const success = useGameStore.getState().hydrateFromLocalStorage();
      if (!success) {
        console.info(
          '[GameStoreHydration] Snapshot not merged (no save, invalid data, or already hydrated).',
        );
      }
    } catch (error) {
      console.error('[GameStoreHydration] Critical hydration error:', error);
    } finally {
      if (typeof performance !== 'undefined' && performance.measure) {
        try {
          performance.measure(PERF_MEASURE, PERF_MARK_START);
        } catch {
          /* нет mark или повтор measure */
        }
      }
    }
  }, []);

  return null;
}
