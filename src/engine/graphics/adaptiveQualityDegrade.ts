import {
  clearAllSessionQualityOverrides,
  clearSessionForcedPreset,
  getSessionAutoResolvedTier,
  getSessionForcedPreset,
  setSessionAutoResolvedTier,
  setSessionForcedPreset,
} from './autoQualitySession';
import {
  dispatchQualityGpuCleanup,
  dispatchQualityPresetChanged,
  readQualityPresetId,
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

/** Step quality down one tier. Never persists a lower preset — session only. */
export function degradeQualityPresetOneTier(): QualityPresetId | null {
  const current = readQualityPresetId();

  if (current === 'auto') {
    const { width, dpr } = readViewport();
    const bootTier = detectAutoQualityPreset(width, dpr);
    const effective = getSessionAutoResolvedTier() ?? bootTier;
    if (effective === 'low') return null;

    const idx = QUALITY_PRESET_ORDER.indexOf(effective);
    if (idx <= 0) return null;

    const next = QUALITY_PRESET_ORDER[idx - 1]!;
    setSessionAutoResolvedTier(next);
    dispatchQualityGpuCleanup('auto');
    dispatchQualityPresetChanged('auto', { autoRuntimeTier: next });
    return 'auto';
  }

  const effective = getSessionForcedPreset() ?? current;
  if (effective === 'low') return null;

  const idx = QUALITY_PRESET_ORDER.indexOf(effective);
  if (idx <= 0) return null;
  const next = QUALITY_PRESET_ORDER[idx - 1]!;

  setSessionForcedPreset(next);
  dispatchQualityGpuCleanup(next);
  dispatchQualityPresetChanged(current, { sessionForcedTier: next });
  return next;
}

/** Step quality up one tier. Session override only for concrete presets. */
export function upgradeQualityPresetOneTier(): QualityPresetId | null {
  const current = readQualityPresetId();

  if (current === 'auto') {
    const { width, dpr } = readViewport();
    const bootTier = detectAutoQualityPreset(width, dpr);
    const effective = getSessionAutoResolvedTier() ?? bootTier;
    if (effective === 'ultra') return null;

    const idx = QUALITY_PRESET_ORDER.indexOf(effective);
    if (idx < 0 || idx >= QUALITY_PRESET_ORDER.length - 1) return null;

    const next = QUALITY_PRESET_ORDER[idx + 1]!;
    setSessionAutoResolvedTier(next);
    dispatchQualityGpuCleanup('auto');
    dispatchQualityPresetChanged('auto', { autoRuntimeTier: next });
    return 'auto';
  }

  const effective = getSessionForcedPreset() ?? current;
  if (effective === 'ultra') return null;

  const idx = QUALITY_PRESET_ORDER.indexOf(effective);
  if (idx < 0 || idx >= QUALITY_PRESET_ORDER.length - 1) return null;
  const next = QUALITY_PRESET_ORDER[idx + 1]!;

  if (next === current) {
    clearSessionForcedPreset();
    dispatchQualityGpuCleanup(next);
    dispatchQualityPresetChanged(current);
  } else {
    setSessionForcedPreset(next);
    dispatchQualityGpuCleanup(next);
    dispatchQualityPresetChanged(current, { sessionForcedTier: next });
  }
  return next;
}

/** Clear session adaptive overrides when user picks a preset manually. */
export function resetAutoQualityDegradeSession(): void {
  clearAllSessionQualityOverrides();
}
