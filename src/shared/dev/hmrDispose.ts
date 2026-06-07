/**
 * Vite HMR helpers — tear down singletons / effect cleanups when a module is
 * invalidated. React Fast Refresh may skip useEffect unmount when only a hook
 * file changes, so orchestrators register the same cleanup here.
 */

/** Run `cleanup` when this module is hot-replaced (dev only). */
export function registerHmrDispose(cleanup: () => void): void {
  if (import.meta.hot) {
    import.meta.hot.dispose(cleanup);
  }
}

/** Use as a useEffect return value — runs on unmount AND on HMR invalidate. */
export function withHmrCleanup(cleanup: () => void): () => void {
  registerHmrDispose(cleanup);
  return cleanup;
}
