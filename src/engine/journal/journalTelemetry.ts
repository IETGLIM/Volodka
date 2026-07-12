export type JournalTelemetryAction =
  | 'open'
  | 'tab_change'
  | 'note_view'
  | 'lore_view'
  | 'poem_view'
  | 'search';

export type JournalTelemetryEvent = {
  action: JournalTelemetryAction;
  tab?: string;
  itemId?: string;
  queryLength?: number;
};

type JournalReporter = (event: JournalTelemetryEvent) => void;

function getReporter(): JournalReporter | undefined {
  return (
    globalThis as typeof globalThis & {
      __volodkaJournalTelemetry?: JournalReporter;
    }
  ).__volodkaJournalTelemetry;
}

export const journalTelemetry = {
  track(event: JournalTelemetryEvent): void {
    if (import.meta.env.DEV) {
      console.info('[JournalTelemetry]', event);
    }
    try {
      getReporter()?.(event);
    } catch (error) {
      console.warn('[JournalTelemetry] Reporter failed:', error);
    }
  },
};
