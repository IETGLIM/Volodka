import { useEffect, useState } from 'react';
import {
  dispatchQualityGpuCleanup,
  dispatchQualityPresetChanged,
  QUALITY_PRESET_CHANGED,
  readQualityPresetId,
  writeQualityPresetId,
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
      const detail = (e as CustomEvent<{ id: QualityPresetId }>).detail;
      if (detail?.id) setSelectedPreset(detail.id);
    };
    window.addEventListener(QUALITY_PRESET_CHANGED, onChanged);
    return () => window.removeEventListener(QUALITY_PRESET_CHANGED, onChanged);
  }, []);

  const preset = resolveQualityPreset(selectedPreset, viewport.width, viewport.dpr);

  const setPreset = (id: QualityPresetId) => {
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
