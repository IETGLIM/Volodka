import { usePanelStack } from '@/components/game/orchestrator/PanelStackContext';
import { useGamePrimitive } from '@/store/selectors/hooks';
import { useExamineOverlayOpen } from '@/hooks/useExamineOverlayOpen';

/** Hide exploration toasts while gameplay panels are open (inventory, pause, etc.).
 *  FIX (v4.48.6): а также при открытом нарративном оверлее (сюжетная карточка /
 *  диалог) — транзиентные тосты competed with the story card for attention and
 *  частично перекрывались им. Очереди при этом живут: лут/крафт истекают по
 *  своим таймерам в сторе, квест-цепочка восстанавливает карточку после
 *  закрытия нарратива (её state персистит в координаторе).
 *
 *  v4.57.0 («Тихий HUD»): полный режим фокуса — плюс открытая панель осмотра
 *  (ExaminePanel), диегетическая плашка («Голос»/диалог) и активная катсцена.
 *  Раньше тосты/event-попапы висели поверх панели осмотра: один кадр —
 *  осмотр + лор-тост + квест-карточка + каптион атмосферы (скриншоты
 *  жалобы игрока «весь экран в разном тексте»). */
export function useSuppressGameplayToasts(): boolean {
  const { stack } = usePanelStack();
  const narrativeOpen = useGamePrimitive((s) => s.showStoryOverlay);
  const diegeticOpen = useGamePrimitive((s) => s.diegeticNarrative != null);
  const cutsceneActive = useGamePrimitive((s) => s.activeCutsceneId != null);
  const examineOpen = useExamineOverlayOpen();
  return stack.length > 0 || narrativeOpen || diegeticOpen || cutsceneActive || examineOpen;
}
