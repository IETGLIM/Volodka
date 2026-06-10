/**
 * In-memory embedding index for semantic Codex search.
 */

import type { SearchCorpusDocument } from '@/data/mlSearchCorpus';

export interface IndexedDocument {
  id: string;
  kind: SearchCorpusDocument['kind'];
  vector: Float32Array;
}

export interface SemanticSearchHit {
  id: string;
  kind: SearchCorpusDocument['kind'];
  score: number;
}

export interface MlEmbeddingEngine {
  embed(text: string): Promise<Float32Array>;
}

/** Cosine similarity for L2-normalized vectors (dot product). */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i += 1) {
    sum += a[i]! * b[i]!;
  }
  return sum;
}

export class MlEmbeddingIndex {
  private documents: IndexedDocument[] = [];

  get size(): number {
    return this.documents.length;
  }

  async build(corpus: SearchCorpusDocument[], engine: MlEmbeddingEngine): Promise<void> {
    const indexed: IndexedDocument[] = [];
    for (const doc of corpus) {
      const vector = await engine.embed(doc.text);
      indexed.push({ id: doc.id, kind: doc.kind, vector });
    }
    this.documents = indexed;
  }

  search(queryVector: Float32Array, topK = 24, minScore = 0.25): SemanticSearchHit[] {
    const hits: SemanticSearchHit[] = [];
    for (const doc of this.documents) {
      const score = cosineSimilarity(queryVector, doc.vector);
      if (score >= minScore) {
        hits.push({ id: doc.id, kind: doc.kind, score });
      }
    }
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, topK);
  }

  /** Lore ids ranked by semantic relevance; poem hits are dropped. */
  searchLoreIds(queryVector: Float32Array, topK = 24): string[] {
    return this.search(queryVector, topK)
      .filter((hit) => hit.kind === 'lore')
      .map((hit) => hit.id);
  }
}
