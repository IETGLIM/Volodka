import { devWarn, devInfo } from '@/shared/utils/devLog';
export type KarmaPoemTelemetryAction = 'open' | 'tab_change' | 'close';

export type KarmaPoemTelemetryEvent = {
  action: KarmaPoemTelemetryAction;
  tab?: string;
};

type KarmaPoemReporter = (event: KarmaPoemTelemetryEvent) => void;

function getReporter(): KarmaPoemReporter | undefined {
  return (
    globalThis as typeof globalThis & {
      __volodkaKarmaPoemTelemetry?: KarmaPoemReporter;
    }
  ).__volodkaKarmaPoemTelemetry;
}

export const karmaPoemTelemetry = {
  track(event: KarmaPoemTelemetryEvent): void {
    if (import.meta.env.DEV) {
      devInfo('[KarmaPoemTelemetry]', event);
    }
    try {
      getReporter()?.(event);
    } catch (error) {
      devWarn('[KarmaPoemTelemetry] Reporter failed:', error);
    }
  },
};
