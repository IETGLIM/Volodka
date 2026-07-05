export const CHUNK_RELOAD_SESSION_KEY = 'volodka-chunk-reload-attempt';

export function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  const message = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : '';
  return (
    name === 'ChunkLoadError' ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Failed to load module script')
  );
}

/** Reload once after deploy when a hashed lazy chunk no longer exists on the CDN. */
export function recoverFromStaleChunk(err: unknown): never {
  if (typeof window === 'undefined' || !isChunkLoadError(err)) {
    throw err;
  }

  try {
    if (!sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
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
    window.location.reload();
    return new Promise<never>(() => {}) as never;
  }

  throw err instanceof Error ? err : new Error(String(err));
}

export function clearChunkReloadFlag(): void {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
  } catch {
    // private browsing
  }
}

export function installChunkLoadRecovery(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    recoverFromStaleChunk(new Error('vite:preloadError'));
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (!isChunkLoadError(event.reason)) return;
    event.preventDefault();
    recoverFromStaleChunk(event.reason);
  });
}
