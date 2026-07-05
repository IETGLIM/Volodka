/* ─── Quest runtime state ─── */

export type QuestStatus = 'inactive' | 'active' | 'completed' | 'failed';

export interface QuestState {
  readonly questId: string;
  status: QuestStatus;
  readonly objectives: Record<string, boolean>;
  /** In-game hour when quest was activated (for time limit tracking) */
  readonly startedAtTime?: number;
  /** Accumulated in-game hours since activation (persists across midnight). */
  readonly hoursElapsed?: number;
  /** Wall-clock ms when quest was activated — fallback when hour ticks stall. */
  readonly startedAtWallMs?: number;
}
