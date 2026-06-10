import { describe, expect, it } from 'vitest';
import { cosineSimilarity, MlEmbeddingIndex } from '@/engine/ml/mlEmbeddingIndex';
import type { SearchCorpusDocument } from '@/data/mlSearchCorpus';

describe('mlEmbeddingIndex', () => {
  it('cosineSimilarity returns 1 for identical normalized vectors', () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([1, 0, 0]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(1);
  });

  it('searchLoreIds filters poem documents', async () => {
    const corpus: SearchCorpusDocument[] = [
      { id: 'lore_a', kind: 'lore', text: 'alpha' },
      { id: 'poem_1', kind: 'poem', text: 'beta' },
      { id: 'lore_b', kind: 'lore', text: 'gamma' },
    ];

    const engine = {
      embed: async (text: string) => {
        if (text.includes('alpha') || text === 'query-a') return new Float32Array([1, 0]);
        if (text.includes('beta') || text === 'query-b') return new Float32Array([0.9, 0.1]);
        return new Float32Array([0, 1]);
      },
    };

    const index = new MlEmbeddingIndex();
    await index.build(corpus, engine);

    const loreIds = index.searchLoreIds(new Float32Array([1, 0]), 5);
    expect(loreIds).toContain('lore_a');
    expect(loreIds).not.toContain('poem_1');
  });
});
