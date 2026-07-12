import { Suspense, type ComponentType } from 'react';
import { retryLazyDefault } from '@/shared/utils/retryLazy';
import type { SceneId } from '@/shared/types/game';
import { importWithSceneGpuRegistration } from '@/engine/three/importWithSceneGpuRegistration';

export interface SceneChunkProps {
  /** Vite code-split chunk label for DevTools / bundle analyzer. */
  chunkId: string;
}

/**
 * Wrap a dynamic import as a lazy scene sub-chunk with Suspense boundary.
 * Shell geometry loads first; detail chunks load via Vite code-splitting after first paint.
 */
export function createSceneChunk<P extends object>(
  chunkId: string,
  sceneId: SceneId,
  loader: () => Promise<{ default: ComponentType<P> }>,
) {
  const LazyChunk = retryLazyDefault(
    () => importWithSceneGpuRegistration(sceneId, loader),
    chunkId,
  );

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
