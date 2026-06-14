import { useEffect, useState } from 'react';
import { eventBus } from '@/engine/EventBus';
import { getAccessibilitySettings } from '@/engine/accessibility/accessibilitySettings';
import type { AccessibilitySettingsSnapshot } from '@/engine/accessibility/accessibilityTypes';

/** Live accessibility snapshot — init, in-panel edits, reset, and cross-tab sync. */
export function useAccessibilitySettings(): AccessibilitySettingsSnapshot {
  const [settings, setSettings] = useState(() => getAccessibilitySettings());

  useEffect(() => {
    setSettings(getAccessibilitySettings());
    return eventBus.on('accessibility:changed', ({ settings: next }) => {
      setSettings({ ...next });
    });
  }, []);

  return settings;
}
