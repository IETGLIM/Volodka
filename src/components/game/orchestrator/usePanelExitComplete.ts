import { createContext, useContext } from 'react';

const PanelExitContext = createContext<(() => void) | null>(null);

export { PanelExitContext };

/** Called by PanelWrapper when Framer exit animation completes. */
export function usePanelExitComplete(): (() => void) | null {
  return useContext(PanelExitContext);
}
