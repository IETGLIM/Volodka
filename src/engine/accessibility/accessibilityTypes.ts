/** All supported color-vision modes — extend this list when adding new filters. */
export const VALID_COLOR_BLIND_MODES = [
  'none',
  'protanopia',
  'deuteranopia',
  'tritanopia',
] as const;

export type ColorBlindMode = (typeof VALID_COLOR_BLIND_MODES)[number];

declare const subtitleScaleBrand: unique symbol;
declare const textSpeedBrand: unique symbol;
declare const locomotionSpeedBrand: unique symbol;

/** Clamped subtitle size multiplier (see ACCESSIBILITY_NUMERIC_RANGES). */
export type SubtitleScale = number & { readonly [subtitleScaleBrand]: true };

/** Clamped dialogue/story typewriter speed multiplier. */
export type TextSpeed = number & { readonly [textSpeedBrand]: true };

/** Clamped player locomotion speed multiplier. */
export type LocomotionSpeed = number & { readonly [locomotionSpeedBrand]: true };

export interface AccessibilitySettingsSnapshot {
  colorBlindMode: ColorBlindMode;
  reducedMotionOverride: boolean;
  subtitleScale: SubtitleScale;
  textSpeed: TextSpeed;
  locomotionSpeed: LocomotionSpeed;
}

export type AccessibilitySettingKey = keyof AccessibilitySettingsSnapshot;

export type AccessibilityChangedKey = AccessibilitySettingKey | 'all';

const VALID_COLOR_BLIND_MODE_SET = new Set<string>(VALID_COLOR_BLIND_MODES);

/** Parse LS / UI input into a supported color-blind mode. */
export function parseColorBlindMode(raw: unknown): ColorBlindMode {
  const value = String(raw);
  return VALID_COLOR_BLIND_MODE_SET.has(value) ? (value as ColorBlindMode) : 'none';
}

export function isColorBlindMode(value: unknown): value is ColorBlindMode {
  return typeof value === 'string' && VALID_COLOR_BLIND_MODE_SET.has(value);
}
