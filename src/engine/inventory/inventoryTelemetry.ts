export type InventoryTelemetryAction =
  | 'open'
  | 'use'
  | 'equip'
  | 'unequip'
  | 'drop'
  | 'filter'
  | 'search'
  | 'tooltip_shown';

export type InventoryTelemetryEvent = {
  action: InventoryTelemetryAction;
  itemId?: string;
  filter?: string;
  queryLength?: number;
};

type InventoryReporter = (event: InventoryTelemetryEvent) => void;

function getReporter(): InventoryReporter | undefined {
  return (
    globalThis as typeof globalThis & {
      __volodkaInventoryTelemetry?: InventoryReporter;
    }
  ).__volodkaInventoryTelemetry;
}

export const inventoryTelemetry = {
  track(event: InventoryTelemetryEvent): void {
    if (import.meta.env.DEV) {
      console.info('[InventoryTelemetry]', event);
    }
    try {
      getReporter()?.(event);
    } catch (error) {
      console.warn('[InventoryTelemetry] Reporter failed:', error);
    }
  },
};
