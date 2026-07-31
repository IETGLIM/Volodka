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
    const missing = Object.keys(STORY_NODES).filter((id) => !runtimeIds.has(id));

    expect(missing, `runtime registry missing ${missing.length} static node(s)`).toEqual([]);
  });

  it('act expanded satellites resolve via ensureStoryNode (act3–7)', async () => {
    const { ensureStoryNode, hasStoryNode, loadBootstrapNarrativePacks } = await import(
      './narrativePackRegistry'
    );
    await loadBootstrapNarrativePacks();
    await ensureStoryNode('act7_exp_epilogue_vision');
    expect(hasStoryNode('act7_exp_epilogue_vision')).toBe(true);
  });

  it('resolves act1 satellite nodes referenced from act1 spine', async () => {
    await loadAllNarrativePacks();

    const cache = getStoryNodesCache();
    expect(cache.solnysh_door).toBeDefined();
    expect(cache.room_wardrobe_memory).toBeDefined();
    expect(cache.act4_quiet_hour).toBeDefined();
  });
});
