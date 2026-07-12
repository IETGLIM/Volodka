import { useEffect, useMemo, useState } from 'react';
import { clearSessionAutoResolvedTier, getSessionAutoResolvedTier } from '@/engine/graphics/autoQualitySession';
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
  const [viewport, setViewport] = useState({ width: 1920, dpr: 1 });

  useEffect(() => {
    const sync = () => {
      setViewport({
        width: window.innerWidth,
        dpr: window.devicePixelRatio ?? 1,
      });
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  useEffect(() => {
    const onChanged = (e: Event) => {
      const detail = (e as CustomEvent<QualityPresetChangedDetail>).detail;
      if (detail?.id) setSelectedPreset(detail.id);
      if (detail?.id === 'auto' && detail.autoRuntimeTier) {
        setAutoRuntimeTier(detail.autoRuntimeTier);
      }
    };
    window.addEventListener(QUALITY_PRESET_CHANGED, onChanged);
    return () => window.removeEventListener(QUALITY_PRESET_CHANGED, onChanged);
  }, []);

  const preset = useMemo(
    () => resolveQualityPreset(
      selectedPreset,
      viewport.width,
      viewport.dpr,
      selectedPreset === 'auto' ? autoRuntimeTier : null,
    ),
    [selectedPreset, viewport.width, viewport.dpr, autoRuntimeTier],
  );

  const setPreset = (id: QualityPresetId) => {
    clearSessionAutoResolvedTier();
    setAutoRuntimeTier(null);
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
