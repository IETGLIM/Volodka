/**
 * Accessibility settings — applies data attributes to document root for CSS hooks.
 */

export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export interface AccessibilitySettingsSnapshot {
  colorBlindMode: ColorBlindMode;
  reducedMotionOverride: boolean;
  subtitleScale: number;
  /** Dialogue/story typewriter speed multiplier (independent of font size). */
  textSpeed: number;
  /** Player walk/run speed multiplier (accessibility). */
  locomotionSpeed: number;
}

export const ACCESSIBILITY_SETTINGS_CHANGED = 'volodka:accessibility-settings-changed';

const LS_COLOR_BLIND = 'volodka_color_blind_mode';
const LS_REDUCED_MOTION = 'volodka_reduced_motion_override';
const LS_SUBTITLE_SCALE = 'volodka_subtitle_scale';
const LS_TEXT_SPEED = 'volodka_text_speed';
const LS_LOCOMOTION_SPEED = 'volodka_locomotion_speed';

function lsGet(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function lsGetBool(key: string, fallback: boolean): boolean {
  return lsGet(key, String(fallback)) === 'true';
}

function lsGetNumber(key: string, fallback: number): number {
  const n = Number(lsGet(key, String(fallback)));
  return Number.isFinite(n) ? n : fallback;
}

export function readAccessibilitySettings(): AccessibilitySettingsSnapshot {
  const raw = lsGet(LS_COLOR_BLIND, 'none') as ColorBlindMode;
  const colorBlindMode: ColorBlindMode =
    raw === 'protanopia' || raw === 'deuteranopia' || raw === 'tritanopia' ? raw : 'none';
  return {
    colorBlindMode,
    reducedMotionOverride: lsGetBool(LS_REDUCED_MOTION, false),
    subtitleScale: Math.max(0.8, Math.min(1.5, lsGetNumber(LS_SUBTITLE_SCALE, 1))),
    textSpeed: Math.max(0.5, Math.min(2, lsGetNumber(LS_TEXT_SPEED, 1))),
    locomotionSpeed: Math.max(0.7, Math.min(1.3, lsGetNumber(LS_LOCOMOTION_SPEED, 1))),
  };
}

let cached = readAccessibilitySettings();

export function getAccessibilitySettings(): AccessibilitySettingsSnapshot {
  return cached;
}

function applyToDom(settings: AccessibilitySettingsSnapshot): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (settings.colorBlindMode === 'none') {
    root.removeAttribute('data-color-blind-mode');
  } else {
    root.setAttribute('data-color-blind-mode', settings.colorBlindMode);
  }
  if (settings.reducedMotionOverride) {
    root.setAttribute('data-reduced-motion', 'true');
  } else {
    root.removeAttribute('data-reduced-motion');
  }
  root.style.setProperty('--subtitle-scale', String(settings.subtitleScale));
}

export function applyAccessibilitySettings(): AccessibilitySettingsSnapshot {
  cached = readAccessibilitySettings();
  applyToDom(cached);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ACCESSIBILITY_SETTINGS_CHANGED));
  }
  return cached;
}

export function setColorBlindMode(mode: ColorBlindMode): void {
  localStorage.setItem(LS_COLOR_BLIND, mode);
  applyAccessibilitySettings();
}

export function setReducedMotionOverride(enabled: boolean): void {
  localStorage.setItem(LS_REDUCED_MOTION, String(enabled));
  applyAccessibilitySettings();
}

export function setSubtitleScale(scale: number): void {
  localStorage.setItem(LS_SUBTITLE_SCALE, String(Math.max(0.8, Math.min(1.5, scale))));
  applyAccessibilitySettings();
}

export function setTextSpeed(speed: number): void {
  localStorage.setItem(LS_TEXT_SPEED, String(Math.max(0.5, Math.min(2, speed))));
  applyAccessibilitySettings();
}

export function setLocomotionSpeed(speed: number): void {
  localStorage.setItem(LS_LOCOMOTION_SPEED, String(Math.max(0.7, Math.min(1.3, speed))));
  applyAccessibilitySettings();
}

/** Call once at app boot. */
export function initAccessibilitySettings(): void {
  applyAccessibilitySettings();
}
