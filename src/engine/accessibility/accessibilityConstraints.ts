import type {
  AccessibilitySettingKey,
  AccessibilitySettingsSnapshot,
  LocomotionSpeed,
  SubtitleScale,
  TextSpeed,
} from './accessibilityTypes';
import { parseColorBlindMode } from './accessibilityTypes';

/** Allowed numeric ranges — single source of truth for clamping. */
export const ACCESSIBILITY_NUMERIC_RANGES = {
  subtitleScale: { min: 0.8, max: 1.5 },
  textSpeed: { min: 0.5, max: 2 },
  locomotionSpeed: { min: 0.7, max: 1.3 },
} as const;

export type AccessibilityNumericSettingKey = keyof typeof ACCESSIBILITY_NUMERIC_RANGES;

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createBrandedNumericSetting<K extends AccessibilityNumericSettingKey>(
  key: K,
  value: unknown,
  fallback: number,
): AccessibilitySettingsSnapshot[K] {
  const { min, max } = ACCESSIBILITY_NUMERIC_RANGES[key];
  const n = Number(value);
  const resolved = Number.isFinite(n) ? n : fallback;
  return clampNumber(resolved, min, max) as AccessibilitySettingsSnapshot[K];
}

/** Slider min/max in whole percents — derived from ACCESSIBILITY_NUMERIC_RANGES. */
export function accessibilitySliderBounds(key: AccessibilityNumericSettingKey): { min: number; max: number } {
  const { min, max } = ACCESSIBILITY_NUMERIC_RANGES[key];
  return { min: Math.round(min * 100), max: Math.round(max * 100) };
}

/** Normalized multiplier → whole-percent slider value (e.g. 1.25 → 125). */
export function accessibilitySliderPercent(multiplier: number): number {
  return Math.round(multiplier * 100);
}

export function createSubtitleScale(value: unknown, fallback: number = 1): SubtitleScale {
  return createBrandedNumericSetting('subtitleScale', value, fallback);
}

export function createTextSpeed(value: unknown, fallback: number = 1): TextSpeed {
  return createBrandedNumericSetting('textSpeed', value, fallback);
}

export function createLocomotionSpeed(value: unknown, fallback: number = 1): LocomotionSpeed {
  return createBrandedNumericSetting('locomotionSpeed', value, fallback);
}

const NUMERIC_SETTING_FACTORIES = {
  subtitleScale: createSubtitleScale,
  textSpeed: createTextSpeed,
  locomotionSpeed: createLocomotionSpeed,
} as const;

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettingsSnapshot = {
  colorBlindMode: 'none',
  reducedMotionOverride: false,
  loadingFxDisabled: false,
  subtitleScale: createSubtitleScale(1),
  textSpeed: createTextSpeed(1),
  locomotionSpeed: createLocomotionSpeed(1),
};

/** Normalize and clamp a setting value for the given key. */
export function clampInRange<K extends AccessibilitySettingKey>(
  value: unknown,
  key: K,
  fallback: AccessibilitySettingsSnapshot[K] = DEFAULT_ACCESSIBILITY_SETTINGS[key],
): AccessibilitySettingsSnapshot[K] {
  switch (key) {
    case 'colorBlindMode':
      return parseColorBlindMode(value) as AccessibilitySettingsSnapshot[K];
    case 'reducedMotionOverride':
      return (value === true || value === 'true') as AccessibilitySettingsSnapshot[K];
    case 'loadingFxDisabled':
      return (value === true || value === 'true') as AccessibilitySettingsSnapshot[K];
    case 'subtitleScale':
      return createSubtitleScale(value, Number(fallback)) as AccessibilitySettingsSnapshot[K];
    case 'textSpeed':
      return createTextSpeed(value, Number(fallback)) as AccessibilitySettingsSnapshot[K];
    case 'locomotionSpeed':
      return createLocomotionSpeed(value, Number(fallback)) as AccessibilitySettingsSnapshot[K];
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

/** Clamp a numeric accessibility multiplier (convenience for presentation hooks). */
export function clampNumericAccessibilitySetting<K extends AccessibilityNumericSettingKey>(
  key: K,
  value: number,
): AccessibilitySettingsSnapshot[K] {
  return NUMERIC_SETTING_FACTORIES[key](value, Number(DEFAULT_ACCESSIBILITY_SETTINGS[key])) as AccessibilitySettingsSnapshot[K];
}
