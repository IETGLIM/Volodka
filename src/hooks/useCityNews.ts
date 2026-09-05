/* ─── useCityNews — client hook for the FreeRouter city news ticker proxy ───
 *
 * Calls `/api/city-news?scene=…&act=…&hour=…` (Vercel Edge serverless
 * function). Same pattern as useMatrixQuote: the server injects
 * `FREEROUTER_KEY` from a Vercel env var — the key NEVER reaches the
 * browser bundle. If the endpoint returns 503 (key not configured) or the
 * fetch fails, `news` resolves to null and the caller (TopBarDataTicker)
 * keeps rendering only its static lines — graceful degradation, the game
 * never breaks.
 *
 * CACHING
 * ───────
 *   - localStorage: `city-news-${scene}-${act}-${hourBucket}` where
 *     hourBucket = Math.floor(hour / 2) — bucketing avoids re-fetching on
 *     every game-minute tick of the world clock (news binds to a
 *     «broadcast hour», not to the exact minute).
 *   - Entries expire after POLL_INTERVAL_MS — aligned with the polling
 *     cadence below; the server has its own 10-min cache layered on top.
 *
 * POLLING
 * ───────
 *   Not more often than once per 3.5 minutes (POLL_INTERVAL_MS), forced
 *   (bypasses localStorage) so the ticker eventually picks up fresh news
 *   when the server cache expires. Scene/act/hour-bucket change debounces
 *   2 s first, like useMatrixQuote.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const LS_PREFIX = 'city-news-';
const POLL_INTERVAL_MS = 3.5 * 60 * 1000; // 3.5 мин — «не чаще раза в 3-4 минуты»
const LS_TTL_MS = POLL_INTERVAL_MS;
const DEBOUNCE_MS = 2000;
const FETCH_TIMEOUT_MS = 4000;
const HOUR_BUCKET_HOURS = 2;

export interface UseCityNewsResult {
  news: string | null;
  model: string | null;
  loading: boolean;
  error: string | null;
  /** True if the server returned a fallback (FreeRouter unreachable / key unset). */
  fallback: boolean;
  /** Force a fresh fetch, ignoring localStorage and the in-flight request. */
  refresh: () => void;
}

interface CachedNews {
  news: string;
  model: string;
  cachedAt: number;
  fallback: boolean;
}

interface ServerResponse {
  news?: string;
  model?: string;
  error?: string;
  fallback?: boolean;
  cached?: boolean;
}

