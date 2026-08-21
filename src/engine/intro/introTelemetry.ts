import { devWarn, devInfo } from '@/shared/utils/devLog';
export type IntroFinishReason = 'complete' | 'skip' | 'timeout' | 'missing_poem';

export type IntroTelemetryEvent = {
  reason: IntroFinishReason;
  durationMs: number;
  skipped: boolean;
};

type IntroReporter = (event: IntroTelemetryEvent) => void;

let startedAt = 0;
let finished = false;

function getReporter(): IntroReporter | undefined {
  return (
    globalThis as typeof globalThis & {
      __volodkaIntroTelemetry?: IntroReporter;
    }
  ).__volodkaIntroTelemetry;
}

export const introTelemetry = {
  markStarted(): void {
    startedAt = performance.now();
    finished = false;
  },

  markFinished(reason: IntroFinishReason): void {
    if (finished) return;
    finished = true;
    const payload: IntroTelemetryEvent = {
      reason,
      durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
      skipped: reason !== 'complete',
    };

    if (import.meta.env.DEV) {
      devInfo('[IntroTelemetry]', payload);
    }

    try {
      getReporter()?.(payload);
    } catch (error) {
      devWarn('[IntroTelemetry] Reporter failed:', error);
    }
  },

  /** Test helper */
  reset(): void {
    startedAt = 0;
    finished = false;
  },
};
