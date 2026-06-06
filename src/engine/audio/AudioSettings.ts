/**
 * Unified volume / mute settings for all audio subsystems.
 * Persists to localStorage (same keys as SettingsPanel) and applies to engines.
 */

import { audioEngine } from './AudioEngine';
import { musicEngine } from '../MusicEngine';
import { ambientEngine } from './AmbientEngine';

export const AUDIO_SETTINGS_CHANGED = 'volodka:audio-settings-changed';

export interface AudioSettingsSnapshot {
  musicVolume: number;   // 0–1
  sfxVolume: number;
  ambientVolume: number;
  musicEnabled: boolean;
}

const LS_MUSIC = 'volodka_music_volume';
const LS_SFX = 'volodka_sfx_volume';
const LS_AMBIENT = 'volodka_ambient_volume';
const LS_MUSIC_ENABLED = 'volodka_music_enabled';

function lsGetPercent(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) / 100 : fallback / 100;
  } catch {
    return fallback / 100;
  }
}

function lsGetBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return raw === 'true';
  } catch {
    return fallback;
  }
}

/** Read persisted settings (percent sliders → 0–1). */
export function readAudioSettings(): AudioSettingsSnapshot {
  return {
    musicVolume: lsGetPercent(LS_MUSIC, 70),
    sfxVolume: lsGetPercent(LS_SFX, 80),
    ambientVolume: lsGetPercent(LS_AMBIENT, 60),
    musicEnabled: lsGetBool(LS_MUSIC_ENABLED, true),
  };
}

/** Apply snapshot to all engines without persisting. */
export function applyAudioSettings(snapshot?: AudioSettingsSnapshot): AudioSettingsSnapshot {
  const s = snapshot ?? readAudioSettings();
  musicEngine.setVolume(s.musicVolume);
  audioEngine.setVolume(s.sfxVolume);
  ambientEngine.setVolume(s.ambientVolume);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUDIO_SETTINGS_CHANGED, { detail: s }));
  }
  return s;
}

/** Persist one slider value (0–100) and re-apply. */
export function persistAndApplyVolume(
  key: 'music' | 'sfx' | 'ambient',
  percent: number,
): void {
  const clamped = Math.max(0, Math.min(100, percent));
  const lsKey =
    key === 'music' ? LS_MUSIC : key === 'sfx' ? LS_SFX : LS_AMBIENT;
  try {
    localStorage.setItem(lsKey, String(clamped));
  } catch {
    /* ignore quota */
  }
  applyAudioSettings();
}
