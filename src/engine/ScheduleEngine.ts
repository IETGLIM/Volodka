/* ─── Volodka RPG – NPC schedule system ─── */
/* Provides functions for looking up where NPCs are at any given time,
 * and which NPCs are in a given scene. Delegates schedule data to
 * src/data/npcSchedules.ts and integrates with the exploration state.
 *
 * Supports act-conditional schedule overrides: when story conditions
 * change (act progression, quest completions, flags), NPCs relocate.
 *
 * ScheduleContext is passed in by callers (store, hooks, UI) — this
 * module does NOT import the game store. */

import type { ScheduleEntry, SceneId } from '@/shared/types/game';
import type { ScheduleContext } from '@/shared/scheduleContext';
import { NPC_SCHEDULES_MAP, ACT_SCHEDULE_OVERRIDES } from '@/data/npcSchedules';

/* ─── Override resolution ─── */

/**
 * Resolve the effective schedule entries for an NPC by checking
 * act-conditional overrides first. First matching override wins.
 * Falls back to the base schedule if no override matches.
 */
export function resolveEffectiveSchedule(
  npcId: string,
  ctx: ScheduleContext,
): ScheduleEntry[] {
  const currentAct = ctx.currentAct;
  const completedQuests = ctx.completedQuestIds;
  const activeFlags = ctx.activeFlagKeys;
  const playerFlags = ctx.playerFlags;

  for (const override of ACT_SCHEDULE_OVERRIDES) {
    if (override.npcId !== npcId) continue;
    if (currentAct < override.minAct) continue;

    if (override.requiredCompletedQuests) {
      const allCompleted = override.requiredCompletedQuests.every((qId) =>
        completedQuests.has(qId),
      );
      if (!allCompleted) continue;
    }

    if (override.requiredFlags) {
      const allFlagsSet = override.requiredFlags.every(
        (flag) => activeFlags.has(flag) || playerFlags[flag],
      );
      if (!allFlagsSet) continue;
    }

    return override.entries;
  }

  return NPC_SCHEDULES_MAP[npcId]?.entries ?? [];
}

/* ─── Core lookup functions ─── */

export function getNPCLocationForTime(
  npcId: string,
  hour: number,
  ctx: ScheduleContext,
): ScheduleEntry | null {
  const entries = resolveEffectiveSchedule(npcId, ctx);
  if (!entries.length) return null;

  for (const entry of entries) {
    if (hour >= entry.startHour && hour < entry.endHour) {
      return entry;
    }
  }

  return entries[entries.length - 1] ?? null;
}

export function getNPCsInScene(
  sceneId: SceneId,
  hour: number,
  ctx: ScheduleContext,
): string[] {
  const result: string[] = [];

  for (const npcId of Object.keys(NPC_SCHEDULES_MAP)) {
    const entries = resolveEffectiveSchedule(npcId, ctx);
    for (const entry of entries) {
      if (hour >= entry.startHour && hour < entry.endHour) {
        if (entry.sceneId === sceneId) {
          result.push(npcId);
        }
        break;
      }
    }
  }

  return result;
}

/* ─── Backward-compatible aliases ─── */

/** @deprecated Use getNPCLocationForTime instead */
export function getCurrentScheduleEntry(
  npcId: string,
  hour: number,
  ctx: ScheduleContext,
): ScheduleEntry | null {
  return getNPCLocationForTime(npcId, hour, ctx);
}

/** @deprecated Use getNPCsInScene instead */
export function getNPCsForScene(
  sceneId: SceneId,
  hour: number,
  ctx: ScheduleContext,
): string[] {
  return getNPCsInScene(sceneId, hour, ctx);
}

/* ─── Exploration state integration ─── */

export function buildNPCStatesForTime(
  hour: number,
  ctx: ScheduleContext,
): Record<string, { position: [number, number, number]; sceneId: SceneId }> {
  const result: Record<string, { position: [number, number, number]; sceneId: SceneId }> = {};

  for (const npcId of Object.keys(NPC_SCHEDULES_MAP)) {
    const entry = getNPCLocationForTime(npcId, hour, ctx);
    if (entry) {
      result[npcId] = {
        position: [...entry.position] as [number, number, number],
        sceneId: entry.sceneId,
      };
    }
  }

  return result;
}

export function getNPCSchedule(npcId: string, ctx: ScheduleContext): ScheduleEntry[] {
  return resolveEffectiveSchedule(npcId, ctx);
}

export function isNPCInScene(
  npcId: string,
  sceneId: SceneId,
  hour: number,
  ctx: ScheduleContext,
): boolean {
  const entry = getNPCLocationForTime(npcId, hour, ctx);
  return entry?.sceneId === sceneId;
}

export function getSceneMates(
  npcId: string,
  hour: number,
  ctx: ScheduleContext,
): string[] {
  const entry = getNPCLocationForTime(npcId, hour, ctx);
  if (!entry) return [];

  const npcsInScene = getNPCsInScene(entry.sceneId, hour, ctx);
  return npcsInScene.filter((id) => id !== npcId);
}
