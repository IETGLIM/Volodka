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
