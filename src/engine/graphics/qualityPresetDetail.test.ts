import { describe, expect, it } from 'vitest';
import {
  QUALITY_PRESETS,
  formatQualityPresetDetailRu,
} from './qualityPresets';

describe('formatQualityPresetDetailRu', () => {
  it('omits GLB hint on low tier', () => {
    const detail = formatQualityPresetDetailRu('low', QUALITY_PRESETS.low);
    expect(detail).not.toContain('Уникальные аватары');
    expect(detail).toContain('Низкое');
  });

  it('shows GLB hint from medium upward', () => {
    const detail = formatQualityPresetDetailRu('medium', QUALITY_PRESETS.medium);
    expect(detail).toContain('Уникальные аватары (RPM)');
  });

  it('shows wet reflections on explicit high and ultra', () => {
    expect(formatQualityPresetDetailRu('high', QUALITY_PRESETS.high)).toContain(
      'Мокрые отражения на улице',
    );
    const ultra = formatQualityPresetDetailRu('ultra', QUALITY_PRESETS.ultra);
    expect(ultra).toContain('Мокрые отражения на улице');
    expect(ultra).not.toContain('выберите');
  });

  it('nudges auto→high/ultra users to pick an explicit preset for reflector', () => {
    expect(formatQualityPresetDetailRu('auto', QUALITY_PRESETS.ultra)).toContain(
      'Мокрые отражения: выберите пресет «Высокое» или выше',
    );
    expect(formatQualityPresetDetailRu('auto', QUALITY_PRESETS.high)).toContain(
      'Мокрые отражения: выберите пресет «Высокое» или выше',
    );
  });

  it('does not show reflector hint for auto resolved to medium', () => {
    const detail = formatQualityPresetDetailRu('auto', QUALITY_PRESETS.medium);
    expect(detail).not.toContain('Мокрые отражения');
  });
});
