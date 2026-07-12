import { describe, expect, it } from 'vitest';
import {
  formatEventPayloadPreview,
  truncateUnicodeText,
} from './formatEventPayloadPreview';

describe('truncateUnicodeText', () => {
  it('preserves Cyrillic when truncating', () => {
    const text = 'Прими задание: Банковский Перевод';
    expect(truncateUnicodeText(text, 20)).toBe('Прими задание: Банк…');
  });

  it('does not split emoji surrogate pairs', () => {
    const text = '🌆 Голос Улиц шепчет секреты';
    const truncated = truncateUnicodeText(text, 12);
    expect(truncated.endsWith('…')).toBe(true);
    expect(truncated).not.toContain('\uFFFD');
    expect(truncated.startsWith('🌆')).toBe(true);
  });
});

describe('formatEventPayloadPreview', () => {
  it('shows objectiveText directly for guidance payloads', () => {
    const preview = formatEventPayloadPreview({
      objectiveText: 'Прими ... задание: Банковский Перевод',
      objectiveType: 'complete_quest',
      targetId: 'bank_transfer',
      urgency: 'recommended',
      actNumber: 1,
      chapterTitle: 'Глава 1',
    });
    expect(preview.startsWith('objectiveText: Прими')).toBe(true);
    expect(preview).toContain('Банковский');
    expect(preview).not.toContain('\\u');
  });

  it('shows short exploration messages intact', () => {
    const preview = formatEventPayloadPreview({ text: 'Привет. Присядешь?' });
    expect(preview).toBe('text: Привет. Присядешь?');
  });

  it('avoids naive JSON slice corruption on long escaped strings', () => {
    const escapedJson = JSON.stringify({
      objectiveText: 'Прими ... задание: Банковский Перевод',
    }).replace(/[\u0080-\uffff]/g, (ch) =>
      `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`,
    );
    const naive = escapedJson.length > 50 ? `${escapedJson.slice(0, 50)}…` : escapedJson;
    expect(naive).toContain('\\u');

    const preview = formatEventPayloadPreview({
      objectiveText: 'Прими ... задание: Банковский Перевод',
    });
    expect(preview).not.toContain('\\u');
    expect(preview.startsWith('objectiveText: Прими')).toBe(true);
  });
});
