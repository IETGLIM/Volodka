/* ─── Schedule context — pure data for NPC schedule resolution ─── */
/* Keeps ScheduleEngine free of store imports (breaks engine↔store cycle). */

export interface ScheduleContext {
  currentAct: number;
  completedQuestIds: ReadonlySet<string>;
  activeFlagKeys: ReadonlySet<string>;
  playerFlags: Readonly<Record<string, boolean>>;
}

/** Build schedule context from store-like state (no Zustand dependency). */
export function buildScheduleContext(state: {
  playerState: {
    progression: { currentAct?: number };
    flags?: Record<string, boolean>;
  };
  quests: Array<{ questId: string; status: string }>;
  activeTTLFlags: Array<{ key: string }>;
}): ScheduleContext {
  return {
    currentAct: state.playerState.progression.currentAct ?? 1,
    completedQuestIds: new Set(
      state.quests.filter((q) => q.status === 'completed').map((q) => q.questId),
    ),
    activeFlagKeys: new Set(state.activeTTLFlags.map((f) => f.key)),
    playerFlags: state.playerState.flags ?? {},
  };
}
