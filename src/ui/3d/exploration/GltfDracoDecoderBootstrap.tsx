'use client';

import { useLayoutEffect } from 'react';
import { ensureGltfDracoDecoderPathConfigured } from '@/lib/explorationGltfDecoders';

/**
 * Ранний вызов `useGLTF.setDecoderPath` до Suspense с `useGLTF` (иначе первый Draco-GLB
 * может стартовать до `AppPerfWarmup` / `model-cache`).
 */
export function GltfDracoDecoderBootstrap() {
  useLayoutEffect(() => {
    ensureGltfDracoDecoderPathConfigured();
  }, []);
  return null;
}
