import { useCallback, useEffect, useRef, useState } from 'react';
import { PANEL_UNMOUNT_GRACE_MS } from '@/shared/constants/transitionTimings';

/**
 * Keeps a lazy panel subtree mounted while `open` is false so inner AnimatePresence
 * can finish exit before unmount (avoids skipping animation + leaking rAF/timers).
 */
export function usePanelKeepAlive(open: boolean, graceMs = PANEL_UNMOUNT_GRACE_MS) {
  const [mounted, setMounted] = useState(open);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const finishExit = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
      setMounted(true);
      return;
    }
    if (!mounted) return;
    timerRef.current = setTimeout(finishExit, graceMs);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [open, mounted, graceMs, finishExit]);

  return { mounted, finishExit };
}
