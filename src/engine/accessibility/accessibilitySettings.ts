/**
 * Accessibility settings — default manager instance and backward-compatible facade.
 */

import {
  AccessibilityManager,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  readAccessibilitySettingsFromStorage,
} from './AccessibilityManager';
import {
  createLocomotionSpeed,
  createSubtitleScale,
  createTextSpeed,
} from './accessibilityConstraints';
import type {
  AccessibilitySettingsSnapshot,
  ColorBlindMode,
  LocomotionSpeed,
  SubtitleScale,
  TextSpeed,
} from './accessibilityTypes';

export type {
  AccessibilityChangedKey,
  AccessibilitySettingKey,
  AccessibilitySettingsSnapshot,
  ColorBlindMode,
  LocomotionSpeed,
  SubtitleScale,
  TextSpeed,
} from './accessibilityTypes';
export {
  isColorBlindMode,
  parseColorBlindMode,
  VALID_COLOR_BLIND_MODES,
} from './accessibilityTypes';

export {
  AccessibilityManager,
  ACCESSIBILITY_LS_KEYS,
  readAccessibilitySettingsFromStorage,
} from './AccessibilityManager';
export {
  ACCESSIBILITY_NUMERIC_RANGES,
  accessibilitySliderBounds,
  accessibilitySliderPercent,
  clampInRange,
  clampNumericAccessibilitySetting,
  createLocomotionSpeed,
  createSubtitleScale,
  createTextSpeed,
  DEFAULT_ACCESSIBILITY_SETTINGS,
} from './accessibilityConstraints';
export {
  ACCESSIBILITY_DOM_HOOKS,
  ACCESSIBILITY_DOM_SETTING_KEYS,
  applyAccessibilityDomHooks,
} from './accessibilityDomPresentation';
export type {
  AccessibilityCssVarDomHook,
  AccessibilityDataAttributeDomHook,
  AccessibilityDomHook,
} from './accessibilityDomPresentation';
export type { AccessibilityNumericSettingKey } from './accessibilityConstraints';
export type { AccessibilityManagerOptions, AccessibilityStorage } from './AccessibilityManager';

let defaultManager = new AccessibilityManager();

function manager(): AccessibilityManager {
  return defaultManager;
}

/** @deprecated Prefer accessibilityManager.getSettings() — kept for call sites. */
export function readAccessibilitySettings(): AccessibilitySettingsSnapshot {
  const storage = typeof localStorage !== 'undefined' ? localStorage : null;
  return storage
    ? readAccessibilitySettingsFromStorage(storage)
    : { ...DEFAULT_ACCESSIBILITY_SETTINGS };
}

export function getAccessibilitySettings(): AccessibilitySettingsSnapshot {
  return manager().getSettings();
}

/** In-game reduced-motion override or OS prefers-reduced-motion (engine-safe, no React). */
export function isEffectiveReducedMotion(): boolean {
  if (defaultManager.getReducedMotionOverride()) return true;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Hot-path locomotion scale — no snapshot allocation. */
export function getAccessibilityLocomotionSpeed(): number {
  return defaultManager.getLocomotionSpeed();
}

export function applyAccessibilitySettings(): AccessibilitySettingsSnapshot {
  return manager().applyFromStorage();
}

export function setColorBlindMode(mode: ColorBlindMode): void {
  manager().updateSetting('colorBlindMode', mode);
}

export function setReducedMotionOverride(enabled: boolean): void {
  manager().updateSetting('reducedMotionOverride', enabled);
}

export function setLoadingFxDisabled(enabled: boolean): void {
  manager().updateSetting('loadingFxDisabled', enabled);
}

export function setSkipPoemCutscenes(enabled: boolean): void {
  manager().updateSetting('skipPoemCutscenes', enabled);
}

export function setSubtitleScale(scale: number | SubtitleScale): void {
  manager().updateSetting('subtitleScale', createSubtitleScale(scale));
}

export function setTextSpeed(speed: number | TextSpeed): void {
  manager().updateSetting('textSpeed', createTextSpeed(speed));
}

export function setLocomotionSpeed(speed: number | LocomotionSpeed): void {
  manager().updateSetting('locomotionSpeed', createLocomotionSpeed(speed));
}

export function setHighContrast(enabled: boolean): void {
  manager().updateSetting('highContrast', enabled);
}

export function resetAccessibilitySettings(): AccessibilitySettingsSnapshot {
  return manager().reset();
}

/** Call once at app boot before UI render. */
export function initAccessibilitySettings(): AccessibilitySettingsSnapshot {
  return manager().init();
}

/** Production singleton — prefer injecting AccessibilityManager in tests. */
export function getAccessibilityManager(): AccessibilityManager {
  return defaultManager;
}

/** Test harness — replace default manager with a fresh isolated instance. */
export function replaceDefaultAccessibilityManager(next: AccessibilityManager): AccessibilityManager {
  defaultManager.dispose();
  defaultManager = next;
  return defaultManager;
}

/** Test harness — restore a fresh default manager. */
export function resetDefaultAccessibilityManager(): AccessibilityManager {
  return replaceDefaultAccessibilityManager(new AccessibilityManager({ syncCrossTab: false }));
}

export const accessibilityManager = {
  get current(): AccessibilityManager {
    return defaultManager;
  },
};
