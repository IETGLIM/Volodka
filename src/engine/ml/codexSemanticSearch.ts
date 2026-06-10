/**
 * Semantic Codex search — opt-in, lazy, canon-safe retrieval only.
 */

import { buildSearchCorpus, type SearchCorpusDocument } from '@/data/mlSearchCorpus';
import type { LoreEntry } from '@/store/shared';
import { MlEmbeddingIndex, type MlEmbeddingEngine } from '@/engine/ml/mlEmbeddingIndex';
import { createMlEmbeddingEngine } from '@/engine/ml/mlEngineLoader';
import { isAiFeaturesEnabled } from '@/engine/ml/transformersBridge';

let indexPromise: Promise<MlEmbeddingIndex> | null = null;
let engineRef: MlEmbeddingEngine | null = null;

function isMlSkipped(): boolean {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
  return env?.VITE_ML_SKIP === '1' || env?.MODE === 'test';
}

async function ensureIndex(entries: LoreEntry[]): Promise<MlEmbeddingIndex | null> {
  if (!isAiFeaturesEnabled() || isMlSkipped()) return null;

  if (!indexPromise) {
    indexPromise = (async () => {
      const engine = await createMlEmbeddingEngine();
      engineRef = engine;
      const corpus: SearchCorpusDocument[] = buildSearchCorpus(entries);
      const index = new MlEmbeddingIndex();
      await index.build(corpus, engine);
      return index;
    })();
  }

  return indexPromise;
}

/** Reset cached index (e.g. after lore discovery batch or settings toggle). */
export function resetCodexSearchIndex(): void {
  indexPromise = null;
  engineRef = null;
}

export async function searchCodexSemantically(
  query: string,
  entries: LoreEntry[],
  topK = 24,
): Promise<string[] | null> {
  const trimmed = query.trim();
  if (!trimmed || !isAiFeaturesEnabled() || isMlSkipped()) return null;

  try {
    const index = await ensureIndex(entries);
    if (!index || !engineRef) return null;
    const queryVector = await engineRef.embed(trimmed);
    return index.searchLoreIds(queryVector, topK);
  } catch (err) {
    console.warn('[Volodka ML] Semantic search failed, falling back to filter:', err);
    resetCodexSearchIndex();
    return null;
  }
}
