import { useEffect, useState } from 'react';

/**
 * Delay non-critical exploration HUD chrome (weather / day-night / tips)
 * so the first paint prioritizes primary HUD + controls.
 */
export function useDeferredHudChrome(enabled: boolean, delayMs = 750): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return;
    }
    const id = window.setTimeout(() => setReady(true), delayMs);
    return () => window.clearTimeout(id);
  }, [enabled, delayMs]);

  return ready;
}
