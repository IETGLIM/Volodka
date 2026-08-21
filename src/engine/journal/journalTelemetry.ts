import { devWarn, devInfo } from '@/shared/utils/devLog';
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
      devInfo('[JournalTelemetry]', event);
    }
    try {
      getReporter()?.(event);
    } catch (error) {
      devWarn('[JournalTelemetry] Reporter failed:', error);
    }
  },
};
