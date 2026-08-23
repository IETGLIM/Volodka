/* ─── cityNewsLogic — чистая логика «городского тикера» (/api/city-news) ───
 *
 * Всё, что можно протестировать в Vitest без Edge-runtime, живёт здесь:
 * валидация/клампинг параметров, промпт-билдер, санитизация строки тикера,
 * инлайн-фолбэки и вытеснение кеша. Edge-функция (api/city-news.ts)
 * импортирует этот модуль и держит только транспорт (fetch, заголовки,
 * rate-limit) — никакого `export const config` здесь, поэтому модуль
 * запускается под обычным Node.
 */

/** Лимит строки тикера — новость обязана влезать в один проход бегущей строки. */
export const CITY_NEWS_MAX_LENGTH = 140;

/** Минимальная осмысленная длина — короче считается мусорным ответом модели. */
export const CITY_NEWS_MIN_LENGTH = 10;

export interface CityNewsContext {
  act: number;
  scene: string;
  hour: number;
}

export interface CityNewsEntry {
  news: string;
  model: string;
  generatedAt: number;
}

export type CityNewsParamsResult =
  | { ok: true; value: CityNewsContext }
  | { ok: false; error: 'missing_param' | 'invalid_param'; param: string; hint?: string };

/**
 * Валидация query-параметров в стиле matrix-quote: обязательное `scene`,
 * `act` обязан быть конечным числом 1..7 (иначе 400, как у matrix-quote),
 * `hour` — конечное число, клампится в 0..23. Возвращает типизированный
 * результат вместо throw, чтобы edge-функция просто отдала 400.
 */
export function parseCityNewsParams(input: {
  scene: string | null;
  act: string | null;
  hour: string | null;
}): CityNewsParamsResult {
  const scene = (input.scene ?? '').trim().slice(0, 64);
  if (!scene) return { ok: false, error: 'missing_param', param: 'scene' };
  const actNum = Number(input.act);
  if (!Number.isFinite(actNum)) return { ok: false, error: 'missing_param', param: 'act' };
  if (actNum < 1 || actNum > 7) return { ok: false, error: 'invalid_param', param: 'act', hint: '1..7' };
  const hourNum = Number(input.hour);
  if (!Number.isFinite(hourNum)) return { ok: false, error: 'missing_param', param: 'hour' };
  return {
    ok: true,
    value: {
      scene,
      act: Math.max(1, Math.min(7, Math.trunc(actNum))),
      hour: Math.max(0, Math.min(23, Math.trunc(hourNum))),
    },
  };
}

/** Ключ серверного кеша: акт + сцена + час (новость привязана к «выпуску эфира»). */
export function cityNewsCacheKey(ctx: CityNewsContext): string {
  return `${ctx.act}|${ctx.scene}|${ctx.hour}`;
}

/** Человекочитаемое время суток для промпта (границы как у timeLabel в HUD). */
export function describeCityHour(hour: number): string {
  if (hour < 4) return 'глубокая ночь';
  if (hour < 6) return 'предрассветье';
  if (hour < 10) return 'утро';
  if (hour < 18) return 'день';
  if (hour < 21) return 'вечер';
  return 'ночь';
}

/**
 * Системный промпт генератора новостей ночного города: репортажный тон
 * внутриигрового радио, нуарная обыденность, СТРОГО без насилия — чтобы
 * тикер в HUD не выдавал ничего жёстче «погасших фонарей».
 */
export function buildCityNewsPrompt(ctx: CityNewsContext): string {
  const hh = String(ctx.hour).padStart(2, '0');
  return (
    `Ты — редактор ночного городского радио в киберпанк-городе игры Володня. ` +
    `Контекст: акт ${ctx.act}, район ${ctx.scene}, время суток — ${describeCityHour(ctx.hour)} (${hh}:00). ` +
    `Сгенерируй ОДНУ короткую новостную строку для бегущей строки-тикера: ` +
    `не более ${CITY_NEWS_MAX_LENGTH} символов, одно-два предложения, сухой репортажный тон. ` +
    `Атмосфера: нуар и гнетущая обыденность — погасшие фонари, странные сводки Гильдии, ` +
    `сбои в сетях, городские слухи, необъяснимая статистика. ` +
    `СТРОГО без насилия, крови, смерти и погонь — тревога только атмосферная. ` +
    `Не используй имена реальных людей и брендов. Не повторяй примеры. ` +
    `Примеры стиля: «В районе Старых Докеров снова погасли фонари. Гильдия призывает сохранять спокойствие.» ` +
    `или «Транспортная лента: лифты Верхнего кольца задерживаются. Причина — плохое настроение». ` +
    `Только текст новости, без кавычек, без подписи и без пояснений.`
  );
}

