import { useEffect } from 'react';
import { runPanelCleanup } from './panelLifecycle';
import type { NonNullPanelType } from './panelStackReducer';

/** Final unmount hook — runs registered panel cleanups once the slot tears down. */
export function usePanelMountCleanup(panelId: NonNullPanelType | undefined, mounted: boolean) {
  useEffect(() => {
    if (!mounted || panelId == null) return;
    return () => {
      runPanelCleanup(panelId);
    };
  }, [mounted, panelId]);
}
