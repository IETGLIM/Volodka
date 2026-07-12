/* ─── Volodka RPG – client error telemetry (Sentry hook point) ─── */

import type { ErrorTelemetryPayload } from './errorRecoveryTypes';

export const gameTelemetry = {
  captureException(error: Error, payload: ErrorTelemetryPayload = {}): void {
    console.error('[GameTelemetry] captureException:', error, payload);

    const globalReporter = (
      globalThis as typeof globalThis & {
        __volodkaReportError?: (error: Error, payload: ErrorTelemetryPayload) => void;
      }
    ).__volodkaReportError;

    try {
      globalReporter?.(error, payload);
    } catch (reportError) {
      console.warn('[GameTelemetry] External reporter failed:', reportError);
    }
  },
};
