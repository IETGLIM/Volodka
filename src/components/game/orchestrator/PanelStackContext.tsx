/* ─── Volodka RPG – panel stack context ─── */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import {
  MENU_LAYER_PANELS,
  type NonNullPanelType,
} from './panelStackReducer';
import { isPanelOpen as checkPanelOpen } from './panelStackUtils';

export type { NonNullPanelType } from './panelStackReducer';

export interface PanelStackContextValue {
  stack: NonNullPanelType[];
  isPanelOpen: (panel: NonNullPanelType) => boolean;
  isTopPanel: (panel: NonNullPanelType) => boolean;
  getStackIndex: (panel: NonNullPanelType) => number;
  getStackZIndex: (panel: NonNullPanelType) => number;
}

const PanelStackContext = createContext<PanelStackContextValue | null>(null);

/** Per-panel id for z-index / backdrop inside LazyPanelSlot. */
export const PanelIdContext = createContext<NonNullPanelType | null>(null);

export function PanelStackProvider({
  stack,
  children,
}: {
  stack: NonNullPanelType[];
  children: ReactNode;
}) {
  const top = stack.length > 0 ? stack[stack.length - 1] : null;

  const value = useMemo<PanelStackContextValue>(() => ({
    stack,
    isPanelOpen: (panel) => checkPanelOpen(stack, panel),
    isTopPanel: (panel) => top === panel,
    getStackIndex: (panel) => {
      const idx = stack.indexOf(panel);
      return idx === -1 ? 0 : idx;
    },
    getStackZIndex: (panel) => {
      const idx = stack.indexOf(panel);
      if (idx === -1) return UI_LAYERS.PANEL;
      const base = MENU_LAYER_PANELS.has(panel) ? UI_LAYERS.MENU : UI_LAYERS.PANEL;
      return base + idx * 2;
    },
  }), [stack, top]);

  return (
    <PanelStackContext.Provider value={value}>
      {children}
    </PanelStackContext.Provider>
  );
}

export function usePanelStack(): PanelStackContextValue {
  const ctx = useContext(PanelStackContext);
  if (!ctx) {
    return {
      stack: [],
      isPanelOpen: () => false,
      isTopPanel: () => true,
      getStackIndex: () => 0,
      getStackZIndex: () => UI_LAYERS.PANEL,
    };
  }
  return ctx;
}

export function usePanelId(): NonNullPanelType | null {
  return useContext(PanelIdContext);
}

export function PanelStackSlot({
  panelId,
  children,
}: {
  panelId: NonNullPanelType;
  children: ReactNode;
}) {
  const { getStackZIndex, isTopPanel } = usePanelStack();
  const isTop = isTopPanel(panelId);

  return (
    <PanelIdContext.Provider value={panelId}>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: getStackZIndex(panelId),
          pointerEvents: isTop ? 'auto' : 'none',
        }}
      >
        {children}
      </div>
    </PanelIdContext.Provider>
  );
}
