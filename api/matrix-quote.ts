/* Vercel Edge Function — FreeRouter Matrix Quote proxy.
 * Same-origin proxy: SPA → /api/matrix-quote → FreeRouter (OpenAI-compatible).
 * FREEROUTER_KEY lives only in Vercel env vars — NEVER reaches the client bundle.
 * If unset → 503 + `fallback:true` quote → client falls back to static quotes.
 * See readme.md §«Динамические Matrix-цитаты (FreeRouter)» for full setup.
 *
 * GET /api/matrix-quote?scene=&karma=&act=[&theme=][&mode=quote|whisper]
 *   mode=quote   (default) — философская Matrix-цитата (лимит 280 символов).
 *   mode=whisper — «шёпот города»: короткий тревожный шёпот от первого лица
 *                 для моментов высокого стресса игрока (лимит 160 символов,
 *                 СТРОГО без насилия — только атмосферная тревога).
 * Формат ответа одинаков для обоих режимов: { quote, model, mode, ... }.
 * Промпт/фолбэки/санитизация whisper — в ./lib/matrixWhisperLogic (тестируется).
 */

import { buildWhisperSystemPrompt, pickWhisperFallback, sanitizeWhisper } from './lib/matrixWhisperLogic';

export const config = { runtime: 'edge' };

const FREEROUTER_ENDPOINT = 'https://freerouter.eu.cc/v1/chat/completions';
const DEFAULT_MODEL = 'glm-5.2';
const CACHE_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_INTERVAL_MS = 3 * 1000;

// 10 inline fallback quotes (integration-author, public domain).
const FALLBACK_QUOTES = [
  'Система не спит — она лишь делает вид, что дремлет.',
  'Каждый бит — это чья-то невысказанная мысль.',
  'Ошибка 0xN0TH1NG — не сбой, а приглашение посмотреть туда, куда система не смотрит.',
  'Тишина в сети — это не отсутствие данных, а присутствие того, что данные не решаются назвать.',
  'Каждый выбор — это fork(). Не возвращающийся процесс — это поэт, выбравший правду.',
  'Память — это не диск, а тень, которая помнит форму света, уже погасшего.',
  'Сеть слушает тех, кто молчит. И перестаёт слушать, как только они начинают говорить.',
  'Реальность рендерится с задержкой в один кадр. Дежавю — это лаг восприятия.',
  'Код не пишет себя. Но он помнит того, кто его написал, дольше, чем помнит себя сам автор.',
  'Каждый ноль — это согласие молчать. Каждая единица — это согласие быть.',
] as const;

interface CacheEntry { quote: string; model: string; generatedAt: number }
type QuoteMode = 'quote' | 'whisper';
const responseCache = new Map<string, CacheEntry>();
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

function cacheKey(scene: string, karma: number, act: number, theme: string | null, mode: QuoteMode): string {
  // mode в ключе — иначе whisper и quote коллизовали бы в общем кеше.
  return `${act}|${scene}|${karma}|${theme ?? ''}|${mode}`;
}

function pickFallback(mode: QuoteMode = 'quote'): CacheEntry {
  if (mode === 'whisper') {
    const { quote, model, generatedAt } = pickWhisperFallback();
    return { quote, model, generatedAt };
  }
  const quote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]!;
  return { quote, model: 'fallback-static', generatedAt: Date.now() };
}

function buildSystemPrompt(scene: string, karma: number, act: number, theme: string | null): string {
  const themeHint = theme ? ` Тематический акцент: ${theme}.` : '';
  return (
    `Ты — генератор философских цитат в стиле Matrix (фильм) для киберпанк-игры Володня. ` +
    `Контекст: акт ${act}, сцена ${scene}, карма игрока ${karma}.${themeHint} ` +
    `Сгенерируй 1 короткую (1-2 предложения) цитату на русском языке, в духе: ` +
    `'Система не спит — она лишь делает вид, что дремлет.' или ` +
    `'Каждый бит — это чья-то невысказанная мысль.' ` +
    `Не повторяй существующие. Только текст, без объяснений.`
  );
}

interface FreeRouterResponse {
  choices?: { message?: { content?: string | null } }[];
  error?: { message?: string };
  model?: string;
}

async function callFreeRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
): Promise<{ quote: string | null; model: string }> {
  // glm-5.2 is a reasoning model — it emits a hidden reasoning trace before
  // the final `content`. 400 tokens was empirically enough at integration
  // time, but live probes (2026-08) showed traces occasionally eating the
  // whole budget → finish_reason "length" with empty content. 900 tokens
  // leaves headroom for the trace + a 1-2 sentence Russian quote.
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
        { role: 'user', content: userMessage },
      ],
      max_tokens: 900,
      temperature: 0.95,
    }),
  });
  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    // Sanitize upstream message — never leak the key or long error bodies.
    throw new Error(`FreeRouter HTTP ${upstream.status}: ${errText.slice(0, 200).replace(/Bearer [^\s"]+/gi, 'Bearer ***')}`);
  }
  const data = (await upstream.json()) as FreeRouterResponse;
  return { quote: data.choices?.[0]?.message?.content?.trim() ?? null, model: data.model ?? model };
}

