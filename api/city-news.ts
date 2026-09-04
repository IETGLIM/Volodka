/* Vercel Edge Function — FreeRouter «городской тикер» proxy.
 * Same-origin proxy: SPA → /api/city-news → FreeRouter (OpenAI-compatible).
 * Генерирует одну короткую (≤140 символов) новость ночного города для
 * бегущей строки TopBarDataTicker. Вся тестируемая логика (валидация,
 * промпт, санитизация, фолбэки, eviction) — в ./lib/cityNewsLogic.
 *
 * FREEROUTER_KEY lives only in Vercel env vars — NEVER reaches the client
 * bundle. If unset → 503 + `fallback:true` новость → клиент показывает
 * только статичные строки тикера. Игра никогда не ломается.
 *
 * GET /api/city-news?act=1..7&scene=<id>&hour=0..23
 *   ← { news, model } | { news, model, fallback: true } | { error }
 *
 * See readme.md §«Городской тикер и Шёпот города (FreeRouter)».
 */

import {
  CITY_NEWS_MAX_LENGTH,
  buildCityNewsPrompt,
  cityNewsCacheKey,
  evictCacheEntries,
  isUsableCityNews,
  parseCityNewsParams,
  pickCityNewsFallback,
  sanitizeCityNews,
  type CityNewsContext,
  type CityNewsEntry,
} from './lib/cityNewsLogic';

export const config = { runtime: 'edge' };

const FREEROUTER_ENDPOINT = 'https://api.freerouter.eu.cc/v1/chat/completions';
// FIX: прежний базовый URL https://freerouter.eu.cc/v1/... отдаёт HTML документации
// (HTTP 405) — обе LLM-фичи молча уходили в фолбэк. Реальный API-базовый URL
// — https://api.freerouter.eu.cc (сверено с официальными docs и curl-пробой).
// FIX (model): glm-5.2 отсутствует в каталоге провайдера (проверено GET /v1/models);
// 'auto' — бесплатный роутер на актуальные модели (вход/выход по $0).
const DEFAULT_MODEL = 'auto';
// Новости — дешёвый контент: кеш щедрее, чем у matrix-quote (5 мин → 10 мин).
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 256;
const RATE_LIMIT_INTERVAL_MS = 3 * 1000;

const responseCache = new Map<string, CityNewsEntry>();
const ipLastRequest = new Map<string, number>();

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': 'same-origin',
      'Vary': 'Origin',
      ...extra,
    },
  });
}

function storeAndEvict(key: string, entry: CityNewsEntry, now: number): void {
  responseCache.set(key, entry);
  evictCacheEntries(responseCache, now, CACHE_TTL_MS, CACHE_MAX_ENTRIES);
}

interface FreeRouterResponse {
  choices?: { message?: { content?: string | null } }[];
  error?: { message?: string };
  model?: string;
}

async function callFreeRouter(apiKey: string, model: string, systemPrompt: string): Promise<{ news: string | null; model: string }> {
  // 'auto' — не reasoning-модель: скрытого reasoning-trace нет, бюджет
  // max_tokens уходит целиком в ответ (900 оставлено как запас прочности).
  const upstream = await fetch(FREEROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Выдай новостную строку для эфира.' },
      ],
      max_tokens: 900,
      temperature: 0.95,
    }),
  });
  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    // Санитизация upstream-ошибки — не течёт ни ключ, ни длинные тела.
    throw new Error(`FreeRouter HTTP ${upstream.status}: ${errText.slice(0, 200).replace(/Bearer [^\s"]+/gi, 'Bearer ***')}`);
  }
  const data = (await upstream.json()) as FreeRouterResponse;
  return { news: data.choices?.[0]?.message?.content?.trim() ?? null, model: data.model ?? model };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': 'same-origin',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, 405, { Allow: 'GET' });

  const url = new URL(req.url);
  const parsed = parseCityNewsParams({
    scene: url.searchParams.get('scene'),
    act: url.searchParams.get('act'),
    hour: url.searchParams.get('hour'),
  });
  if (!parsed.ok) return json({ error: parsed.error, param: parsed.param, hint: parsed.hint }, 400);
  const ctx: CityNewsContext = parsed.value;

  const apiKey = process.env.FREEROUTER_KEY;
  if (!apiKey || apiKey === 'your-key-here') {
    const fb = pickCityNewsFallback();
    return json({ error: 'freerouter_not_configured', news: fb.news, model: fb.model, fallback: true }, 503);
  }

  // Per-IP rate limit (in-memory, soft).
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const last = ipLastRequest.get(ip);
  if (last && now - last < RATE_LIMIT_INTERVAL_MS) {
    const key = cityNewsCacheKey(ctx);
    const cached = responseCache.get(key);
    if (cached && now - cached.generatedAt < CACHE_TTL_MS) return json({ news: cached.news, model: cached.model, cached: true });
    return json({ error: 'rate_limited', retry_after_ms: RATE_LIMIT_INTERVAL_MS - (now - last) }, 429);
  }
  ipLastRequest.set(ip, now);

  // Response cache hit.
  const key = cityNewsCacheKey(ctx);
  const cached = responseCache.get(key);
  if (cached && now - cached.generatedAt < CACHE_TTL_MS) return json({ news: cached.news, model: cached.model, cached: true });

  // 'auto' — не reasoning-модель: скрытого reasoning-trace нет, бюджет
  // max_tokens уходит целиком в ответ (см. примечание в readme).
  const model = process.env.FREEROUTER_MODEL || DEFAULT_MODEL;
  try {
    const result = await callFreeRouter(apiKey, model, buildCityNewsPrompt(ctx));
    if (!isUsableCityNews(result.news)) {
      const fb = pickCityNewsFallback();
      storeAndEvict(key, fb, now);
      return json({ news: fb.news, model: fb.model, fallback: true });
    }
    const cleaned = sanitizeCityNews(result.news, CITY_NEWS_MAX_LENGTH);
    const entry: CityNewsEntry = { news: cleaned, model: result.model, generatedAt: now };
    storeAndEvict(key, entry, now);
    return json({ news: cleaned, model: result.model });
  } catch (err) {
    // Жёсткий сбой → фолбэк-новость. 200+fallback, чтобы клиент считал ответ
    // пригодным; кешируем, чтобы не долбить деградировавший upstream.
    const fb = pickCityNewsFallback();
    storeAndEvict(key, fb, now);
    const message = err instanceof Error ? err.message : 'unknown_error';
    return json({ news: fb.news, model: fb.model, fallback: true, error: message.slice(0, 200) }, 200);
  }
}
