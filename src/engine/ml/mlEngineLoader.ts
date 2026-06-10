/**
 * Lazy transformers.js loader — isolated chunk, never imported at boot.
 */

import type { MlEmbeddingEngine } from '@/engine/ml/mlEmbeddingIndex';

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

let warnedMainThread = false;

async function createMainThreadEngine(): Promise<MlEmbeddingEngine> {
  if (!warnedMainThread && typeof console !== 'undefined') {
    console.warn(
      '[Volodka ML] Embeddings run on main thread. Expect a brief pause on first Codex AI search.',
    );
    warnedMainThread = true;
  }

  const { pipeline, env } = await import('@huggingface/transformers');

  env.allowLocalModels = false;
  env.useBrowserCache = true;

  const extractor = await pipeline('feature-extraction', MODEL_ID, {
    dtype: 'q8',
    device: 'wasm',
  });

  return {
    async embed(text: string): Promise<Float32Array> {
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      const data = output.data;
      if (data instanceof Float32Array) return data;
      return Float32Array.from(data as ArrayLike<number>);
    },
  };
}

export async function createMlEmbeddingEngine(): Promise<MlEmbeddingEngine> {
  // Web Worker path deferred — WASM pipeline needs dedicated bundling; main thread is opt-in safe.
  return createMainThreadEngine();
}
