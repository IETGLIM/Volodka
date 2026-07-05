import { useEffect, useMemo, useState } from 'react';
import { clearSessionAutoResolvedTier, getSessionAutoResolvedTier } from '@/engine/graphics/autoQualitySession';
import {
  dispatchQualityGpuCleanup,
  dispatchQualityPresetChanged,
  QUALITY_PRESET_CHANGED,
  QUALITY_GFX_PRESSURE_CHANGED,
  readQualityPresetId,
  writeQualityPresetId,
  type QualityPresetChangedDetail,
  type QualityGfxPressureChangedDetail,
  type GfxPressureLevel,
} from '@/engine/graphics/graphicsSettingsStorage';
import {
  resolveQualityPreset,
  type QualityPreset,
  type QualityPresetId,
} from '@/engine/graphics/qualityPresets';
import { getGfxPressure } from '@/engine/graphics/adaptiveQualityBridge';

export interface GraphicsQualityState {
  selectedPreset: QualityPresetId;
  preset: QualityPreset;
  /** Back-compat alias used across weather/postfx systems */
  visualLite: boolean;
  setPreset: (id: QualityPresetId) => void;
}

/**
 * Unified graphics quality — replaces ad-hoc visualLite heuristics.
 *
 * [roadmap:GFX-03] Now subscribes to QUALITY_GFX_PRESSURE_CHANGED and passes
 * the current pressure level to resolveQualityPreset. This activates the
 * previously-dead applyGfxPressureToPreset path: under memory pressure the
 * preset's effectsScale is reduced 0.75×; under critical pressure (leak)
 * postProcessing is disabled and effectsScale halved.
 */
export function useGraphicsQuality(): GraphicsQualityState {
  const [selectedPreset, setSelectedPreset] = useState<QualityPresetId>(readQualityPresetId);
  const [autoRuntimeTier, setAutoRuntimeTier] = useState<
    Exclude<QualityPresetId, 'auto'> | null
  >(getSessionAutoResolvedTier);
  const [viewport, setViewport] = useState({ width: 1920, dpr: 1 });
  const [gfxPressure, setGfxPressure] = useState<GfxPressureLevel>(getGfxPressure);

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

  // [roadmap:GFX-03] Listen for GPU pressure changes from adaptiveQualityBridge.
  useEffect(() => {
    const onPressureChanged = (e: Event) => {
      const detail = (e as CustomEvent<QualityGfxPressureChangedDetail>).detail;
      if (detail?.pressure) setGfxPressure(detail.pressure);
    };
    window.addEventListener(QUALITY_GFX_PRESSURE_CHANGED, onPressureChanged);
    return () => window.removeEventListener(QUALITY_GFX_PRESSURE_CHANGED, onPressureChanged);
  }, []);

  const preset = useMemo(
    () => resolveQualityPreset(
      selectedPreset,
      viewport.width,
      viewport.dpr,
      selectedPreset === 'auto' ? autoRuntimeTier : null,
      gfxPressure,
    ),
    [selectedPreset, viewport.width, viewport.dpr, autoRuntimeTier, gfxPressure],
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
