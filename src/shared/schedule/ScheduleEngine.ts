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
import { hashScheduleContext, type ScheduleContext } from '@/shared/scheduleContext';
import { NPC_SCHEDULES_MAP, ACT_SCHEDULE_OVERRIDES } from '@/data/npcSchedules';

type NPCStateRecord = Record<string, { position: [number, number, number]; sceneId: SceneId }>;

let activeContextHash: string | null = null;
const effectiveScheduleCache = new Map<string, ScheduleEntry[]>();
const locationCache = new Map<string, ScheduleEntry | null>();
const npcsInSceneCache = new Map<string, string[]>();
const npcStatesCache = new Map<string, NPCStateRecord>();

function ensureCacheGeneration(ctx: ScheduleContext): string {
  const ctxHash = hashScheduleContext(ctx);
  if (ctxHash !== activeContextHash) {
    effectiveScheduleCache.clear();
    locationCache.clear();
    npcsInSceneCache.clear();
    npcStatesCache.clear();
    activeContextHash = ctxHash;
  }
  return ctxHash;
}

/** Clears schedule result caches (tests / hot reload). */
export function resetScheduleEngineCache(): void {
  activeContextHash = null;
  effectiveScheduleCache.clear();
  locationCache.clear();
  npcsInSceneCache.clear();
  npcStatesCache.clear();
}

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
  const ctxHash = ensureCacheGeneration(ctx);
  const cacheKey = `${npcId}:${ctxHash}`;
  const cached = effectiveScheduleCache.get(cacheKey);
  if (cached) return cached;

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

    if (override.excludedFlags) {
      const anyExcludedSet = override.excludedFlags.some(
        (flag) => activeFlags.has(flag) || playerFlags[flag],
      );
      if (anyExcludedSet) continue;
    }

    effectiveScheduleCache.set(cacheKey, override.entries);
    return override.entries;
  }

  const entries = NPC_SCHEDULES_MAP[npcId]?.entries ?? [];
  effectiveScheduleCache.set(cacheKey, entries);
  return entries;
}

/* ─── Core lookup functions ─── */

export function getNPCLocationForTime(
  npcId: string,
  hour: number,
  ctx: ScheduleContext,
): ScheduleEntry | null {
  const ctxHash = ensureCacheGeneration(ctx);
  const cacheKey = `${npcId}:${hour}:${ctxHash}`;
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey) ?? null;
  }

  const entries = resolveEffectiveSchedule(npcId, ctx);
  if (!entries.length) {
    locationCache.set(cacheKey, null);
    return null;
  }

  for (const entry of entries) {
    if (hour >= entry.startHour && hour < entry.endHour) {
      locationCache.set(cacheKey, entry);
      return entry;
    }
  }

  const fallback = entries[entries.length - 1] ?? null;
  locationCache.set(cacheKey, fallback);
  return fallback;
}

export function getNPCsInScene(
  sceneId: SceneId,
  hour: number,
  ctx: ScheduleContext,
): string[] {
  const ctxHash = ensureCacheGeneration(ctx);
  const cacheKey = `${sceneId}:${hour}:${ctxHash}`;
  const cached = npcsInSceneCache.get(cacheKey);
  if (cached) return cached;

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

  npcsInSceneCache.set(cacheKey, result);
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
): NPCStateRecord {
  const ctxHash = ensureCacheGeneration(ctx);
  const cacheKey = `${hour}:${ctxHash}`;
  const cached = npcStatesCache.get(cacheKey);
  if (cached) return cached;

  const result: NPCStateRecord = {};

  for (const npcId of Object.keys(NPC_SCHEDULES_MAP)) {
    const entry = getNPCLocationForTime(npcId, hour, ctx);
    if (entry) {
      result[npcId] = {
        position: [...entry.position] as [number, number, number],
        sceneId: entry.sceneId,
      };
    }
  }

  npcStatesCache.set(cacheKey, result);
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
