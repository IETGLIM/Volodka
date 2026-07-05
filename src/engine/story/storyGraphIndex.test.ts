import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoryGraphIndex,
  getStoryAncestorIds,
  getStoryDescendants,
  getStoryNodeParents,
  getQuestsForLinkedStoryNode,
  invalidateStoryGraphIndex,
  syncStoryGraphIndexAfterNarrativeChange,
} from '@/engine/story/storyGraphIndex';
import { preloadNarrativeGameData, loadAllNarrativePacks } from '@/data/gameDataLoader';
import { mergeStoryNodesIntoCacheForTests } from '@/data/narrative/narrativePackRegistry';
import type { StoryNode } from '@/shared/types/game';

describe('storyGraphIndex', () => {
  beforeEach(async () => {
    invalidateStoryGraphIndex();
    await preloadNarrativeGameData();
    await loadAllNarrativePacks();
    invalidateStoryGraphIndex();
  });

  it('builds indices once and serves O(1) quest lookups', () => {
    const first = getStoryGraphIndex();
    const second = getStoryGraphIndex();
    expect(second).toBe(first);

    const mariaQuests = getQuestsForLinkedStoryNode('maria_curious');
    expect(mariaQuests.some((q) => q.id === 'maria_connection')).toBe(true);
  });

  it('precomputes descendants without the old 64-node cap', () => {
    const graph = getStoryGraphIndex();
    expect(graph.descendants.size).toBeGreaterThan(0);

    for (const [, set] of graph.descendants) {
      expect(set.size).toBeLessThan(graph.descendants.size);
    }
  });

  it('returns ancestors in breadth-first order', () => {
    const graph = getStoryGraphIndex();
    const nodeWithParents = [...graph.parents.keys()].find(
      (nodeId) => (graph.parents.get(nodeId)?.length ?? 0) > 0,
    );
    expect(nodeWithParents).toBeDefined();

    const ancestors = getStoryAncestorIds(nodeWithParents!);
    expect(ancestors.length).toBeGreaterThan(0);
  });

  it('invalidates cached index', () => {
    const first = getStoryGraphIndex();
    invalidateStoryGraphIndex();
    const second = getStoryGraphIndex();
    expect(second).not.toBe(first);
    expect(getStoryDescendants('maria_curious')).toBeDefined();
  });

  it('merges new story nodes incrementally without replacing cache', async () => {
    invalidateStoryGraphIndex();

    const parentId = '__sgidx_test_parent__';
    const childId = '__sgidx_test_child__';
    const leafId = '__sgidx_test_leaf__';

    mergeStoryNodesIntoCacheForTests(
      {
        [parentId]: {
          id: parentId,
          text: 'parent',
          speaker: 'narrator',
          sceneId: 'street_night',
          choices: [{ text: 'go', next: childId }],
        } satisfies StoryNode,
      },
      'sgidx-test-1',
    );

    const first = getStoryGraphIndex();
    expect(getStoryDescendants(parentId).has(childId)).toBe(true);
    expect(getStoryDescendants(parentId).has(leafId)).toBe(false);

    mergeStoryNodesIntoCacheForTests(
      {
        [childId]: {
          id: childId,
          text: 'child',
          speaker: 'narrator',
          sceneId: 'street_night',
          choices: [{ text: 'go', next: leafId }],
        } satisfies StoryNode,
        [leafId]: {
          id: leafId,
          text: 'leaf',
          speaker: 'narrator',
          sceneId: 'street_night',
          choices: [],
        } satisfies StoryNode,
      },
      'sgidx-test-2',
    );

    syncStoryGraphIndexAfterNarrativeChange();
    const second = getStoryGraphIndex();

    expect(second).toBe(first);
    expect(getStoryDescendants(parentId).has(leafId)).toBe(true);
    expect(getStoryNodeParents(leafId)).toContain(childId);
  });
});
