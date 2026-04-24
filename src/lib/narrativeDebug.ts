/**
 * Команды отладки нарратива (статы, флаги, квесты). Работают только если включён dev или `NEXT_PUBLIC_GAME_DEBUG_PANEL=1`.
 */
import { QUEST_DEFINITIONS } from '@/data/quests';
import { MAX_PLAYER_ENERGY } from '@/lib/energyConfig';
import { useGameStore } from '@/state/gameStore';

export function isNarrativeDebugEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_GAME_DEBUG_PANEL === '1'
  );
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export type NarrativeDebugCoreStat =
  | 'mood'
  | 'creativity'
  | 'stability'
  | 'energy'
  | 'karma'
  | 'selfEsteem'
  | 'stress';

export function narrativeDebugSetCoreStat(stat: NarrativeDebugCoreStat, value: number): void {
  if (!isNarrativeDebugEnabled()) return;
  const max = stat === 'energy' ? MAX_PLAYER_ENERGY : 100;
  useGameStore.setState((s) => ({
    playerState: {
      ...s.playerState,
      [stat]: clamp(Math.round(value), 0, max),
    },
  }));
}

export function narrativeDebugSetPanic(on: boolean): void {
  if (!isNarrativeDebugEnabled()) return;
  useGameStore.setState((s) => ({
    playerState: {
      ...s.playerState,
      panicMode: on,
      ...(on ? { stress: Math.max(s.playerState.stress, 100) } : {}),
    },
  }));
}

export function narrativeDebugSetFlag(flag: string, on: boolean): void {
  if (!isNarrativeDebugEnabled()) return;
  if (on) useGameStore.getState().setFlag(flag);
  else useGameStore.getState().unsetFlag(flag);
}

/** Убрать квест из активных / завершённых и очистить прогресс (для «сброса» сцены). */
export function narrativeDebugClearQuest(questId: string): void {
  if (!isNarrativeDebugEnabled()) return;
  useGameStore.setState((s) => {
    const { [questId]: _removed, ...restProgress } = s.questProgress;
    return {
      activeQuestIds: s.activeQuestIds.filter((id) => id !== questId),
      completedQuestIds: s.completedQuestIds.filter((id) => id !== questId),
      questProgress: restProgress,
    };
  });
}

export function narrativeDebugActivateQuest(questId: string): void {
  if (!isNarrativeDebugEnabled()) return;
  if (!QUEST_DEFINITIONS[questId]) return;
  narrativeDebugClearQuest(questId);
  useGameStore.getState().activateQuest(questId);
}

export function narrativeDebugCompleteActiveQuest(questId: string): void {
  if (!isNarrativeDebugEnabled()) return;
  const st = useGameStore.getState();
  if (!st.activeQuestIds.includes(questId)) return;
  st.completeQuest(questId);
}

export function narrativeDebugSetObjectiveValue(
  questId: string,
  objectiveId: string,
  value: number,
): void {
  if (!isNarrativeDebugEnabled()) return;
  useGameStore.getState().updateQuestObjective(questId, objectiveId, Math.max(0, Math.round(value)));
}

export function narrativeDebugListQuestIds(): string[] {
  return Object.keys(QUEST_DEFINITIONS).sort();
}