/**
 * Санитизация ответа модели под формат тикера: одна строка (схлопываем
 * переводы строк), без оборачивающих кавычек и префиксов вида «Новость:»,
 * обрезка до лимита по границе слова с многоточием.
 */
export function sanitizeCityNews(raw: string, maxLength = CITY_NEWS_MAX_LENGTH): string {
  let s = raw.replace(/\s+/g, ' ').trim();
  s = s.replace(/^["«„“'']+/, '').replace(/["»”“'']+$/, '');
  s = s.replace(/^\s*(новость|эфир|news)\s*[:—-]\s*/iu, '');
  if (s.length > maxLength) {
    s = s.slice(0, maxLength - 1).replace(/\s+\S*$/, '') + '…';
  }
  return s;
}

/** Ответ модели слишком короткий/пустой → считаем мусором, берём фолбэк. */
export function isUsableCityNews(news: string | null | undefined): news is string {
  return typeof news === 'string' && news.trim().length >= CITY_NEWS_MIN_LENGTH;
}

// 10 инлайн-фолбэков (авторские, в лоре Володни: Гильдия, «Синяя яма», Косая 12).
export const CITY_NEWS_FALLBACKS: readonly string[] = [
  'В районе Старых Докеров снова погасли фонари. Гильдия призывает сохранять спокойствие.',
  'Метеосводка: к утру туман сгустится до нуля видимости. Слышимость тоже снизится.',
  'Кафе «Синяя яма» открыто до последнего клиента. Последний клиент уже семь лет не уходит.',
  'Транспортная лента: лифты Верхнего кольца задерживаются. Причина указана как «плохое настроение».',
  'Библиотека сообщает: найден том, который никто не брал. Он сам вернулся на полку.',
  'Внимание: радио «Эхо Дока» сменило частоту. Если слышите шёпот — это не наша волна.',
  'На Косой 12 снова поёт водосток. Жильцы просят не беспокоиться: он всегда так поёт.',
  'Служба наблюдения: количество теней в переулках превышает норму на одну. Ведётся учёт.',
  'Пирс у реки закрыт до рассвета. Смотритель говорит, что вода сегодня слишком внимательно слушает.',
  'Сводка с крыш: замечен одинокий фонарщик. Число фонарей в городе не менялось двадцать лет.',
];

/** Детерминированный выбор фолбэка (random инжектится для тестов). */
export function pickCityNewsFallback(now = Date.now(), random: () => number = Math.random): CityNewsEntry {
  const idx = Math.min(CITY_NEWS_FALLBACKS.length - 1, Math.floor(random() * CITY_NEWS_FALLBACKS.length));
  const news = CITY_NEWS_FALLBACKS[idx] ?? CITY_NEWS_FALLBACKS[0]!;
  return { news, model: 'fallback-static', generatedAt: now };
}

export interface TimestampedEntry {
  generatedAt: number;
}

/**
 * Ёмкостное вытеснение кеша: при превышении `maxEntries` сначала удаляются
 * записи старше TTL; если и этого мало — самые старые записи независимо от
 * TTL (у matrix-quote eviction был «только по TTL», из-за чего кеш мог
 * зависнуть выше лимита; здесь лимит соблюдается гарантированно).
 * Чистая функция: мутирует только переданный Map, глобалей не трогает.
 */
export function evictCacheEntries<K, V extends TimestampedEntry>(
  cache: Map<K, V>,
  now: number,
  ttlMs: number,
  maxEntries: number,
): number {
  if (cache.size <= maxEntries) return 0;
  let evicted = 0;
  for (const [key, entry] of cache) {
    if (cache.size <= maxEntries) break;
    if (now - entry.generatedAt > ttlMs) {
      cache.delete(key);
      evicted += 1;
    }
  }
  if (cache.size > maxEntries) {
    const oldestFirst = [...cache.entries()].sort((a, b) => a[1].generatedAt - b[1].generatedAt);
    const excess = cache.size - maxEntries;
    for (let i = 0; i < excess && i < oldestFirst.length; i += 1) {
      cache.delete(oldestFirst[i]![0]);
      evicted += 1;
    }
  }
  return evicted;
}
