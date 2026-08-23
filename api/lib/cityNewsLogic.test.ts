/* Юнит-тесты чистой логики «городского тикера» (/api/city-news).
 * Edge-функцию с `export const config = { runtime: 'edge' }` под Vitest/Node
 * импортировать нельзя, поэтому тестируем выделенный модуль api/lib/.
 */

import { describe, expect, it } from 'vitest';
import {
  CITY_NEWS_FALLBACKS,
  CITY_NEWS_MAX_LENGTH,
  CITY_NEWS_MIN_LENGTH,
  buildCityNewsPrompt,
  cityNewsCacheKey,
  describeCityHour,
  evictCacheEntries,
  isUsableCityNews,
  parseCityNewsParams,
  pickCityNewsFallback,
  sanitizeCityNews,
} from './cityNewsLogic';

// Деловое требование режима: 0 насилия в фолбэках и промптах.
const VIOLENCE_MARKERS = ['кров', 'убит', 'убий', 'труп', 'мертв', 'мёртв', 'расстрел', 'погон', 'нож', 'стреля'] as const;

function assertNoViolence(texts: readonly string[]): void {
  for (const text of texts) {
    const lower = text.toLowerCase();
    for (const marker of VIOLENCE_MARKERS) {
      expect(lower, `«${text}» не должен содержать «${marker}»`).not.toContain(marker);
    }
  }
}

describe('parseCityNewsParams', () => {
  it('принимает корректные параметры как есть', () => {
    const res = parseCityNewsParams({ scene: 'volodka_room', act: '3', hour: '23' });
    expect(res).toEqual({ ok: true, value: { scene: 'volodka_room', act: 3, hour: 23 } });
  });

  it('требует scene', () => {
    expect(parseCityNewsParams({ scene: null, act: '1', hour: '2' })).toEqual({
      ok: false,
      error: 'missing_param',
      param: 'scene',
    });
    expect(parseCityNewsParams({ scene: '   ', act: '1', hour: '2' }).ok).toBe(false);
  });

  it('режет scene до 64 символов и тримит', () => {
    const long = 'a'.repeat(100);
    const res = parseCityNewsParams({ scene: `  ${long}  `, act: '1', hour: '2' });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.scene).toBe('a'.repeat(64));
  });

  it('отвергает act вне 1..7 и нечисловой (как matrix-quote)', () => {
    expect(parseCityNewsParams({ scene: 's', act: '0', hour: '2' })).toEqual({
      ok: false,
      error: 'invalid_param',
      param: 'act',
      hint: '1..7',
    });
    expect(parseCityNewsParams({ scene: 's', act: '8', hour: '2' }).ok).toBe(false);
    expect(parseCityNewsParams({ scene: 's', act: 'abc', hour: '2' }).ok).toBe(false);
    expect(parseCityNewsParams({ scene: 's', act: null, hour: '2' }).ok).toBe(false);
  });

  it('клампит act внутри диапазона дробных значений', () => {
    const res = parseCityNewsParams({ scene: 's', act: '3.9', hour: '2' });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.act).toBe(3);
  });

  it('клампит hour в 0..23 и отбрасывает дробную часть', () => {
    const midnight = parseCityNewsParams({ scene: 's', act: '1', hour: '-5' });
    expect(midnight.ok && midnight.value.hour).toBe(0);
    const late = parseCityNewsParams({ scene: 's', act: '1', hour: '25' });
    expect(late.ok && late.value.hour).toBe(23);
    const frac = parseCityNewsParams({ scene: 's', act: '1', hour: '8.9' });
    expect(frac.ok && frac.value.hour).toBe(8);
  });

  it('требует числовой hour (null считается нулём — паритет с matrix-quote/karma)', () => {
    expect(parseCityNewsParams({ scene: 's', act: '1', hour: 'ночь' }).ok).toBe(false);
    const midnight = parseCityNewsParams({ scene: 's', act: '1', hour: null });
    expect(midnight.ok).toBe(true);
    if (midnight.ok) expect(midnight.value.hour).toBe(0);
  });
});

describe('cityNewsCacheKey / describeCityHour', () => {
  it('ключ включает акт, сцену и час', () => {
    expect(cityNewsCacheKey({ act: 2, scene: 'cafe', hour: 3 })).toBe('2|cafe|3');
    expect(cityNewsCacheKey({ act: 2, scene: 'cafe', hour: 4 })).not.toBe(cityNewsCacheKey({ act: 2, scene: 'cafe', hour: 3 }));
  });

  it('час суток по границам HUD-календаря', () => {
    expect(describeCityHour(0)).toBe('глубокая ночь');
    expect(describeCityHour(4)).toBe('предрассветье');
    expect(describeCityHour(6)).toBe('утро');
    expect(describeCityHour(10)).toBe('день');
    expect(describeCityHour(18)).toBe('вечер');
    expect(describeCityHour(21)).toBe('ночь');
    expect(describeCityHour(23)).toBe('ночь');
  });
});

describe('buildCityNewsPrompt', () => {
  it('включает контекст акта, сцены, часа и лимит длины', () => {
    const prompt = buildCityNewsPrompt({ act: 5, scene: 'old_docks', hour: 2 });
    expect(prompt).toContain('акт 5');
    expect(prompt).toContain('old_docks');
    expect(prompt).toContain('глубокая ночь');
    expect(prompt).toContain('02:00');
    expect(prompt).toContain(String(CITY_NEWS_MAX_LENGTH));
  });

  it('детерминирован для одинакового контекста', () => {
    const ctx = { act: 1, scene: 'volodka_room', hour: 12 };
    expect(buildCityNewsPrompt(ctx)).toBe(buildCityNewsPrompt(ctx));
  });

  it('запрещает насилие прямо в промпте', () => {
    const prompt = buildCityNewsPrompt({ act: 1, scene: 's', hour: 12 });
    // Запрет упоминает сами слова («без насилия, крови, смерти и погонь») —
    // поэтому denylist-проверка тут не применяется, только факт запрета.
    expect(prompt).toContain('без насилия');
    expect(prompt).toContain('СТРОГО');
  });
});

