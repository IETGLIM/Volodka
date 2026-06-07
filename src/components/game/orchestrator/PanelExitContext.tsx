import { createContext, useContext, type ReactNode } from 'react';

const PanelExitContext = createContext<(() => void) | null>(null);

export function PanelExitProvider({
  onExitComplete,
  children,
}: {
  onExitComplete: () => void;
  children: ReactNode;
}) {
  return (
    <PanelExitContext.Provider value={onExitComplete}>
      {children}
    </PanelExitContext.Provider>
  );
}

/** Called by PanelWrapper when Framer exit animation completes. */
export function usePanelExitComplete(): (() => void) | null {
  return useContext(PanelExitContext);
}
