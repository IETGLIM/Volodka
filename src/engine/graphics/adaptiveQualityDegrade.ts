import {
  clearSessionAutoResolvedTier,
  getSessionAutoResolvedTier,
  setSessionAutoResolvedTier,
} from './autoQualitySession';
import {
  dispatchQualityGpuCleanup,
  dispatchQualityPresetChanged,
  readQualityPresetId,
  writeQualityPresetId,
} from './graphicsSettingsStorage';
import {
  QUALITY_PRESET_ORDER,
  detectAutoQualityPreset,
  type QualityPresetId,
} from './qualityPresets';

function readViewport(): { width: number; dpr: number } {
  if (typeof window === 'undefined') return { width: 1920, dpr: 1 };
  return {
    width: window.innerWidth,
    dpr: window.devicePixelRatio ?? 1,
  };
}

/** Step quality preset down one tier (auto keeps selection, ultra → high, …). */
export function degradeQualityPresetOneTier(): QualityPresetId | null {
  const current = readQualityPresetId();

  if (current === 'auto') {
    const { width, dpr } = readViewport();
    const bootTier = detectAutoQualityPreset(width, dpr);
    const effective = getSessionAutoResolvedTier() ?? bootTier;
    if (effective === 'low') return null;

    const idx = QUALITY_PRESET_ORDER.indexOf(effective);
    if (idx <= 0) return null;

    const next = QUALITY_PRESET_ORDER[idx - 1];
    setSessionAutoResolvedTier(next);
    dispatchQualityGpuCleanup('auto');
    dispatchQualityPresetChanged('auto', { autoRuntimeTier: next });
    return 'auto';
  }

  if (current === 'low') return null;

  const idx = QUALITY_PRESET_ORDER.indexOf(current);
  if (idx <= 0) return null;
  const next = QUALITY_PRESET_ORDER[idx - 1];

  writeQualityPresetId(next);
  dispatchQualityGpuCleanup(next);
  dispatchQualityPresetChanged(next);
  return next;
}

/** Step quality preset up one tier (auto session cap, low → medium, …). */
export function upgradeQualityPresetOneTier(): QualityPresetId | null {
  const current = readQualityPresetId();

  if (current === 'auto') {
    const { width, dpr } = readViewport();
    const bootTier = detectAutoQualityPreset(width, dpr);
    const effective = getSessionAutoResolvedTier() ?? bootTier;
    if (effective === 'ultra') return null;

    const idx = QUALITY_PRESET_ORDER.indexOf(effective);
    if (idx < 0 || idx >= QUALITY_PRESET_ORDER.length - 1) return null;

    const next = QUALITY_PRESET_ORDER[idx + 1];
    setSessionAutoResolvedTier(next);
    dispatchQualityGpuCleanup('auto');
    dispatchQualityPresetChanged('auto', { autoRuntimeTier: next });
    return 'auto';
  }

  if (current === 'ultra') return null;

  const idx = QUALITY_PRESET_ORDER.indexOf(current);
  if (idx < 0 || idx >= QUALITY_PRESET_ORDER.length - 1) return null;
  const next = QUALITY_PRESET_ORDER[idx + 1];

  writeQualityPresetId(next);
  dispatchQualityGpuCleanup(next);
  dispatchQualityPresetChanged(next);
  return next;
}

/** Clear session auto cap when user picks a preset manually. */
export function resetAutoQualityDegradeSession(): void {
  clearSessionAutoResolvedTier();
}
