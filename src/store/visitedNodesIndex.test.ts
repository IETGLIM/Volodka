import { describe, expect, it } from 'vitest';
import { getVisitedNodeSet, hasVisitedNode } from './visitedNodesIndex';

describe('visitedNodesIndex', () => {
  it('hasVisitedNode returns membership in O(1) after cache warm', () => {
    const visited = ['intro', 'explore_mode', 'act2_bridge'];
    expect(hasVisitedNode(visited, 'explore_mode')).toBe(true);
    expect(hasVisitedNode(visited, 'missing')).toBe(false);
  });

  it('rebuilds cache when visitedNodes array reference changes', () => {
    const v1 = ['a'];
    const v2 = [...v1, 'b'];
    expect(hasVisitedNode(v1, 'b')).toBe(false);
    expect(hasVisitedNode(v2, 'b')).toBe(true);
    expect(getVisitedNodeSet(v1).has('a')).toBe(true);
    expect(getVisitedNodeSet(v2).has('b')).toBe(true);
  });
});
