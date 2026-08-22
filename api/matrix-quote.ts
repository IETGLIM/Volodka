/* Vercel Edge Function — FreeRouter Matrix Quote proxy.
 * Same-origin proxy: SPA → /api/matrix-quote → FreeRouter (OpenAI-compatible).
 * FREEROUTER_KEY lives only in Vercel env vars — NEVER reaches the client bundle.
 * If unset → 503 + `fallback:true` quote → client falls back to static quotes.
 * See readme.md §«Динамические Matrix-цитаты (FreeRouter)» for full setup.
 */

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

function cacheKey(scene: string, karma: number, act: number, theme: string | null): string {
  return `${act}|${scene}|${karma}|${theme ?? ''}`;
}

function pickFallback(): CacheEntry {
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

async function callFreeRouter(apiKey: string, model: string, systemPrompt: string): Promise<{ quote: string | null; model: string }> {
  // glm-5.2 is a reasoning model — needs headroom for the reasoning trace
  // before emitting final `content`. 400 tokens is empirically enough
  // for a 1-2 sentence Russian quote (probed during integration).
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
        { role: 'user', content: 'Сгенерируй цитату.' },
      ],
      max_tokens: 400,
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
  if (!scene) return json({ error: 'missing_param', param: 'scene' }, 400);
  const karmaNum = Number(karmaRaw);
  const actNum = Number(actRaw);
  if (!Number.isFinite(karmaNum)) return json({ error: 'missing_param', param: 'karma' }, 400);
  if (!Number.isFinite(actNum) || actNum < 1 || actNum > 7) return json({ error: 'invalid_param', param: 'act', hint: '1..7' }, 400);
  const karma = Math.max(-100, Math.min(100, Math.trunc(karmaNum)));
  const act = Math.max(1, Math.min(7, Math.trunc(actNum)));

  const apiKey = process.env.FREEROUTER_KEY;
  if (!apiKey || apiKey === 'your-key-here') {
    const fb = pickFallback();
    return json({ error: 'freerouter_not_configured', quote: fb.quote, model: fb.model, fallback: true }, 503);
  }

  // Per-IP rate limit (in-memory, soft).
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const last = ipLastRequest.get(ip);
  if (last && now - last < RATE_LIMIT_INTERVAL_MS) {
    const cached = responseCache.get(cacheKey(scene, karma, act, theme));
    if (cached && now - cached.generatedAt < CACHE_TTL_MS) return json({ quote: cached.quote, model: cached.model, cached: true });
    return json({ error: 'rate_limited', retry_after_ms: RATE_LIMIT_INTERVAL_MS - (now - last) }, 429);
  }
  ipLastRequest.set(ip, now);

  // Response cache hit.
  const key = cacheKey(scene, karma, act, theme);
  const cached = responseCache.get(key);
  if (cached && now - cached.generatedAt < CACHE_TTL_MS) return json({ quote: cached.quote, model: cached.model, cached: true });

  const model = process.env.FREEROUTER_MODEL || DEFAULT_MODEL;
  try {
    const result = await callFreeRouter(apiKey, model, buildSystemPrompt(scene, karma, act, theme));
    if (!result.quote || result.quote.length < 3) {
      const fb = pickFallback();
      responseCache.set(key, fb);
      if (responseCache.size > 256) for (const [k, v] of responseCache) if (now - v.generatedAt > CACHE_TTL_MS) responseCache.delete(k);
      return json({ quote: fb.quote, model: fb.model, fallback: true });
    }
    const cleaned = sanitizeQuote(result.quote);
    const entry: CacheEntry = { quote: cleaned, model: result.model, generatedAt: now };
    responseCache.set(key, entry);
    if (responseCache.size > 256) for (const [k, v] of responseCache) if (now - v.generatedAt > CACHE_TTL_MS) responseCache.delete(k);
    return json({ quote: cleaned, model: result.model });
  } catch (err) {
    // Hard failure → fall back to a static quote. 200+fallback so the client
    // treats it as usable. Cache to avoid hammering a degraded upstream.
    const fb = pickFallback();
    responseCache.set(key, fb);
    if (responseCache.size > 256) for (const [k, v] of responseCache) if (now - v.generatedAt > CACHE_TTL_MS) responseCache.delete(k);
    const message = err instanceof Error ? err.message : 'unknown_error';
    return json({ quote: fb.quote, model: fb.model, fallback: true, error: message.slice(0, 200) }, 200);
  }
}
