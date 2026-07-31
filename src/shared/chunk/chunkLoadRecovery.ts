export const CHUNK_RELOAD_SESSION_KEY = 'volodka-chunk-reload-attempt';

/**
 * Module-level reload lock — prevents concurrent chunk-load errors from
 * toggling the sessionStorage flag back and forth (race condition).
 *
 * Race scenario WITHOUT this lock:
 *   1. Error A: flag empty → set flag → reload → return never
 *   2. Error B (before reload completes): flag is '1' → remove flag → throw
 *   3. Error C: flag empty (just removed by B) → set flag → reload → return never
 *   4. Error D: flag is '1' → remove flag → throw
 * This causes multiple reloads and flag thrashing.
 *
 * WITH this lock: the first error sets both the module flag AND the
 * sessionStorage flag. Subsequent errors see the module flag and throw
 * immediately without touching sessionStorage.
 */
let isReloading = false;

export function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  const message = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : '';
  return (
    name === 'ChunkLoadError' ||
    // Vite custom event payload / synthetic Error from installChunkLoadRecovery
    message.includes('vite:preloadError') ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Failed to load module script')
  );
}

/**
 * In Vite dev mode, "Failed to fetch dynamically imported module" can occur
 * transiently when the dev server is briefly unreachable (HMR websocket
 * disconnect, on-demand compilation lag, gateway proxy hiccup). These are NOT
 * stale-chunk errors and should not trigger a page reload — the module will
 * load on retry once the dev server responds.
 *
 * In production, the error is always a genuine stale chunk (post-deploy hash
 * mismatch) and reload is the correct recovery.
 *
 * Uses MODE === 'development' (not DEV) so that vitest (MODE === 'test')
 * still tests the production reload path.
 */
function isDevModeTransientError(): boolean {
  return Boolean(
    typeof import.meta !== 'undefined' &&
      (import.meta as { env?: { MODE?: string } }).env?.MODE === 'development',
  );
}

/** Reload once after deploy when a hashed lazy chunk no longer exists on the CDN. */
export function recoverFromStaleChunk(err: unknown): never {
  if (typeof window === 'undefined' || !isChunkLoadError(err)) {
    throw err;
  }

  // If a reload is already in flight (module lock), throw immediately without
  // touching sessionStorage. This prevents the race where concurrent errors
  // toggle the flag and cause multiple reloads.
  if (isReloading) {
    throw err instanceof Error ? err : new Error(String(err));
  }

  // In dev mode, transient dynamic-import failures (dev server briefly
  // unreachable) should NOT trigger a reload — the user would lose their
  // game state and the reload itself would fail if the dev server is still
  // unreachable. Throw so the caller's retry logic can re-attempt.
  if (isDevModeTransientError()) {
    throw err instanceof Error ? err : new Error(String(err));
  }

  try {
    if (!sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
      isReloading = true;
      sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, '1');
      console.warn('[chunkLoadRecovery] Stale chunk detected, reloading…', err);
      window.location.reload();
      // Return a never-resolving promise to stop execution while the page
      // reloads. Without this, the calling code (retryImport) would catch
      // the throw below and retry 3 times before the reload takes effect.
      // The `never` return type satisfies TypeScript; we never actually reach.
      return new Promise<never>(() => {}) as never;
    }
    // Reload was already attempted — this is a genuine missing chunk, not a
    // stale cache. Clear the flag so the next session can try again.
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
  } catch {
    // sessionStorage might be unavailable (private browsing) — reload anyway.
    if (!isReloading) {
      isReloading = true;
      window.location.reload();
    }
    return new Promise<never>(() => {}) as never;
  }

  throw err instanceof Error ? err : new Error(String(err));
}

export function clearChunkReloadFlag(): void {
  isReloading = false;
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
  } catch {
    // private browsing
  }
}

export function installChunkLoadRecovery(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('vite:preloadError', (event) => {
    // Prevent Vite's default uncaught throw so recovery can reload once.
    event.preventDefault();
    try {
      recoverFromStaleChunk(new Error('vite:preloadError'));
    } catch {
      // Reload already attempted this session — keep the error swallowed
      // (preventDefault) so the tab does not crash-loop with Uncaught Error.
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (!isChunkLoadError(event.reason)) return;
    event.preventDefault();
    try {
      recoverFromStaleChunk(event.reason);
    } catch {
      // Same one-shot guard as vite:preloadError — avoid rejection storms.
    }
  });
}
