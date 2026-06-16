import { describe, expect, it } from 'vitest';
import { t } from '@/i18n';

describe('i18n', () => {
  it('resolves ambient keys from ru catalog', () => {
    expect(t('ambient.cafe.label', 'fallback')).toBe('Кафе');
  });

  it('falls back when key is missing', () => {
    expect(t('missing.key', 'Запасной текст')).toBe('Запасной текст');
  });
});
