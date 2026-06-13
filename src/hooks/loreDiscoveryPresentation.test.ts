import { describe, expect, it } from 'vitest';
import {
  getLoreToastDurationMs,
  getLoreToastSubtitle,
  parseLoreRarity,
} from '@/hooks/loreDiscoveryPresentation';

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
});
