/* ─── Volodka RPG – NPC schedule system ─── */
/* Provides functions for looking up where NPCs are at any given time,
 * and which NPCs are in a given scene. Delegates schedule data to
 * src/data/npcSchedules.ts and integrates with the exploration state.
 *
 * Supports act-conditional schedule overrides: when story conditions
 * change (act progression, quest completions, flags), NPCs relocate. */

import type { ScheduleEntry, SceneId } from '@/shared/types/game';
import { NPC_SCHEDULES_MAP, ACT_SCHEDULE_OVERRIDES } from '@/data/npcSchedules';
import { getGameStore } from '@/store/gameStore';

/* ─── Override resolution ─── */

/**
 * Resolve the effective schedule entries for an NPC by checking
 * act-conditional overrides first. First matching override wins.
 * Falls back to the base schedule if no override matches.
 */
export function resolveEffectiveSchedule(npcId: string): ScheduleEntry[] {
  const store = getGameStore();
  const currentAct = store.playerState.progression.currentAct ?? 1;
  const completedQuests = new Set(
    store.quests.filter((q) => q.status === 'completed').map((q) => q.questId),
  );
  const activeFlags = new Set(store.activeTTLFlags.map((f) => f.key));
  // Also check permanent flags stored in playerState
  const playerFlags = store.playerState.flags ?? {};

  for (const override of ACT_SCHEDULE_OVERRIDES) {
    if (override.npcId !== npcId) continue;
    if (currentAct < override.minAct) continue;

    // Check quest completion requirements
    if (override.requiredCompletedQuests) {
      const allCompleted = override.requiredCompletedQuests.every((qId) =>
        completedQuests.has(qId),
      );
      if (!allCompleted) continue;
    }

    // Check flag requirements
    if (override.requiredFlags) {
      const allFlagsSet = override.requiredFlags.every(
        (flag) => activeFlags.has(flag) || playerFlags[flag],
      );
      if (!allFlagsSet) continue;
    }

    // All conditions met — use this override
    return override.entries;
  }

  // No override matched — use base schedule
  return NPC_SCHEDULES_MAP[npcId]?.entries ?? [];
}

/* ─── Core lookup functions ─── */

/**
 * Get the current schedule entry for an NPC at a given hour.
 * Returns null if the NPC has no schedule defined.
 *
 * @param npcId — the NPC's identifier (e.g. 'albert', 'zarema')
 * @param hour — hour of the day (0–24, fractional allowed)
 */
export function getNPCLocationForTime(
  npcId: string,
  hour: number,
): ScheduleEntry | null {
  const entries = resolveEffectiveSchedule(npcId);
  if (!entries.length) return null;

  for (const entry of entries) {
    if (hour >= entry.startHour && hour < entry.endHour) {
      return entry;
    }
  }

  // Fallback to last entry if hour is exactly at a boundary (e.g. 24 → wraps)
  return entries[entries.length - 1] ?? null;
}

/**
 * Get all NPC IDs that should be present in a given scene at a given hour.
 *
 * @param sceneId — the scene to check
 * @param hour — hour of the day (0–24)
 */
export function getNPCsInScene(sceneId: SceneId, hour: number): string[] {
  const result: string[] = [];

  for (const npcId of Object.keys(NPC_SCHEDULES_MAP)) {
    const entries = resolveEffectiveSchedule(npcId);
    for (const entry of entries) {
      if (hour >= entry.startHour && hour < entry.endHour) {
        if (entry.sceneId === sceneId) {
          result.push(npcId);
        }
        break; // Only need to find the matching entry for this hour
      }
    }
  }

  return result;
}

/* ─── Backward-compatible aliases ─── */
/* These maintain the same API that was previously in this file,
 * so existing consumers continue to work. */

/**
 * @deprecated Use getNPCLocationForTime instead
 */
export function getCurrentScheduleEntry(
  npcId: string,
  hour: number,
): ScheduleEntry | null {
  return getNPCLocationForTime(npcId, hour);
}

/**
 * @deprecated Use getNPCsInScene instead
 */
export function getNPCsForScene(sceneId: SceneId, hour: number): string[] {
  return getNPCsInScene(sceneId, hour);
}

/* ─── Exploration state integration ─── */

/**
 * Build the npcStates map for the exploration slice based on the current time.
 * This can be called to initialise or update npc positions in the store.
 *
 * @param hour — current hour of the day (0–24)
 * @returns Record mapping NPC IDs to their current scene and position
 */
export function buildNPCStatesForTime(hour: number): Record<
  string,
  { position: [number, number, number]; sceneId: SceneId }
> {
  const result: Record<string, { position: [number, number, number]; sceneId: SceneId }> = {};

  for (const npcId of Object.keys(NPC_SCHEDULES_MAP)) {
    const entry = getNPCLocationForTime(npcId, hour);
    if (entry) {
      result[npcId] = {
        position: [...entry.position] as [number, number, number],
        sceneId: entry.sceneId,
      };
    }
  }

  return result;
}

/**
 * Get the schedule entries for a specific NPC.
 * Useful for UI that displays the full daily routine.
 *
 * @param npcId — the NPC's identifier
 */
export function getNPCSchedule(npcId: string): ScheduleEntry[] {
  return resolveEffectiveSchedule(npcId);
}

/**
 * Check if an NPC is currently in a specific scene at a given hour.
 *
 * @param npcId — the NPC's identifier
 * @param sceneId — the scene to check
 * @param hour — current hour (0–24)
 */
export function isNPCInScene(npcId: string, sceneId: SceneId, hour: number): boolean {
  const entry = getNPCLocationForTime(npcId, hour);
  return entry?.sceneId === sceneId;
}

/**
 * Get all NPCs that share a scene with a given NPC at a given hour.
 * Useful for social interactions and dialogue triggers.
 *
 * @param npcId — the NPC whose scene-mates we want
 * @param hour — current hour (0–24)
 */
export function getSceneMates(npcId: string, hour: number): string[] {
  const entry = getNPCLocationForTime(npcId, hour);
  if (!entry) return [];

  const npcsInScene = getNPCsInScene(entry.sceneId, hour);
  return npcsInScene.filter((id) => id !== npcId);
}
