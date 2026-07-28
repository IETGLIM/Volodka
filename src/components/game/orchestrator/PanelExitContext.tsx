import type { ReactNode } from 'react';
import { PanelExitContext } from './usePanelExitComplete';

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
