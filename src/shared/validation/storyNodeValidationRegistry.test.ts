import { describe, expect, it } from 'vitest';
import { buildStoryNodeValidationRegistry } from '@/shared/validation/storyNodeValidationRegistry';
import { EXPANSION_POEM_IDS } from '@/data/expansion/expansionPoemStubs';

describe('storyNodeValidationRegistry', () => {
  it('includes expansion poem stub ids for collectPoem validation', () => {
    const reg = buildStoryNodeValidationRegistry(['test_node']);
    for (const poemId of EXPANSION_POEM_IDS) {
      expect(reg.poemIds.has(poemId), poemId).toBe(true);
    }
  });
});
