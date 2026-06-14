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
      console.info('[KarmaPoemTelemetry]', event);
    }
    try {
      getReporter()?.(event);
    } catch (error) {
      console.warn('[KarmaPoemTelemetry] Reporter failed:', error);
    }
  },
};
