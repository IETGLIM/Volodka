/* ─── Volodka RPG – panel stack reducer ─── */

import type { NonNullPanelType, PanelType } from './types';

export type { NonNullPanelType } from './types';

export type PanelStackAction =
  | { type: 'toggle'; panel: NonNullPanelType }
  | { type: 'ensureOpen'; panel: NonNullPanelType }
  | { type: 'pop' }
  | { type: 'remove'; panel: NonNullPanelType }
  | { type: 'clear' };

/** Gameplay HUD panels — only one open at a time (replace, not stack). */
export const GAMEPLAY_EXCLUSIVE_PANELS = new Set<NonNullPanelType>([
  'quests',
  'inventory',
  'poetry',
]);

function openExclusivePanel(
  stack: NonNullPanelType[],
  panel: NonNullPanelType,
): NonNullPanelType[] {
  const filtered = stack.filter((entry) => !GAMEPLAY_EXCLUSIVE_PANELS.has(entry));
  return [...filtered, panel];
}

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
      if (GAMEPLAY_EXCLUSIVE_PANELS.has(action.panel)) {
        return openExclusivePanel(stack, action.panel);
      }
      return [...stack, action.panel];
    }
    case 'ensureOpen':
      if (stack.includes(action.panel)) return stack;
      if (GAMEPLAY_EXCLUSIVE_PANELS.has(action.panel)) {
        return openExclusivePanel(stack, action.panel);
      }
      return [...stack, action.panel];
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

export function getTopPanel(stack: NonNullPanelType[]): PanelType {
  return stack.length > 0 ? stack[stack.length - 1] : null;
}

/** Panels that use MENU z-index base instead of PANEL. */
export const MENU_LAYER_PANELS = new Set<NonNullPanelType>([
  'menu',
  'settings',
  'saveSlot',
  'miniGameHub',
  'shortcuts',
  'worldMap',
] satisfies readonly NonNullPanelType[]);
