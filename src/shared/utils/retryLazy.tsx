import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * React.lazy with ChunkLoadError retry — recovers from stale deploys / flaky networks.
 */
export function retryLazy<T extends ComponentType<any>>(
  importFn: () => Promise<{ [key: string]: T }>,
  exportName: string,
  maxRetries = 3,
): LazyExoticComponent<T> {
  return lazy(() =>
    importFn()
      .then((mod) => ({ default: mod[exportName] as T }))
      .catch(async (err: Error) => {
        if (maxRetries <= 0) throw err;
        console.warn(
          `[retryLazy] ChunkLoadError for ${exportName}, retrying... (${maxRetries} left)`,
          err.message,
        );
        await new Promise((resolve) => setTimeout(resolve, 500 * (4 - maxRetries)));
        return importFn().then((mod) => ({ default: mod[exportName] as T }));
      }),
  );
}

/** Default export variant (e.g. dynamic import() with default export). */
export function retryLazyDefault<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  chunkName: string,
  maxRetries = 3,
): LazyExoticComponent<T> {
  return lazy(() =>
    importFn().catch(async (err: Error) => {
      if (maxRetries <= 0) throw err;
      console.warn(
        `[retryLazy] ChunkLoadError for ${chunkName}, retrying... (${maxRetries} left)`,
        err.message,
      );
      await new Promise((resolve) => setTimeout(resolve, 500 * (4 - maxRetries)));
      return importFn();
    }),
  );
}
