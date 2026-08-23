/* Юнит-тесты чистой логики режима mode=whisper (/api/matrix-quote).
 * «Шёпот города»: тревожный, от первого лица, СТРОГО без насилия.
 */

import { describe, expect, it } from 'vitest';
import {
  WHISPER_FALLBACKS,
  WHISPER_MAX_LENGTH,
  buildWhisperSystemPrompt,
  pickWhisperFallback,
  sanitizeWhisper,
} from './matrixWhisperLogic';

const VIOLENCE_MARKERS = ['кров', 'убит', 'убий', 'труп', 'мертв', 'мёртв', 'расстрел', 'погон', 'нож', 'стреля'] as const;

describe('WHISPER_FALLBACKS', () => {
  it('ровно 10 уникальных шёпотов в лимите длины', () => {
    expect(WHISPER_FALLBACKS).toHaveLength(10);
    expect(new Set(WHISPER_FALLBACKS).size).toBe(10);
    for (const whisper of WHISPER_FALLBACKS) {
      expect(whisper.length).toBeGreaterThan(0);
      expect(whisper.length).toBeLessThanOrEqual(140);
    }
  });

  it('ноль насилия — только атмосферная тревога', () => {
    for (const whisper of WHISPER_FALLBACKS) {
      const lower = whisper.toLowerCase();
      for (const marker of VIOLENCE_MARKERS) {
        expect(lower, `«${whisper}» не должен содержать «${marker}»`).not.toContain(marker);
      }
    }
  });

  it('шёпоты адресованы игроку — обращение на «ты»', () => {
    const withYou = WHISPER_FALLBACKS.filter((w) => /тебя|твоё|твои|твой|ты/i.test(w)).length;
    expect(withYou).toBeGreaterThanOrEqual(6);
  });
});

describe('pickWhisperFallback', () => {
  it('детерминирован при инжектном random и совместим с CacheEntry', () => {
    const entry = pickWhisperFallback(1234, () => 0.07);
    expect(entry.quote).toBe(WHISPER_FALLBACKS[0]);
    expect(entry.model).toBe('fallback-static');
    expect(entry.generatedAt).toBe(1234);
  });

  it('крайние значения random не выпадают из диапазона', () => {
    expect(pickWhisperFallback(0, () => 0).quote).toBe(WHISPER_FALLBACKS[0]);
    expect(pickWhisperFallback(0, () => 0.999999).quote).toBe(WHISPER_FALLBACKS[9]);
  });
});

describe('buildWhisperSystemPrompt', () => {
  it('включает контекст сцены, кармы, акта и тему', () => {
    const prompt = buildWhisperSystemPrompt('rooftop', -20, 6, 'потеря');
    expect(prompt).toContain('rooftop');
    expect(prompt).toContain('-20');
    expect(prompt).toContain('акт 6');
    expect(prompt).toContain('потеря');
  });

  it('без темы — без тематической подсказки', () => {
    const prompt = buildWhisperSystemPrompt('cafe', 0, 1, null);
    expect(prompt).not.toContain('Тематический акцент');
  });

  it('требует отсутствия насилия прямо в промпте', () => {
    const prompt = buildWhisperSystemPrompt('s', 0, 1, null);
    expect(prompt).toContain('СТРОГО БЕЗ насилия');
  });

  it('детерминирован для одинакового контекста', () => {
    expect(buildWhisperSystemPrompt('s', 5, 2, 'выбор')).toBe(buildWhisperSystemPrompt('s', 5, 2, 'выбор'));
  });
});

describe('sanitizeWhisper', () => {
  it('схлопывает переводы строк в одну строку', () => {
    expect(sanitizeWhisper('Город моргнул.\nТы заметил?')).toBe('Город моргнул. Ты заметил?');
  });

  it('снимает оборачивающие кавычки и префикс «Шёпот:»', () => {
    expect(sanitizeWhisper('«Витрины помнят каждое отражение»')).toBe('Витрины помнят каждое отражение');
    expect(sanitizeWhisper('Шёпот: дверь была заперта')).toBe('дверь была заперта');
    expect(sanitizeWhisper('whisper: тень медленнее')).toBe('тень медленнее');
  });

  it('режет до лимита по границе слова с многоточием', () => {
    const long = 'шёпот '.repeat(80);
    const res = sanitizeWhisper(long);
    expect(res.length).toBeLessThanOrEqual(WHISPER_MAX_LENGTH);
    expect(res.endsWith('…')).toBe(true);
    expect(res.slice(0, -1)).toMatch(/[а-яё]$/i);
  });

  it('не трогает короткие валидные шёпоты', () => {
    expect(sanitizeWhisper('Город моргнул. Ты заметил?')).toBe('Город моргнул. Ты заметил?');
  });
});
