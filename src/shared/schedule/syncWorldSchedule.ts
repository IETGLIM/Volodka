/* ─── Shared world-hour schedule rebuild ───
 * Single builder for NPC schedule states + hour-changed payload.
 * Callers choose emit timing:
 *  - useWorldClock → immediate eventBus.emit('world:hour_changed')
 *  - explorationSlice → scheduleWorldHourChanged (after Zustand commit)
 */

import { buildNPCStatesForTime } from '@/shared/schedule/ScheduleEngine';
import type { ScheduleContext } from '@/shared/scheduleContext';
import type { SceneId } from '@/shared/types/game';

export type ScheduleNpcStateMap = Record<
  string,
  { position: [number, number, number]; sceneId: SceneId }
>;

export interface WorldHourChangedPayload {
  hour: number;
  previousHour: number;
  npcStates: ScheduleNpcStateMap;
}

/** Rebuild NPC schedule states for `hour` and package the EventBus payload. */
export function buildWorldHourChangedPayload(
  hour: number,
  previousHour: number,
  scheduleCtx: ScheduleContext,
): WorldHourChangedPayload {
  const npcStates = buildNPCStatesForTime(hour, scheduleCtx) as ScheduleNpcStateMap;
  return { hour, previousHour, npcStates };
}

/**
 * perf (v4.24, этап 101): value-сравнение карт NPC-расписания.
 * Большинство тиков мировых часов (каждые 60 с реального времени) попадают
 * в тот же слот расписания, что и предыдущий: позиции дискретны
 * (анкеры сцен), поэтому построенная карта равна текущей ПО ЗНАЧЕНИЮ,
 * но новая ПО ИДЕНТИЧНОСТИ. Запись такой карты в стор сбрасывает
 * ссылки и перерисовывает всех подписчиков npcStates без причины.
 * Возвращает true, когда карты совпадают (запись в стор можно пропустить).
 */
export function areNpcScheduleStatesEqual(
  a: ScheduleNpcStateMap,
  b: ScheduleNpcStateMap,
): boolean {
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  for (const id of aKeys) {
    const stateA = a[id];
    const stateB = b[id];
    if (!stateB) return false;
    if (stateA.sceneId !== stateB.sceneId) return false;
    const posA = stateA.position;
    const posB = stateB.position;
    if (
      posA[0] !== posB[0] ||
      posA[1] !== posB[1] ||
      posA[2] !== posB[2]
    ) {
      return false;
    }
  }
  return true;
}
