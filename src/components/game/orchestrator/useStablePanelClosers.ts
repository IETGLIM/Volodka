import { useMemo, useRef } from 'react';
import type { NonNullPanelType } from './panelStackReducer';

const ALL_PANEL_IDS: NonNullPanelType[] = [
  'quests',
  'inventory',
  'poetry',
  'menu',
  'rest',
  'shortcuts',
  'settings',
  'saveSlot',
  'miniGameHub',
  'npcRelation',
  'characterProfile',
  'codex',
  'dialogueHistory',
  'achievements',
  'skillTree',
  'crafting',
  'trading',
  'fastTravel',
  'perks',
  'questBoard',
  'stats',
  'karmaPoem',
  'journal',
];

export type PanelCloseHandlers = Record<NonNullPanelType, () => void>;

/** Stable per-panel close callbacks — avoids inline lambdas invalidating memoized panel slots. */
export function useStablePanelClosers(
  closePanelByType: (panel: NonNullPanelType) => void,
): PanelCloseHandlers {
  const closeRef = useRef(closePanelByType);
  closeRef.current = closePanelByType;

  return useMemo(() => {
    const handlers = {} as PanelCloseHandlers;
    for (const id of ALL_PANEL_IDS) {
      handlers[id] = () => closeRef.current(id);
    }
    return handlers;
  }, []);
}
