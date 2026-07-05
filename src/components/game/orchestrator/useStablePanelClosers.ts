import { useMemo, useRef } from 'react';
import { PANEL_IDS, type NonNullPanelType } from './types';

export type PanelCloseHandlers = Record<NonNullPanelType, () => void>;

/** Stable per-panel close callbacks — avoids inline lambdas invalidating memoized panel slots. */
export function useStablePanelClosers(
  closePanelByType: (panel: NonNullPanelType) => void,
): PanelCloseHandlers {
  const closeRef = useRef(closePanelByType);
  closeRef.current = closePanelByType;

  return useMemo(() => {
    const handlers = {} as PanelCloseHandlers;
    for (const id of PANEL_IDS) {
      handlers[id] = () => closeRef.current(id);
    }
    return handlers;
  }, []);
}
