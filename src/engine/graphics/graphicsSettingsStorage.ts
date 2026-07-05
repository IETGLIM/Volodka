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

/**
 * [roadmap:GFX-03] Fired when GPU memory pressure level changes (none → memory → critical).
 * `useGraphicsQuality` listens and re-resolves preset with applyGfxPressureToPreset.
 * Driven by `adaptiveQualityBridge` based on RuntimeBudgetMonitor memory violations.
 */
export const QUALITY_GFX_PRESSURE_CHANGED = 'volodka:quality-gfx-pressure-changed';

export type GfxPressureLevel = 'none' | 'memory' | 'critical';

export interface QualityGfxPressureChangedDetail {
  pressure: GfxPressureLevel;
}

export function dispatchQualityGfxPressureChanged(pressure: GfxPressureLevel): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<QualityGfxPressureChangedDetail>(QUALITY_GFX_PRESSURE_CHANGED, {
      detail: { pressure },
    }),
  );
}

/**
 * [roadmap:GFX-04] Reason for GPU cleanup — controls eviction aggressiveness.
 * - 'degrade': tier down (adaptive pressure). Surgical eviction — only texture
 *   caches, NOT GLB caches. GLBs are reused across tiers; evicting them during
 *   a memory-pressure hitch forces re-fetch + re-decode on the next frame,
 *   making the hitch WORSE before it gets better.
 * - 'upgrade': tier up (adaptive recovery). Full eviction — new tier may use
 *   different GLB variants (draco → meshopt). User expects a brief hitch.
 * - 'manual': user changed preset in SettingsPanel. Full eviction — explicit
 *   user action, hitch is acceptable.
 */
export type GpuCleanupReason = 'degrade' | 'upgrade' | 'manual';

export interface QualityGpuCleanupDetail {
  id: QualityPresetId;
  reason: GpuCleanupReason;
}

export function dispatchQualityGpuCleanup(id: QualityPresetId, reason: GpuCleanupReason = 'manual'): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<QualityGpuCleanupDetail>(QUALITY_GPU_CLEANUP, { detail: { id, reason } }));
}

export interface QualityPresetChangedDetail {
  id: QualityPresetId;
  /** Session runtime tier when `id` is `auto` (adaptive degrade). */
  autoRuntimeTier?: Exclude<QualityPresetId, 'auto'>;
}

export function dispatchQualityPresetChanged(
  id: QualityPresetId,
  extra?: Pick<QualityPresetChangedDetail, 'autoRuntimeTier'>,
): void {
  window.dispatchEvent(
    new CustomEvent<QualityPresetChangedDetail>(QUALITY_PRESET_CHANGED, {
      detail: { id, ...extra },
    }),
  );
}
