import { usePanelId, usePanelStack } from '@/components/game/orchestrator/PanelStackContext';

/** True when a modal game panel stack has at least one open panel. */
export function useGamePanelStackOpen(): boolean {
  const { stack } = usePanelStack();
  return stack.length > 0;
}

/**
 * True when this overlay should trap Tab focus (top of stack, or outside stack context).
 * Buried panels in the stack stay mounted for exit animation but must not trap.
 */
export function usePanelFocusTrapActive(explicitActive = true): boolean {
  const panelId = usePanelId();
  const { isTopPanel } = usePanelStack();
  if (!explicitActive) return false;
  if (panelId == null) return true;
  return isTopPanel(panelId);
}
