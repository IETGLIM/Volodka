import type {
  AccessibilityChangedKey,
  AccessibilitySettingsSnapshot,
} from '@/engine/accessibility/accessibilityTypes';

/** Accessibility settings — accessibilitySettings, narrative typewriter, locomotion. */
export interface AccessibilityEvents {
  'accessibility:changed': {
    changedKey: AccessibilityChangedKey;
    settings: AccessibilitySettingsSnapshot;
  };
}