describe('sanitizeCityNews', () => {
  it('схлопывает переводы строк — тикер однострочный', () => {
    expect(sanitizeCityNews('Первая строка.\nВторая   строка.')).toBe('Первая строка. Вторая строка.');
  });

  it('снимает оборачивающие кавычки и префикс «Новость:»', () => {
    expect(sanitizeCityNews('«В районе снова тишина»')).toBe('В районе снова тишина');
    expect(sanitizeCityNews('"Эфир: фонари погасли"')).toBe('фонари погасли');
    expect(sanitizeCityNews('Новость: метеосводка обновлена')).toBe('метеосводка обновлена');
  });

  it('режет до лимита по границе слова с многоточием', () => {
    const long = 'слово '.repeat(60);
    const res = sanitizeCityNews(long);
    expect(res.length).toBeLessThanOrEqual(CITY_NEWS_MAX_LENGTH);
    expect(res.endsWith('…')).toBe(true);
    // Обрезка не рвёт слово посередине (строка кончается целым словом).
    expect(res.slice(0, -1)).toMatch(/[а-яё]$/i);
  });

  it('не трогает короткие валидные строки', () => {
    expect(sanitizeCityNews('На Косой 12 снова поёт водосток.')).toBe('На Косой 12 снова поёт водосток.');
  });
});

describe('CITY_NEWS_FALLBACKS / pickCityNewsFallback', () => {
  it('ровно 10 уникальных фолбэков, каждый в лимит тикера', () => {
    expect(CITY_NEWS_FALLBACKS).toHaveLength(10);
    expect(new Set(CITY_NEWS_FALLBACKS).size).toBe(10);
    for (const news of CITY_NEWS_FALLBACKS) {
      expect(news.length).toBeGreaterThan(0);
      expect(news.length).toBeLessThanOrEqual(CITY_NEWS_MAX_LENGTH);
    }
  });

  it('фолбэки атмосферные и без насилия', () => {
    assertNoViolence(CITY_NEWS_FALLBACKS);
  });

  it('выбор фолбэка детерминирован при инжектном random', () => {
    const entry = pickCityNewsFallback(1000, () => 0.42);
    expect(entry.news).toBe(CITY_NEWS_FALLBACKS[4]);
    expect(entry.model).toBe('fallback-static');
    expect(entry.generatedAt).toBe(1000);
  });

  it('крайние значения random не выпадают из диапазона', () => {
    expect(pickCityNewsFallback(0, () => 0).news).toBe(CITY_NEWS_FALLBACKS[0]);
    expect(pickCityNewsFallback(0, () => 0.999999).news).toBe(CITY_NEWS_FALLBACKS[9]);
  });
});

describe('isUsableCityNews', () => {
  it('отсекает пустоту и обрывки, пропускает осмысленное', () => {
    expect(isUsableCityNews(null)).toBe(false);
    expect(isUsableCityNews('')).toBe(false);
    expect(isUsableCityNews('   ')).toBe(false);
    expect(isUsableCityNews('Коротко.')).toBe(false); // < CITY_NEWS_MIN_LENGTH
    expect(isUsableCityNews(`${'а'.repeat(CITY_NEWS_MIN_LENGTH)}.`)).toBe(true);
  });
});

describe('evictCacheEntries', () => {
  interface Entry {
    generatedAt: number;
  }

  it('не трогает кеш ниже лимита', () => {
    const cache = new Map<string, Entry>([
      ['a', { generatedAt: 1 }],
      ['b', { generatedAt: 2 }],
    ]);
    expect(evictCacheEntries(cache, 10_000, 1000, 256)).toBe(0);
    expect(cache.size).toBe(2);
  });

  it('сначала удаляет просроченные записи', () => {
    const cache = new Map<string, Entry>([
      ['fresh', { generatedAt: 9500 }],
      ['old1', { generatedAt: 100 }],
      ['old2', { generatedAt: 200 }],
    ]);
    const evicted = evictCacheEntries(cache, 10_000, 1000, 1);
    expect(evicted).toBe(2);
    expect(cache.has('old1')).toBe(false);
    expect(cache.has('old2')).toBe(false);
    expect(cache.has('fresh')).toBe(true);
  });

  it('если просроченных мало — добирает самые старые до лимита', () => {
    const now = 10_000;
    const cache = new Map<string, Entry>([
      ['oldest', { generatedAt: now - 500 }],
      ['middle', { generatedAt: now - 300 }],
      ['newest', { generatedAt: now - 100 }],
    ]);
    const evicted = evictCacheEntries(cache, now, 1000, 1);
    expect(evicted).toBe(2);
    expect(cache.size).toBe(1);
    expect(cache.has('newest')).toBe(true);
    expect(cache.has('oldest')).toBe(false);
  });

  it('гарантирует итоговый размер не выше лимита', () => {
    const now = 10_000;
    const cache = new Map<string, Entry>();
    for (let i = 0; i < 30; i += 1) cache.set(`k${i}`, { generatedAt: now - i });
    evictCacheEntries(cache, now, 1000, 10);
    expect(cache.size).toBe(10);
  });
});
