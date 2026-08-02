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
    expect(detail).toContain('Только contact-blob');
  });

  it('shows GLB hint from medium upward', () => {
    const detail = formatQualityPresetDetailRu('medium', QUALITY_PRESETS.medium);
    expect(detail).toContain('Уникальные аватары (RPM)');
    expect(detail).not.toContain('от «Среднее»');
    expect(detail).toContain('Карты теней + мягкий blob');
    expect(detail).toContain('Базовые мокрые отражения');
    expect(detail).not.toContain('MeshPhysical');
  });

  it('describes full shadow maps on high', () => {
    expect(formatQualityPresetDetailRu('high', QUALITY_PRESETS.high)).toContain(
      'Полные карты теней',
    );
  });

  it('shows basic planar reflections + MeshPhysical accents on explicit high', () => {
    const high = formatQualityPresetDetailRu('high', QUALITY_PRESETS.high);
    expect(high).toContain('Планарные отражения');
    expect(high).toContain('MeshPhysical акценты');
    expect(high).not.toContain('SSR');
    expect(high).not.toContain('выберите');
  });

  it('advertises the ultra-only SSR wet-street tier (1024) on ultra', () => {
    const ultra = formatQualityPresetDetailRu('ultra', QUALITY_PRESETS.ultra);
    expect(ultra).toContain('SSR-отражения мокрых улиц (1024)');
    expect(ultra).toContain('MeshPhysical акценты');
    expect(ultra).not.toContain('Базовые мокрые');
    expect(ultra).not.toContain('выберите');
  });

  it('nudges auto→medium/high/ultra users to pick an explicit preset for reflector', () => {
    expect(formatQualityPresetDetailRu('auto', QUALITY_PRESETS.ultra)).toContain(
      'Мокрые отражения: выберите пресет «Среднее» или выше',
    );
    expect(formatQualityPresetDetailRu('auto', QUALITY_PRESETS.high)).toContain(
      'Мокрые отражения: выберите пресет «Среднее» или выше',
    );
    expect(formatQualityPresetDetailRu('auto', QUALITY_PRESETS.medium)).toContain(
      'Мокрые отражения: выберите пресет «Среднее» или выше',
    );
  });

  it('does not show reflector hint for auto resolved to low', () => {
    const detail = formatQualityPresetDetailRu('auto', QUALITY_PRESETS.low);
    expect(detail).not.toContain('Мокрые отражения');
  });
});
