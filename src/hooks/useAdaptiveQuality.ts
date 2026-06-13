import { useEffect, useRef } from 'react';
import { subscribeRuntimeBudgetViolations } from '@/engine/performance/runtimeBudgetEvents';
import { applyVisualSettings } from '@/engine/visualSettings';

/**
 * Auto-degrade visual settings when FPS budget is violated repeatedly.
 */
export function useAdaptiveQuality(enabled: boolean): void {
  const strikesRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    return subscribeRuntimeBudgetViolations((violations) => {
      const fpsFail = violations.some((v) => v.id === 'fps' && v.severity === 'fail');
      if (!fpsFail) {
        strikesRef.current = Math.max(0, strikesRef.current - 1);
        return;
      }
      strikesRef.current += 1;
      if (strikesRef.current < 3) return;

      try {
        localStorage.setItem('volodka_postfx', 'false');
        localStorage.setItem('volodka_particles', 'false');
        applyVisualSettings();
        strikesRef.current = 0;
      } catch {
        /* ignore storage errors */
      }
    });
  }, [enabled]);
}
