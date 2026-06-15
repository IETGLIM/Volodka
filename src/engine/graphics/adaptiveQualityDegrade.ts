import {
  dispatchQualityPresetChanged,
  readQualityPresetId,
  writeQualityPresetId,
} from './graphicsSettingsStorage';
import { QUALITY_PRESET_ORDER, type QualityPresetId } from './qualityPresets';

/** Step quality preset down one tier (auto → medium, ultra → high, …). */
export function degradeQualityPresetOneTier(): QualityPresetId | null {
  const current = readQualityPresetId();

  if (current === 'low') return null;

  let next: QualityPresetId;
  if (current === 'auto') {
    next = 'medium';
  } else {
    const idx = QUALITY_PRESET_ORDER.indexOf(current);
    if (idx <= 0) return null;
    next = QUALITY_PRESET_ORDER[idx - 1];
  }

  writeQualityPresetId(next);
  dispatchQualityPresetChanged(next);
  return next;
}
