import { useEffect, useMemo, useState } from 'react';
import {
  clearAllSessionQualityOverrides,
  getSessionAutoResolvedTier,
  getSessionForcedPreset,
} from '@/engine/graphics/autoQualitySession';
import {
  dispatchQualityGpuCleanup,
  dispatchQualityPresetChanged,
  QUALITY_PRESET_CHANGED,
  readQualityPresetId,
  writeQualityPresetId,
  type QualityPresetChangedDetail,
} from '@/engine/graphics/graphicsSettingsStorage';
import {
  resolveQualityPreset,
  type QualityPreset,
  type QualityPresetId,
} from '@/engine/graphics/qualityPresets';

export interface GraphicsQualityState {
  selectedPreset: QualityPresetId;
  preset: QualityPreset;
  /** Back-compat alias used across weather/postfx systems */
  visualLite: boolean;
  setPreset: (id: QualityPresetId) => void;
}

/** Unified graphics quality — replaces ad-hoc visualLite heuristics. */
export function useGraphicsQuality(): GraphicsQualityState {
  const [selectedPreset, setSelectedPreset] = useState<QualityPresetId>(readQualityPresetId);
  const [autoRuntimeTier, setAutoRuntimeTier] = useState<
    Exclude<QualityPresetId, 'auto'> | null
  >(getSessionAutoResolvedTier);
  const [sessionForcedTier, setSessionForcedTier] = useState<
    Exclude<QualityPresetId, 'auto'> | null
  >(getSessionForcedPreset);
  const [viewport, setViewport] = useState({ width: 1920, dpr: 1 });

  useEffect(() => {
    let rafId: number | null = null;

    const sync = () => {
      rafId = null;
      const width = Math.round(window.visualViewport?.width ?? window.innerWidth);
      const dpr = window.devicePixelRatio ?? 1;
      setViewport((current) => {
        if (current.width === width && current.dpr === dpr) return current;
        return { width, dpr };
      });
    };

    const scheduleSync = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(sync);
    };

    scheduleSync();
    window.addEventListener('resize', scheduleSync);
    window.addEventListener('orientationchange', scheduleSync);
    window.visualViewport?.addEventListener('resize', scheduleSync);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('orientationchange', scheduleSync);
      window.visualViewport?.removeEventListener('resize', scheduleSync);
    };
  }, []);

  useEffect(() => {
    const onChanged = (e: Event) => {
      const detail = (e as CustomEvent<QualityPresetChangedDetail>).detail;
      if (detail?.id) setSelectedPreset(detail.id);
      if (detail?.id === 'auto' && detail.autoRuntimeTier) {
        setAutoRuntimeTier(detail.autoRuntimeTier);
      }
      if (detail?.sessionForcedTier) {
        setSessionForcedTier(detail.sessionForcedTier);
      } else if (detail?.id && detail.id !== 'auto' && !detail.sessionForcedTier) {
        // Manual pick or climb back to saved preference — drop forced override.
        setSessionForcedTier(getSessionForcedPreset());
      }
    };
    window.addEventListener(QUALITY_PRESET_CHANGED, onChanged);
    return () => window.removeEventListener(QUALITY_PRESET_CHANGED, onChanged);
  }, []);

  const resolveId: QualityPresetId =
    selectedPreset === 'auto'
      ? 'auto'
      : (sessionForcedTier ?? selectedPreset);

  const preset = useMemo(
    () =>
      resolveQualityPreset(
        resolveId,
        viewport.width,
        viewport.dpr,
        selectedPreset === 'auto' ? autoRuntimeTier : null,
      ),
    [resolveId, selectedPreset, viewport.width, viewport.dpr, autoRuntimeTier],
  );

  const setPreset = (id: QualityPresetId) => {
    clearAllSessionQualityOverrides();
    setAutoRuntimeTier(null);
    setSessionForcedTier(null);
    writeQualityPresetId(id);
    dispatchQualityGpuCleanup(id);
    setSelectedPreset(id);
    dispatchQualityPresetChanged(id);
  };

  return {
    selectedPreset,
    preset,
    visualLite: preset.visualLite,
    setPreset,
  };
}
