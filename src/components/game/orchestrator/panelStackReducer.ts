/* ─── Volodka RPG – panel stack reducer ─── */

import type { NonNullPanelType, PanelType } from './types';

export type { NonNullPanelType } from './types';

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

/** Panels that use MENU z-index base instead of PANEL. */
export const MENU_LAYER_PANELS = new Set<NonNullPanelType>([
  'menu',
  'settings',
  'saveSlot',
  'miniGameHub',
  'shortcuts',
] satisfies readonly NonNullPanelType[]);
