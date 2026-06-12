import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { isChunkLoadError, recoverFromStaleChunk } from '@/engine/chunkLoadRecovery';

async function retryImport<T>(
  importFn: () => Promise<T>,
  chunkName: string,
  maxRetries: number,
): Promise<T> {
  try {
    return await importFn();
  } catch (err) {
    if (isChunkLoadError(err)) {
      recoverFromStaleChunk(err);
    }
    if (maxRetries <= 0) throw err;
    console.warn(
      `[retryLazy] Import failed for ${chunkName}, retrying… (${maxRetries} left)`,
      err instanceof Error ? err.message : err,
    );
    await new Promise((resolve) => setTimeout(resolve, 500 * (4 - maxRetries)));
    return retryImport(importFn, chunkName, maxRetries - 1);
  }
}

/**
 * React.lazy with ChunkLoadError retry — recovers from stale deploys / flaky networks.
 */
export function retryLazy<T extends ComponentType<any>>(
  importFn: () => Promise<{ [key: string]: T }>,
  exportName: string,
  maxRetries = 3,
): LazyExoticComponent<T> {
  return lazy(() =>
    retryImport(importFn, exportName, maxRetries).then((mod) => ({
      default: mod[exportName] as T,
    })),
  );
}

/** Default export variant (e.g. dynamic import() with default export). */
export function retryLazyDefault<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  chunkName: string,
  maxRetries = 3,
): LazyExoticComponent<T> {
  return lazy(() => retryImport(importFn, chunkName, maxRetries));
}
