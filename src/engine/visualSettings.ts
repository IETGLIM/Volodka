/**
 * Unified visual / control settings for render systems.
 * Persists in localStorage (same keys as SettingsPanel) and exposes a cached
 * snapshot for hot paths (camera input, shake) plus a change event for React.
 *
 * Mirrors the AudioSettings pattern (engine/audio/AudioSettings.ts).
 */

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
}

const LS_POSTFX = 'volodka_postfx';
const LS_SCANLINES = 'volodka_scanlines';
const LS_PARTICLES = 'volodka_particles';
const LS_CAM_SHAKE = 'volodka_cam_shake';
const LS_BRIGHTNESS = 'volodka_brightness';
const LS_MOUSE_SENS = 'volodka_mouse_sens';
const LS_INVERT_Y = 'volodka_invert_y';

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

/** Read persisted settings from localStorage (normalised to multipliers). */
export function readVisualSettings(): VisualSettingsSnapshot {
  return {
    postfxEnabled: lsGetBool(LS_POSTFX, true),
    scanlinesEnabled: lsGetBool(LS_SCANLINES, true),
    particlesEnabled: lsGetBool(LS_PARTICLES, true),
    cameraShakeEnabled: lsGetBool(LS_CAM_SHAKE, true),
    brightness: Math.max(50, Math.min(150, lsGetNumber(LS_BRIGHTNESS, 100))) / 100,
    mouseSensitivity: Math.max(1, Math.min(10, lsGetNumber(LS_MOUSE_SENS, 5))) / 5,
    invertY: lsGetBool(LS_INVERT_Y, false),
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
