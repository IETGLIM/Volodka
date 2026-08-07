/**
 * Unified visual / control settings for render systems.
 * Persists in localStorage (same keys as SettingsPanel) and exposes a cached
 * snapshot for hot paths (camera input, shake) plus a change event for React.
 *
 * Mirrors the AudioSettings pattern (engine/audio/AudioSettings.ts).
 */

import { detectAutoQualityPreset } from '@/engine/graphics/qualityPresets';

export const VISUAL_SETTINGS_CHANGED = 'volodka:visual-settings-changed';

export interface VisualSettingsSnapshot {
  /** EffectComposer pipeline on/off */
  postfxEnabled: boolean;
  /** CRT scanline overlays on panels / poem overlay */
  scanlinesEnabled: boolean;
  /** Decorative particles (weather, dust, steam) */
  particlesEnabled: boolean;
  /** Camera shake on hits / transitions */
  cameraShakeEnabled: boolean;
  /** Brightness multiplier 0.5–1.5 (slider 50–150%) */
  brightness: number;
  /** Look sensitivity multiplier 0.2–2.0 (slider 1–10, 5 = 1.0) */
  mouseSensitivity: number;
  /** Invert vertical camera look */
  invertY: boolean;
  /** Desktop FP: lock pointer on canvas click instead of drag-to-look */
  pointerLockEnabled: boolean;
  /**
   * AgX tone mapping on ultra (replaces ACES_FILMIC). AgX renders darker
   * overall, so ExplorationPostFX applies a +0.15 exposure lift to compensate.
   * Default true — only effective when preset.id === 'ultra'; non-ultra
   * presets always use ACES_FILMIC regardless of this flag.
   */
  agxToneMapping: boolean;
}

const LS_POSTFX = 'volodka_postfx';
const LS_SCANLINES = 'volodka_scanlines';
const LS_PARTICLES = 'volodka_particles';
const LS_CAM_SHAKE = 'volodka_cam_shake';
const LS_BRIGHTNESS = 'volodka_brightness';
const LS_MOUSE_SENS = 'volodka_mouse_sens';
const LS_INVERT_Y = 'volodka_invert_y';
const LS_POINTER_LOCK = 'volodka_pointer_lock';
const LS_AGX = 'volodka_agx';

function lsGetBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return raw === 'true';
  } catch {
    return fallback;
  }
}

function lsGetNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

// ─── Motion-friendly default detection (mobile/low-end/touch) ─────────────
//
// On a fresh install (no visual settings in localStorage), mobile/low-end/touch
// devices should start with camera shake + decorative particles OFF to avoid
// nausea and perf issues out of the box. The user can still toggle these ON
// via the Settings panel — this only affects the out-of-box default.
//
// Detection reuses the EXISTING quality-tier + coarse-pointer + viewport
// heuristics (no new mobile-detection hook). Conditions (any one):
//   (a) auto-detected quality tier resolves to 'low' or 'medium'
//   (b) a coarse-pointer (touch) device is detected via matchMedia
//   (c) the viewport is mobile-narrow (< 768 CSS px)
//
// All probes are SSR-safe (return false when window/navigator unavailable)
// and wrapped in try/catch so a broken matchMedia/visualViewport never
// blocks settings load.

function hasCoarsePointerForDefaults(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

function readViewportWidthForDefaults(): number {
  if (typeof window === 'undefined') return 1920;
  try {
    const w = window.visualViewport?.width ?? window.innerWidth;
    return typeof w === 'number' && w > 0 ? Math.round(w) : 1920;
  } catch {
    return 1920;
  }
}

function readDevicePixelRatioForDefaults(): number {
  if (typeof window === 'undefined' || typeof window.devicePixelRatio !== 'number') {
    return 1;
  }
  return window.devicePixelRatio ?? 1;
}

function isLowOrMediumAutoTier(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const tier = detectAutoQualityPreset(
      readViewportWidthForDefaults(),
      readDevicePixelRatioForDefaults(),
    );
    return tier === 'low' || tier === 'medium';
  } catch {
    return false;
  }
}

function isNarrowMobileViewport(): boolean {
  const w = readViewportWidthForDefaults();
  return w > 0 && w < 768;
}

