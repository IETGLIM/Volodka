import { Suspense, type ComponentType } from 'react';
import { retryLazyDefault } from '@/shared/utils/retryLazy';
import './sceneChunkGpuLifecycle';

export interface SceneChunkProps {
  /** Vite chunk label for DevTools / bundle analyzer. */
  chunkId: string;
}

/**
 * Wrap a dynamic import as a lazy scene sub-chunk with Suspense boundary.
 * Shell geometry loads first; detail chunks stream in after first paint.
 */
export function createSceneChunk<P extends object>(
  chunkId: string,
  loader: () => Promise<{ default: ComponentType<P> }>,
) {
  const LazyChunk = retryLazyDefault(loader, chunkId);

  function SceneChunk(props: P) {
    return (
      <Suspense fallback={null}>
        <LazyChunk {...props} />
      </Suspense>
    );
  }

  SceneChunk.displayName = `SceneChunk(${chunkId})`;
  SceneChunk.preload = () => loader();

  return SceneChunk;
}
