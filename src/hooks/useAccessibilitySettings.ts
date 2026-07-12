import { useSyncExternalStore } from 'react';
import { eventBus, type EventBusUnsubscribe } from '@/engine/EventBus';
import { getAccessibilitySettings } from '@/engine/accessibility/accessibilitySettings';
import type { AccessibilitySettingsSnapshot } from '@/engine/accessibility/accessibilityTypes';

let settings: AccessibilitySettingsSnapshot = getAccessibilitySettings();
const listeners = new Set<() => void>();
let busUnsub: EventBusUnsubscribe | null = null;

function notifyListeners(): void {
  for (const listener of listeners) listener();
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  if (listeners.size === 1) {
    settings = getAccessibilitySettings();
    busUnsub = eventBus.on('accessibility:changed', ({ settings: next }) => {
      settings = { ...next };
      notifyListeners();
    });
  }
  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0) {
      busUnsub?.();
      busUnsub = null;
    }
  };
}

function getSnapshot(): AccessibilitySettingsSnapshot {
  return settings;
}

/** Live accessibility snapshot — init, in-panel edits, reset, and cross-tab sync. */
export function useAccessibilitySettings(): AccessibilitySettingsSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
