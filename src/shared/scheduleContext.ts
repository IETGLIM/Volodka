/* ─── Schedule context — pure data for NPC schedule resolution ─── */
/* Keeps ScheduleEngine free of store imports (breaks engine↔store cycle). */

import type { ActiveTTLFlagMap } from '@/store/activeTTLFlags';

export interface ScheduleContext {
  currentAct: number;
  completedQuestIds: ReadonlySet<string>;
  activeFlagKeys: ReadonlySet<string>;
  playerFlags: Readonly<Record<string, boolean>>;
}

/** Store-like shape accepted by buildScheduleContext / selectScheduleContext. */
export type ScheduleContextSource = {
  playerState: {
    progression: { currentAct?: number };
    flags?: Record<string, boolean>;
  };
  quests: Array<{ questId: string; status: string }>;
  activeTTLFlags: ActiveTTLFlagMap;
};

/** Stable hash for cache keys — same inputs as ScheduleContext invalidation. */
export function hashScheduleContext(ctx: ScheduleContext): string {
  const completed = [...ctx.completedQuestIds].sort().join(',');
  const activeFlags = [...ctx.activeFlagKeys].sort().join(',');
  const playerFlags = Object.entries(ctx.playerFlags)
    .filter(([, value]) => value)
    .map(([key]) => key)
    .sort()
    .join(',');
  return `${ctx.currentAct}|${completed}|${activeFlags}|${playerFlags}`;
}

function computeScheduleContextKey(state: ScheduleContextSource): string {
  const act = state.playerState.progression.currentAct ?? 1;
  const completed = state.quests
    .filter((q) => q.status === 'completed')
    .map((q) => q.questId)
    .sort()
    .join(',');
  const ttlFlags = Object.keys(state.activeTTLFlags)
    .sort()
    .join(',');
  const playerFlags = Object.entries(state.playerState.flags ?? {})
    .filter(([, value]) => value)
    .map(([key]) => key)
    .sort()
    .join(',');
  return `${act}|${completed}|${ttlFlags}|${playerFlags}`;
}

let cachedContextKey: string | null = null;
let cachedContext: ScheduleContext | null = null;

/** Build schedule context from store-like state (no Zustand dependency). */
export function buildScheduleContext(state: ScheduleContextSource): ScheduleContext {
  const key = computeScheduleContextKey(state);
  if (cachedContextKey === key && cachedContext) {
    return cachedContext;
  }

  cachedContext = {
    currentAct: state.playerState.progression.currentAct ?? 1,
    completedQuestIds: new Set(
      state.quests.filter((q) => q.status === 'completed').map((q) => q.questId),
    ),
    activeFlagKeys: new Set(Object.keys(state.activeTTLFlags)),
    playerFlags: state.playerState.flags ?? {},
  };
  cachedContextKey = key;
  return cachedContext;
}

/** Zustand selector — returns a stable ScheduleContext reference until schedule inputs change. */
export function selectScheduleContext(state: ScheduleContextSource): ScheduleContext {
  return buildScheduleContext(state);
}

/** Equality fn for useGameStore(selectScheduleContext, scheduleContextEqual). */
export function scheduleContextEqual(a: ScheduleContext, b: ScheduleContext): boolean {
  if (a === b) return true;
  if (a.currentAct !== b.currentAct) return false;
  if (a.completedQuestIds.size !== b.completedQuestIds.size) return false;
  for (const id of a.completedQuestIds) {
    if (!b.completedQuestIds.has(id)) return false;
  }
  if (a.activeFlagKeys.size !== b.activeFlagKeys.size) return false;
  for (const key of a.activeFlagKeys) {
    if (!b.activeFlagKeys.has(key)) return false;
  }
  const flagsA = a.playerFlags;
  const flagsB = b.playerFlags;
  const keysA = Object.keys(flagsA);
  if (keysA.length !== Object.keys(flagsB).length) return false;
  for (const key of keysA) {
    if (flagsA[key] !== flagsB[key]) return false;
  }
  return true;
}

/** Clears module-level context cache (tests / hot reload). */
export function resetScheduleContextCache(): void {
  cachedContextKey = null;
  cachedContext = null;
}
