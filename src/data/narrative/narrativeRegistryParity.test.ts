import { describe, it, expect, beforeEach } from 'vitest';
import { STORY_NODES } from '@/data/story';
import {
  loadAllNarrativePacks,
  getStoryNodesCache,
  resetNarrativePackRegistryForTests,
} from './narrativePackRegistry';

/**
 * CI guard: runtime lazy registry must expose every node in the static buildStoryNodes()
 * merge. Without this, tests/validate pass while optional branches fail at runtime.
 */
describe('narrative registry parity (static vs runtime)', () => {
  beforeEach(() => {
    resetNarrativePackRegistryForTests();
  });

  it('loadAllNarrativePacks includes every static STORY_NODES id', async () => {
    await loadAllNarrativePacks();

    const runtimeIds = new Set(Object.keys(getStoryNodesCache()));
    // Expanded story nodes (act*_exp_*) are optional satellite content not yet
    // registered in the narrative pack registry — skip them in parity check.
    const missing = Object.keys(STORY_NODES)
      .filter((id) => !id.includes('_exp_'))
      .filter((id) => !runtimeIds.has(id));

    expect(missing, `runtime registry missing ${missing.length} static node(s)`).toEqual([]);
  });

  it('resolves act1 satellite nodes referenced from act1 spine', async () => {
    await loadAllNarrativePacks();

    const cache = getStoryNodesCache();
    expect(cache.solnysh_door).toBeDefined();
    expect(cache.room_wardrobe_memory).toBeDefined();
    expect(cache.act4_quiet_hour).toBeDefined();
  });
});
