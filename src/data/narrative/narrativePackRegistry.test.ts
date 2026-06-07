import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadBootstrapNarrativePacks,
  loadAllNarrativePacks,
  ensureStoryNode,
  ensureDialogueNode,
  getStoryNodesCache,
  getDialogueNodesCache,
  getLoadedStoryPackIds,
  resetNarrativePackRegistryForTests,
  hasStoryNode,
  mergeStoryNodesIntoCacheForTests,
} from './narrativePackRegistry';
describe('narrativePackRegistry', () => {
  beforeEach(() => {
    resetNarrativePackRegistryForTests();
  });

  it('loads only bootstrap packs initially', async () => {
    await loadBootstrapNarrativePacks();

    expect(getLoadedStoryPackIds()).toEqual(['act1']);
    expect(hasStoryNode('start')).toBe(true);
    expect(hasStoryNode('act2_transition')).toBe(false);
    expect(Object.keys(getStoryNodesCache()).length).toBeGreaterThan(10);
    expect(Object.keys(getDialogueNodesCache()).length).toBeGreaterThan(5);
  });

  it('loads act2 on demand via ensureStoryNode', async () => {
    await loadBootstrapNarrativePacks();
    await ensureStoryNode('act2_transition');

    expect(hasStoryNode('act2_transition')).toBe(true);
    expect(getLoadedStoryPackIds()).toContain('act2');
  });

  it('loads dialogue parts on demand', async () => {
    await loadBootstrapNarrativePacks();
    await ensureDialogueNode('albert_greeting');

    expect(getDialogueNodesCache()['albert_greeting']).toBeDefined();
  });

  it('loadAllNarrativePacks merges full story spine', async () => {
    await loadAllNarrativePacks();

    expect(hasStoryNode('start')).toBe(true);
    expect(hasStoryNode('ending_creator')).toBe(true);
    expect(getLoadedStoryPackIds().length).toBe(8);
  });

  it('logs when a pack would overwrite an existing node id', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mergeStoryNodesIntoCacheForTests(
      { dup_node: { id: 'dup_node', text: 'first', sceneId: 'volodka_room', choices: [] } },
      'act-a',
    );
    mergeStoryNodesIntoCacheForTests(
      { dup_node: { id: 'dup_node', text: 'second', sceneId: 'volodka_room', choices: [] } },
      'act-b',
    );

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('dup_node'),
    );
    expect(getStoryNodesCache().dup_node?.text).toBe('second');
    warn.mockRestore();
  });
});
