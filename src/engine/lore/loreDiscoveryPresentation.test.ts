import { describe, expect, it } from 'vitest';
import {
  buildLoreToastAnnouncement,
  buildLoreToastDescription,
  getLoreToastDurationMs,
  getLoreToastSubtitle,
  parseLoreRarity,
} from '@/engine/lore/loreDiscoveryPresentation';

describe('loreDiscoveryPresentation', () => {
  it('parseLoreRarity falls back to common', () => {
    expect(parseLoreRarity('legendary')).toBe('legendary');
    expect(parseLoreRarity('unknown')).toBe('common');
  });

  it('getLoreToastDurationMs scales with rarity', () => {
    expect(getLoreToastDurationMs('common')).toBeLessThan(getLoreToastDurationMs('rare'));
    expect(getLoreToastDurationMs('rare')).toBeLessThan(getLoreToastDurationMs('legendary'));
  });

  it('getLoreToastSubtitle includes category and writing bonus for rare entries', () => {
    expect(getLoreToastSubtitle('common', 'history')).toContain('История');
    expect(getLoreToastSubtitle('rare', 'factions')).toContain('Письмо +1');
    expect(getLoreToastSubtitle('common')).toContain('кодексе');
  });

  it('builds accessible announcement with title and subtitle', () => {
    const text = buildLoreToastAnnouncement({
      loreId: 'l1',
      title: 'Тайна',
      rarity: 'rare',
    });
    expect(text).toContain('Тайна');
    expect(text).toContain('кодекс');
  });

  it('buildLoreToastDescription includes hint', () => {
    expect(buildLoreToastDescription({
      loreId: 'l1',
      title: 'X',
      rarity: 'common',
    })).toContain('K');
  });
});
