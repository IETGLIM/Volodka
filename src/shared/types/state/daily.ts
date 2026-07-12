/* ─── Daily mission runtime state ─── */

export interface AcceptedDailyMission {
  readonly missionId: string;
  readonly acceptedAt: number;
  readonly progress: Record<string, number>;
  completed: boolean;
  claimed: boolean;
}