function sanitizeQuote(q: string): string {
  let s = q.replace(/^["«„“'']+/, '').replace(/["»”“'']+$/, '');
  s = s.replace(/^\s*(цитата|quote)\s*:\s*/iu, '');
  if (s.length > 280) s = s.slice(0, 280).replace(/\s+\S*$/, '') + '…';
  return s;
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
  const scene = (url.searchParams.get('scene') ?? '').slice(0, 64);
  const karmaRaw = url.searchParams.get('karma');
  const actRaw = url.searchParams.get('act');
  const theme = url.searchParams.get('theme');
  const modeRaw = url.searchParams.get('mode');
  if (!scene) return json({ error: 'missing_param', param: 'scene' }, 400);
  if (modeRaw !== null && modeRaw !== 'quote' && modeRaw !== 'whisper') {
    return json({ error: 'invalid_param', param: 'mode', hint: 'quote|whisper' }, 400);
  }
  const mode: QuoteMode = modeRaw === 'whisper' ? 'whisper' : 'quote';
  const karmaNum = Number(karmaRaw);
  const actNum = Number(actRaw);
  if (!Number.isFinite(karmaNum)) return json({ error: 'missing_param', param: 'karma' }, 400);
  if (!Number.isFinite(actNum) || actNum < 1 || actNum > 7) return json({ error: 'invalid_param', param: 'act', hint: '1..7' }, 400);
  const karma = Math.max(-100, Math.min(100, Math.trunc(karmaNum)));
  const act = Math.max(1, Math.min(7, Math.trunc(actNum)));

  const apiKey = process.env.FREEROUTER_KEY;
  if (!apiKey || apiKey === 'your-key-here') {
    const fb = pickFallback(mode);
    return json({ error: 'freerouter_not_configured', quote: fb.quote, model: fb.model, mode, fallback: true }, 503);
  }

  // Per-IP rate limit (in-memory, soft).
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const last = ipLastRequest.get(ip);
  if (last && now - last < RATE_LIMIT_INTERVAL_MS) {
    const cached = responseCache.get(cacheKey(scene, karma, act, theme, mode));
    if (cached && now - cached.generatedAt < CACHE_TTL_MS) return json({ quote: cached.quote, model: cached.model, mode, cached: true });
    return json({ error: 'rate_limited', retry_after_ms: RATE_LIMIT_INTERVAL_MS - (now - last) }, 429);
  }
  ipLastRequest.set(ip, now);

  // Response cache hit.
  const key = cacheKey(scene, karma, act, theme, mode);
  const cached = responseCache.get(key);
  if (cached && now - cached.generatedAt < CACHE_TTL_MS) return json({ quote: cached.quote, model: cached.model, mode, cached: true });

  const model = process.env.FREEROUTER_MODEL || DEFAULT_MODEL;
  try {
    const systemPrompt =
      mode === 'whisper'
        ? buildWhisperSystemPrompt(scene, karma, act, theme)
        : buildSystemPrompt(scene, karma, act, theme);
    const userMessage = mode === 'whisper' ? 'Пошепчи.' : 'Сгенерируй цитату.';
    const result = await callFreeRouter(apiKey, model, systemPrompt, userMessage);
    if (!result.quote || result.quote.length < 3) {
      const fb = pickFallback(mode);
      responseCache.set(key, fb);
      if (responseCache.size > 256) for (const [k, v] of responseCache) if (now - v.generatedAt > CACHE_TTL_MS) responseCache.delete(k);
      return json({ quote: fb.quote, model: fb.model, mode, fallback: true });
    }
    const cleaned = mode === 'whisper' ? sanitizeWhisper(result.quote) : sanitizeQuote(result.quote);
    const entry: CacheEntry = { quote: cleaned, model: result.model, generatedAt: now };
    responseCache.set(key, entry);
    if (responseCache.size > 256) for (const [k, v] of responseCache) if (now - v.generatedAt > CACHE_TTL_MS) responseCache.delete(k);
    return json({ quote: cleaned, model: result.model, mode });
  } catch (err) {
    // Hard failure → fall back to a static quote. 200+fallback so the client
    // treats it as usable. Cache to avoid hammering a degraded upstream.
    const fb = pickFallback(mode);
    responseCache.set(key, fb);
    if (responseCache.size > 256) for (const [k, v] of responseCache) if (now - v.generatedAt > CACHE_TTL_MS) responseCache.delete(k);
    const message = err instanceof Error ? err.message : 'unknown_error';
    return json({ quote: fb.quote, model: fb.model, mode, fallback: true, error: message.slice(0, 200) }, 200);
  }
}
