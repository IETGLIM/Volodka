/* ─── useMatrixQuote — client hook for the FreeRouter dynamic quote proxy ───
 *
 * Calls `/api/matrix-quote?scene=…&karma=…&act=…` (Vercel Edge serverless
 * function). The server injects `FREEROUTER_KEY` from a Vercel env var — the
 * key NEVER reaches the browser bundle. If the endpoint returns 503 (key not
 * configured) or the fetch fails, `quote` resolves to null and the caller is
 * expected to fall back to the static `MATRIX_QUOTES` from
 * `@/data/matrixQuotes`. Game never breaks.
 *
 * CACHING
 * ───────
 *   - localStorage: `matrix-quote-${scene}-${karmaBucket}` where
 *     karmaBucket = Math.floor(karma / 25). Bucketing avoids re-fetching
 *     on every ±1 karma change — quotes are philosophical, not karma-exact.
 *   - Cached entries expire after 30 minutes (we add `cachedAt` to the
 *     stored JSON). The server has its own 5-min cache; the localStorage
 *     cache is layered on top to avoid network entirely on repeat visits.
 *
 * AUTO-REFRESH
 * ───────────
 *   Scene change debounces 2 s before firing, so quick traversal through
 *   intermediate scenes doesn't trigger N requests.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const LS_PREFIX = 'matrix-quote-';
const LS_TTL_MS = 30 * 60 * 1000; // 30 min
const DEBOUNCE_MS = 2000;
const FETCH_TIMEOUT_MS = 4000;

export interface UseMatrixQuoteResult {
  quote: string | null;
  model: string | null;
  loading: boolean;
  error: string | null;
  /** True if the server returned a fallback (FreeRouter unreachable / key unset). */
  fallback: boolean;
  /** Force a fresh fetch, ignoring localStorage and the in-flight request. */
  refresh: () => void;
}

interface CachedQuote {
  quote: string;
  model: string;
  cachedAt: number;
  fallback: boolean;
}

interface ServerResponse {
  quote?: string;
  model?: string;
  error?: string;
  fallback?: boolean;
  cached?: boolean;
}

function readLs(scene: string, karmaBucket: number): CachedQuote | null {
  try {
    const raw = localStorage.getItem(`${LS_PREFIX}${scene}-${karmaBucket}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedQuote;
    if (!parsed || typeof parsed.quote !== 'string' || typeof parsed.cachedAt !== 'number') {
      return null;
    }
    if (Date.now() - parsed.cachedAt > LS_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLs(scene: string, karmaBucket: number, entry: CachedQuote): void {
  try {
    localStorage.setItem(`${LS_PREFIX}${scene}-${karmaBucket}`, JSON.stringify(entry));
  } catch {
    // QuotaExceededError / private mode — silently skip; the hook still works
    // (just no persistence across sessions).
  }
}

function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Fetch a dynamic (LLM-generated) Matrix-style quote.
 *
 * @param scene  Current scene id (e.g. "volodka_room", "matrix_layer").
 * @param karma   Player karma (server clamps to -100..100; game uses 0..100).
 * @param act     Act number 1..7.
 * @param theme   Optional thematic hint (e.g. "выбор", "потеря").
 */
export function useMatrixQuote(
  scene: string,
  karma: number,
  act: number,
  theme?: string,
): UseMatrixQuoteResult {
  const karmaBucket = Math.floor((karma ?? 0) / 25);
  const [state, setState] = useState<UseMatrixQuoteResult>({
    quote: null,
    model: null,
    loading: false,
    error: null,
    fallback: false,
    refresh: () => undefined,
  });

  const inFlightRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latestReqIdRef = useRef(0);

  const doFetch = useCallback(
    async (force: boolean): Promise<void> => {
      if (!scene || !isOnline()) {
        setState((prev) => ({
          ...prev,
          loading: false,
          quote: null,
          model: null,
          fallback: false,
        }));
        return;
      }

      // Try localStorage first (skip on force-refresh).
      if (!force) {
        const cached = readLs(scene, karmaBucket);
        if (cached) {
          setState({
            quote: cached.quote,
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
        // Keep showing the stale quote while we refresh — better UX.
        quote: prev.quote,
        model: prev.model,
        refresh: () => {
          void doFetch(true);
        },
      }));

      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const params = new URLSearchParams({
          scene: scene.slice(0, 64),
          karma: String(Math.trunc(karma ?? 0)),
          act: String(Math.max(1, Math.min(7, Math.trunc(act) || 1))),
        });
        if (theme) params.set('theme', theme.slice(0, 64));

        const res = await fetch(`/api/matrix-quote?${params.toString()}`, {
          method: 'GET',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        if (reqId !== latestReqIdRef.current) return; // stale response

        if (res.status === 429) {
          // Rate limited — keep the existing quote (if any) or null.
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

        if (!res.ok && !data.quote) {
          // 503 (key not configured) or other error → fall back to null.
          setState({
            quote: null,
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

        const quote = data.quote ?? null;
        const model = data.model ?? null;
        const fallback = Boolean(data.fallback);

        if (quote) {
          writeLs(scene, karmaBucket, { quote, model: model ?? 'unknown', cachedAt: Date.now(), fallback });
        }

        setState({
          quote,
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
        setState((prev) => ({
          ...prev,
          loading: false,
          // On fetch failure, the caller falls back to static quotes.
          // Don't surface an error string in the UI — silent fallback.
          quote: prev.quote,
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
    [scene, karmaBucket, karma, act, theme],
  );

  // Debounced auto-refresh on scene/karma/act change.
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      void doFetch(false);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [doFetch]);

  // Cleanup any in-flight request on unmount.
  useEffect(() => {
    return () => {
      inFlightRef.current?.abort();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
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
