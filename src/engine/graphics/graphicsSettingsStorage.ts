import {
  GRAPHICS_SETTINGS_KEY,
  type QualityPresetId,
} from './qualityPresets';

export function readQualityPresetId(): QualityPresetId {
  if (typeof window === 'undefined') return 'auto';
  const raw = localStorage.getItem(GRAPHICS_SETTINGS_KEY);
  if (raw === 'low' || raw === 'medium' || raw === 'high' || raw === 'ultra' || raw === 'auto') {
    return raw;
  }
  return 'auto';
}

export function writeQualityPresetId(id: QualityPresetId): void {
  localStorage.setItem(GRAPHICS_SETTINGS_KEY, id);
}

/** Fired on window when preset changes (SettingsPanel, DevPanel). */
export const QUALITY_PRESET_CHANGED = 'volodka:quality-preset-changed';

export function dispatchQualityPresetChanged(id: QualityPresetId): void {
  window.dispatchEvent(new CustomEvent(QUALITY_PRESET_CHANGED, { detail: { id } }));
}
