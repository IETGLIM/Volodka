/* ─── Schedule sync — store emits, engine rebuilds NPC states ─── */
/* explorationSlice must not import ScheduleEngine; it emits schedule:sync_npcs
 * and this controller writes npcStates back via GameActionDispatcher. */

import { eventBus } from '@/engine/EventBus';
import { buildNPCStatesForTime } from '@/engine/ScheduleEngine';
import {
  dispatchGameAction,
  getGameSnapshot,
} from '@/engine/GameActionDispatcher';
import { buildScheduleContext } from '@/shared/scheduleContext';
import type { SceneId } from '@/shared/types/game';

export type NpcStateRecord = Record<
  string,
  { position: [number, number, number]; sceneId: SceneId }
>;

/** Pure rebuild used by the bus listener and unit tests. */
export function rebuildNpcStatesForHour(
  hour: number,
  source: Parameters<typeof buildScheduleContext>[0],
): NpcStateRecord {
  return buildNPCStatesForTime(hour, buildScheduleContext(source));
}

let unsub: (() => void) | null = null;

/**
 * Bind EventBus listener: schedule:sync_npcs → ScheduleEngine → store + world:hour_changed.
 * Idempotent. Call from reviveGameEngine (and tests).
 */
export function bindScheduleSyncController(): void {
  if (unsub) return;

  unsub = eventBus.on('schedule:sync_npcs', ({ hour, previousHour }) => {
    let snapshot;
    try {
      snapshot = getGameSnapshot();
    } catch {
      return;
    }

    const npcStates = rebuildNpcStatesForHour(hour, {
      playerState: snapshot.playerState,
      quests: snapshot.quests,
      activeTTLFlags: snapshot.activeTTLFlags,
    });

    dispatchGameAction({ type: 'exploration/setNpcStates', npcStates });
    eventBus.emit('world:hour_changed', { hour, previousHour, npcStates });
  });
}

export function unbindScheduleSyncController(): void {
  unsub?.();
  unsub = null;
}
