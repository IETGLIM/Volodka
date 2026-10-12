import { usePanelStack } from '@/components/game/orchestrator/PanelStackContext';
import { useGamePrimitive } from '@/store/selectors/hooks';

/** Hide exploration toasts while gameplay panels are open (inventory, pause, etc.).
 *  FIX (v4.48.6): а также при открытом нарративном оверлее (сюжетная карточка /
 *  диалог) — транзиентные тосты competed with the story card for attention and
 *  частично перекрывались им. Очереди при этом живут: лут/крафт истекают по
 *  своим таймерам в сторе, квест-цепочка восстанавливает карточку после
 *  закрытия нарратива (её state персистит в координаторе). */
export function useSuppressGameplayToasts(): boolean {
  const { stack } = usePanelStack();
  const narrativeOpen = useGamePrimitive((s) => s.showStoryOverlay);
  return stack.length > 0 || narrativeOpen;
}
