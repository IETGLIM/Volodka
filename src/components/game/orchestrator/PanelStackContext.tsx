import { useMemo, type ReactNode } from 'react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import {
  MENU_LAYER_PANELS,
  type NonNullPanelType,
} from './panelStackReducer';
import {
  PanelStackContext,
  PanelIdContext,
  usePanelStack,
  type PanelStackContextValue,
} from './usePanelStack';

function buildStackIndexMap(stack: readonly NonNullPanelType[]): Map<NonNullPanelType, number> {
  const indexByPanel = new Map<NonNullPanelType, number>();
  for (let i = 0; i < stack.length; i++) {
    indexByPanel.set(stack[i], i);
  }
  return indexByPanel;
}

export function PanelStackProvider({
  stack,
  children,
}: {
  stack: NonNullPanelType[];
  children: ReactNode;
}) {
  const top = stack.length > 0 ? stack[stack.length - 1] : null;

  const value = useMemo<PanelStackContextValue>(() => {
    const stackIndexByPanel = buildStackIndexMap(stack);

    return {
      stack,
      isPanelOpen: (panel) => stackIndexByPanel.has(panel),
      isTopPanel: (panel) => top === panel,
      getStackIndex: (panel) => stackIndexByPanel.get(panel) ?? 0,
      getStackZIndex: (panel) => {
        const idx = stackIndexByPanel.get(panel);
        if (idx === undefined) return UI_LAYERS.PANEL;
        const base = MENU_LAYER_PANELS.has(panel) ? UI_LAYERS.MENU : UI_LAYERS.PANEL;
        return base + idx * 2;
      },
    };
  }, [stack, top]);

  return (
    <PanelStackContext.Provider value={value}>
      {children}
    </PanelStackContext.Provider>
  );
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
