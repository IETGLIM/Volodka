import type { NonNullPanelType } from './panelStackReducer';

/** True when panel id is on the open stack (single source of truth). */
export function isPanelOpen(stack: readonly NonNullPanelType[], panel: NonNullPanelType): boolean {
  return stack.includes(panel);
}

/** Top of stack, or null when empty. */
export function getActivePanel(stack: readonly NonNullPanelType[]): NonNullPanelType | null {
  return stack.length > 0 ? stack[stack.length - 1] : null;
}