/**
 * True when the current device should start with motion-friendly visual
 * defaults (camera shake + decorative particles OFF). Used ONLY to pick the
 * out-of-box defaults on a fresh install — explicit user choices always win.
 *
 * Reuses the existing auto-quality + coarse-pointer detection so there is a
 * single source of truth for "is this a motion-sensitive device".
 */
export function shouldUseMotionFriendlyDefaults(): boolean {
  if (typeof window === 'undefined') return false;
  if (hasCoarsePointerForDefaults()) return true;
  if (isNarrowMobileViewport()) return true;
  if (isLowOrMediumAutoTier()) return true;
  return false;
}

/**
 * On a fresh install (when BOTH cameraShake and particles settings are absent
 * from localStorage), pre-seed motion-friendly defaults if the current device
 * is mobile/low-end/touch. After this runs, subsequent reads return the
 * device-appropriate default — same as if the user had explicitly chosen it.
 *
 * Idempotent: once either key has been written (by this seeder, by the user
 * via the Settings panel, or by the adaptive-quality bridge), this function
 * becomes a no-op for those keys — explicit choices are NEVER overridden.
 *
 * Safe to call from any context (skips when localStorage unavailable).
 */
export function seedMotionFriendlyVisualDefaultsIfNeeded(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const shakeSet = localStorage.getItem(LS_CAM_SHAKE) !== null;
    const particlesSet = localStorage.getItem(LS_PARTICLES) !== null;
    // Only seed on a TRUE fresh install for these two motion keys: neither
    // has ever been written. If either is present, the user (or a prior boot
    // seed, or the adaptive-quality bridge) has already made a choice —
    // respect it.
    if (shakeSet || particlesSet) return;
    if (!shouldUseMotionFriendlyDefaults()) return;
    localStorage.setItem(LS_CAM_SHAKE, String(false));
    localStorage.setItem(LS_PARTICLES, String(false));
  } catch {
    // localStorage access can throw (private mode, quota, SSR). No-op.
  }
}

/** Read persisted settings from localStorage (normalised to multipliers). */
export function readVisualSettings(): VisualSettingsSnapshot {
  // Fresh-install seeding: if neither cameraShake nor particles has ever been
  // saved AND the device is mobile/low-end/touch, pre-seed motion-friendly
  // defaults so the user doesn't get nausea/perf issues out of the box. No-op
  // once either key has been explicitly set.
  seedMotionFriendlyVisualDefaultsIfNeeded();

  return {
    postfxEnabled: lsGetBool(LS_POSTFX, true),
    scanlinesEnabled: lsGetBool(LS_SCANLINES, true),
    particlesEnabled: lsGetBool(LS_PARTICLES, true),
    cameraShakeEnabled: lsGetBool(LS_CAM_SHAKE, true),
    brightness: Math.max(50, Math.min(150, lsGetNumber(LS_BRIGHTNESS, 100))) / 100,
    mouseSensitivity: Math.max(1, Math.min(10, lsGetNumber(LS_MOUSE_SENS, 5))) / 5,
    invertY: lsGetBool(LS_INVERT_Y, false),
    pointerLockEnabled: lsGetBool(LS_POINTER_LOCK, false),
    // Default ON: AgX is the modern filmic tone mapper; user can opt out.
    // Effective only when preset.id === 'ultra' (see ExplorationPostFX).
    agxToneMapping: lsGetBool(LS_AGX, true),
  };
}

let cached: VisualSettingsSnapshot = readVisualSettings();

/** Cached snapshot — safe to call per pointer event / per frame. */
export function getVisualSettings(): VisualSettingsSnapshot {
  return cached;
}

/** Re-read localStorage, update DOM flags, notify subscribers. */
export function applyVisualSettings(): VisualSettingsSnapshot {
  cached = readVisualSettings();
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.scanlines = cached.scanlinesEnabled ? 'on' : 'off';
    document.documentElement.dataset.particles = cached.particlesEnabled ? 'on' : 'off';
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(VISUAL_SETTINGS_CHANGED, { detail: cached }));
  }
  return cached;
}
