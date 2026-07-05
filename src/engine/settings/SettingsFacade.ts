/**
 * Unified settings facade — single read/apply entry for preferences.
 * Wraps audio, visual, accessibility, and graphics modules without duplicating keys.
 */

import { applyAudioSettings, readAudioSettings, type AudioSettingsSnapshot } from '@/engine/audio/AudioSettings';
import {
  applyVisualSettings,
  readVisualSettings,
  type VisualSettingsSnapshot,
} from '@/engine/visualSettings';
import {
  getAccessibilityManager,
  readAccessibilitySettingsFromStorage,
  applyAccessibilitySettings,
  type AccessibilitySettingsSnapshot,
} from '@/engine/accessibility/accessibilitySettings';
import { readQualityPresetId } from '@/engine/graphics/graphicsSettingsStorage';
import type { QualityPresetId } from '@/engine/graphics/qualityPresets';
import { readCombatDifficulty, type CombatDifficultyId } from '@/engine/combat/combatDifficulty';

export interface GameSettingsSnapshot {
  audio: AudioSettingsSnapshot;
  visual: VisualSettingsSnapshot;
  accessibility: AccessibilitySettingsSnapshot;
  graphicsQuality: QualityPresetId;
  combatDifficulty: CombatDifficultyId;
}

export function readGameSettings(): GameSettingsSnapshot {
  const storage = typeof localStorage !== 'undefined' ? localStorage : null;
  return {
    audio: readAudioSettings(),
    visual: readVisualSettings(),
    accessibility: storage
      ? readAccessibilitySettingsFromStorage(storage)
      : getAccessibilityManager().getSettings(),
    graphicsQuality: readQualityPresetId(),
    combatDifficulty: readCombatDifficulty(),
  };
}

/** Apply persisted settings to runtime engines (boot + after load). */
export function applyGameSettings(snapshot?: GameSettingsSnapshot): GameSettingsSnapshot {
  const resolved = snapshot ?? readGameSettings();
  applyAudioSettings(resolved.audio);
  applyVisualSettings();
  applyAccessibilitySettings();
  return resolved;
}

/** Sync music fields from save payload into audio engines + LS. */
export function syncMusicFromSave(musicEnabled: boolean, musicVolumePercent: number): void {
  const percent = Math.max(0, Math.min(100, musicVolumePercent));
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('volodka_music_enabled', String(musicEnabled));
      localStorage.setItem('volodka_music_volume', String(percent));
    } catch {
      // ignore quota errors
    }
  }
  applyAudioSettings();
}
