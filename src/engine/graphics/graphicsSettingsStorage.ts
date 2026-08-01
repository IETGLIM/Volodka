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

/** Fired before preset listeners re-render — texture/GLTF caches evict stale GPU resources. */
export const QUALITY_GPU_CLEANUP = 'volodka:quality-gpu-cleanup';

export function dispatchQualityGpuCleanup(id: QualityPresetId): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(QUALITY_GPU_CLEANUP, { detail: { id } }));
}

export interface QualityPresetChangedDetail {
  id: QualityPresetId;
  /** Session runtime tier when `id` is `auto` (adaptive degrade). */
  autoRuntimeTier?: Exclude<QualityPresetId, 'auto'>;
  /** Session forced concrete tier without rewriting saved preference. */
  sessionForcedTier?: Exclude<QualityPresetId, 'auto'>;
}

export function dispatchQualityPresetChanged(
  id: QualityPresetId,
  extra?: Pick<QualityPresetChangedDetail, 'autoRuntimeTier' | 'sessionForcedTier'>,
): void {
  window.dispatchEvent(
    new CustomEvent<QualityPresetChangedDetail>(QUALITY_PRESET_CHANGED, {
      detail: { id, ...extra },
    }),
  );
}
