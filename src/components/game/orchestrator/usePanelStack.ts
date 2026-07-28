import { createContext, useContext } from 'react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import type { NonNullPanelType } from './panelStackReducer';

export type { NonNullPanelType } from './panelStackReducer';

export interface PanelStackContextValue {
  stack: NonNullPanelType[];
  isPanelOpen: (panel: NonNullPanelType) => boolean;
  isTopPanel: (panel: NonNullPanelType) => boolean;
  getStackIndex: (panel: NonNullPanelType) => number;
  getStackZIndex: (panel: NonNullPanelType) => number;
}

export const PanelStackContext = createContext<PanelStackContextValue | null>(null);

/** Per-panel id for z-index / backdrop inside LazyPanelSlot. */
export const PanelIdContext = createContext<NonNullPanelType | null>(null);

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
