import { usePanelStack } from '@/components/game/orchestrator/PanelStackContext';

/** Hide exploration toasts while gameplay panels are open (inventory, pause, etc.). */
export function useSuppressGameplayToasts(): boolean {
  const { stack } = usePanelStack();
  return stack.length > 0;
}
