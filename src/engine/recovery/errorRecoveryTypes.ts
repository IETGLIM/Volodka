/* ─── Volodka RPG – game error recovery types ─── */

export type ErrorRecoveryContext = {
  sceneId?: string;
  gameMode?: string;
  playerLevel?: number;
  sessionUptimeMs?: number;
  errorCode?: string;
  gameVersion?: string;
};

export type ErrorTelemetryPayload = {
  componentStack?: string | null;
  context?: Partial<ErrorRecoveryContext>;
};
