import { describe, expect, it } from 'vitest';
import {
  QUALITY_PRESETS,
  formatQualityPresetDetailRu,
} from './qualityPresets';

describe('formatQualityPresetDetailRu', () => {
  it('omits GLB hint on low tier', () => {
    const detail = formatQualityPresetDetailRu('low', QUALITY_PRESETS.low);
    expect(detail).not.toContain('GLB');
    expect(detail).toContain('Низкое');
  });

  it('shows GLB hint from medium upward', () => {
    const detail = formatQualityPresetDetailRu('medium', QUALITY_PRESETS.medium);
    expect(detail).toContain('3D-модели (GLB): от пресета «Среднее»');
  });

  it('shows wet reflections on explicit ultra', () => {
    const detail = formatQualityPresetDetailRu('ultra', QUALITY_PRESETS.ultra);
    expect(detail).toContain('Мокрые отражения на улице');
    expect(detail).not.toContain('выберите');
  });

  it('nudges auto→ultra users to pick explicit ultra for reflector', () => {
    const detail = formatQualityPresetDetailRu('auto', QUALITY_PRESETS.ultra);
    expect(detail).toContain('Мокрые отражения: выберите пресет «Ультра»');
  });

  it('does not show reflector hint for auto resolved to high', () => {
    const detail = formatQualityPresetDetailRu('auto', QUALITY_PRESETS.high);
    expect(detail).not.toContain('Мокрые отражения');
  });
});
