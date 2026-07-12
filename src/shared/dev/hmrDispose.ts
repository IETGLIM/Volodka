/**
 * Vite HMR helpers — tear down singletons / effect cleanups when a module is
 * invalidated. React Fast Refresh may skip useEffect unmount when only a hook
 * file changes, so orchestrators register the same cleanup here.
 */

const beforeUpdateCleanups = new Set<() => void>();
let beforeUpdateHookRegistered = false;

function ensureBeforeUpdateHook(): void {
  if (beforeUpdateHookRegistered || !import.meta.hot) return;
  beforeUpdateHookRegistered = true;

  import.meta.hot.on('vite:beforeUpdate', () => {
    for (const cleanup of beforeUpdateCleanups) {
      try {
        cleanup();
      } catch (err) {
        console.warn('[hmrDispose] beforeUpdate cleanup failed:', err);
      }
    }
  });

  import.meta.hot.dispose(() => {
    beforeUpdateHookRegistered = false;
  });
}

/** Run `cleanup` before any Vite HMR update (dev only). Use for GPU cache teardown. */
export function registerHmrBeforeUpdate(cleanup: () => void): void {
  if (!import.meta.hot) return;
  beforeUpdateCleanups.add(cleanup);
  import.meta.hot.dispose(() => {
    beforeUpdateCleanups.delete(cleanup);
  });
  ensureBeforeUpdateHook();
}

/** Test-only reset */
export function resetHmrBeforeUpdateForTests(): void {
  beforeUpdateCleanups.clear();
  beforeUpdateHookRegistered = false;
}

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