function readLs(scene: string, act: number, hourBucket: number): CachedNews | null {
  try {
    const raw = localStorage.getItem(`${LS_PREFIX}${scene}-${act}-${hourBucket}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedNews;
    if (!parsed || typeof parsed.news !== 'string' || typeof parsed.cachedAt !== 'number') {
      return null;
    }
    if (Date.now() - parsed.cachedAt > LS_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLs(scene: string, act: number, hourBucket: number, entry: CachedNews): void {
  try {
    localStorage.setItem(`${LS_PREFIX}${scene}-${act}-${hourBucket}`, JSON.stringify(entry));
  } catch {
    // QuotaExceededError / private mode — silently skip; the hook still works
    // (just no persistence across sessions).
  }
}

function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Fetch a short AI-generated news line for the top-bar data ticker.
 *
 * @param scene  Current scene id (e.g. "volodka_room", "old_docks").
 * @param act    Act number 1..7.
 * @param hour   World clock hour (0..24 float; bucketed to 2h, clamped 0..23).
 */
export function useCityNews(scene: string, act: number, hour: number): UseCityNewsResult {
  const hourBucket = Math.max(0, Math.min(23, Math.floor((hour ?? 0) / HOUR_BUCKET_HOURS)));
  const [state, setState] = useState<UseCityNewsResult>({
    news: null,
    model: null,
    loading: false,
    error: null,
    fallback: false,
    refresh: () => undefined,
  });

  const inFlightRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const latestReqIdRef = useRef(0);
  // FIX (v4.12.1, прод-лог): бэкофф поллера при устойчивых СБОЯХ (ключ не
  // настроен / сеть лежит / upstream висит) — без него вкладка с живым тикером
  // тратит ~410 серверлесс-вызовов в сутки впустую (503 без фолбэк-новости).
  // Фолбэк-новость из тела 503 НЕ считается сбоем — контент доставлен.
  const consecutiveHardFailuresRef = useRef(0);
  const nextPollAllowedAtRef = useRef(0);

  const doFetch = useCallback(
    async (force: boolean): Promise<void> => {
      if (!scene || !isOnline()) {
        setState((prev) => ({
          ...prev,
          loading: false,
          news: null,
          model: null,
          fallback: false,
        }));
        return;
      }

      // Try localStorage first (skip on force-refresh from the poller).
      if (!force) {
        const cached = readLs(scene, act, hourBucket);
        if (cached) {
          setState({
            news: cached.news,
            model: cached.model,
            loading: false,
            error: null,
            fallback: cached.fallback,
            refresh: () => {
              void doFetch(true);
            },
          });
          return;
        }
      }

      // Abort any in-flight request.
      inFlightRef.current?.abort();
      const controller = new AbortController();
      inFlightRef.current = controller;
      const reqId = ++latestReqIdRef.current;

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        // Keep showing the stale news while we refresh — no ticker flicker.
        news: prev.news,
        model: prev.model,
        refresh: () => {
          void doFetch(true);
        },
      }));

      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        // Час для запроса восстанавливаем из бакета — doFetch не должен
        // зависеть от сырого hour: тикающий world clock менял бы его каждые
        // игровые минуты и бесконечно сбрасывал debounce (запрос бы не ушёл).
        const hourForRequest = Math.min(23, hourBucket * HOUR_BUCKET_HOURS);
        const params = new URLSearchParams({
          scene: scene.slice(0, 64),
          act: String(Math.max(1, Math.min(7, Math.trunc(act) || 1))),
          hour: String(hourForRequest),
        });

        const res = await fetch(`/api/city-news?${params.toString()}`, {
          method: 'GET',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        if (reqId !== latestReqIdRef.current) return; // stale response

        if (res.status === 429) {
          // Rate limited — keep the existing news (if any) or null.
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'rate_limited',
            refresh: () => {
              void doFetch(true);
            },
          }));
          return;
        }

        const data = (await res.json()) as ServerResponse;
        if (reqId !== latestReqIdRef.current) return;

        if (!res.ok && !data.news) {
          // 503 (key not configured) or other error → null → static ticker.
          // Экспоненциальный бэкофф: 3.5 → 7 → 14 → 28 мин (кап ×4).
          consecutiveHardFailuresRef.current += 1;
          const backoffMultiplier = Math.min(4, 2 ** (consecutiveHardFailuresRef.current - 1));
          nextPollAllowedAtRef.current = Date.now() + POLL_INTERVAL_MS * backoffMultiplier;
          setState({
            news: null,
            model: null,
            loading: false,
            error: data.error ?? `http_${res.status}`,
            fallback: false,
            refresh: () => {
              void doFetch(true);
            },
          });
          return;
        }
        consecutiveHardFailuresRef.current = 0;
        nextPollAllowedAtRef.current = 0;

        const news = data.news ?? null;
        const model = data.model ?? null;
        const fallback = Boolean(data.fallback);

        if (news) {
          writeLs(scene, act, hourBucket, { news, model: model ?? 'unknown', cachedAt: Date.now(), fallback });
        }

        setState({
          news,
          model,
          loading: false,
          error: null,
          fallback,
          refresh: () => {
            void doFetch(true);
          },
        });
      } catch (err) {
        if (reqId !== latestReqIdRef.current) return;
        const aborted = err instanceof DOMException && err.name === 'AbortError';
        // Таймаут/сеть — тоже жёсткий сбой (вызов уже потрачен): бэкофф.
        consecutiveHardFailuresRef.current += 1;
        const backoffMultiplier = Math.min(4, 2 ** (consecutiveHardFailuresRef.current - 1));
        nextPollAllowedAtRef.current = Date.now() + POLL_INTERVAL_MS * backoffMultiplier;
        setState((prev) => ({
          ...prev,
          loading: false,
          // On fetch failure the ticker silently falls back to static lines.
          news: prev.news,
          model: prev.model,
          error: aborted ? 'timeout' : 'fetch_failed',
          fallback: false,
          refresh: () => {
            void doFetch(true);
          },
        }));
      } finally {
        clearTimeout(timeout);
      }
    },
    [scene, act, hourBucket],
  );

  // Debounced auto-refresh on scene/act/hour-bucket change.
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      void doFetch(false);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [doFetch]);

  // Polling: not more often than once per POLL_INTERVAL_MS (forced, so the
  // localStorage cache can't pin the same line forever while mounted).
  // FIX (v4.12.1): тики поллера пропускаются до истечения бэкоффа —
  // интервал остаётся фиксированным, частота запросов деградирует плавно.
  useEffect(() => {
    pollTimerRef.current = setInterval(() => {
      if (Date.now() < nextPollAllowedAtRef.current) return; // failure backoff
      void doFetch(true);
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [doFetch]);

  // Cleanup any in-flight request + timers on unmount.
  useEffect(() => {
    return () => {
      inFlightRef.current?.abort();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Online/offline recovery.
  useEffect(() => {
    const onOnline = (): void => {
      void doFetch(false);
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [doFetch]);

  return state;
}
