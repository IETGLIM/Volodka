/* ─── Volodka RPG – panel stack reducer ─── */

import type { PanelType } from './types';

export type NonNullPanelType = Exclude<PanelType, null>;

export type PanelStackAction =
  | { type: 'toggle'; panel: NonNullPanelType }
  | { type: 'pop' }
  | { type: 'remove'; panel: NonNullPanelType }
  | { type: 'clear' };

export function panelStackReducer(
  stack: NonNullPanelType[],
  action: PanelStackAction,
): NonNullPanelType[] {
  switch (action.type) {
    case 'clear':
      return [];
    case 'pop':
      return stack.slice(0, -1);
    case 'remove': {
      const idx = stack.indexOf(action.panel);
      if (idx === -1) return stack;
      return [...stack.slice(0, idx), ...stack.slice(idx + 1)];
    }
    case 'toggle': {
      const idx = stack.indexOf(action.panel);
      if (idx !== -1) {
        return [...stack.slice(0, idx), ...stack.slice(idx + 1)];
      }
      return [...stack, action.panel];
    }
    default:
      return stack;
  }
}

export function getTopPanel(stack: NonNullPanelType[]): PanelType {
  return stack.length > 0 ? stack[stack.length - 1] : null;
}

export function derivePanelFlags(stack: NonNullPanelType[]) {
  const set = new Set(stack);
  return {
    questsOpen: set.has('quests'),
    inventoryOpen: set.has('inventory'),
    poetryOpen: set.has('poetry'),
    menuOpen: set.has('menu'),
    restOpen: set.has('rest'),
    shortcutsOpen: set.has('shortcuts'),
    settingsOpen: set.has('settings'),
    saveSlotOpen: set.has('saveSlot'),
    miniGameHubOpen: set.has('miniGameHub'),
    npcRelationOpen: set.has('npcRelation'),
    characterProfileOpen: set.has('characterProfile'),
    codexOpen: set.has('codex'),
    dialogueHistoryOpen: set.has('dialogueHistory'),
    achievementsOpen: set.has('achievements'),
    skillTreeOpen: set.has('skillTree'),
    craftingOpen: set.has('crafting'),
    tradingOpen: set.has('trading'),
    fastTravelOpen: set.has('fastTravel'),
    perksOpen: set.has('perks'),
    questBoardOpen: set.has('questBoard'),
    statsOpen: set.has('stats'),
    karmaPoemOpen: set.has('karmaPoem'),
  };
}

/** Panels that use MENU z-index base instead of PANEL. */
export const MENU_LAYER_PANELS = new Set<NonNullPanelType>([
  'menu',
  'settings',
  'saveSlot',
  'miniGameHub',
  'shortcuts',
]);
