const visitedSetByArray = new WeakMap<readonly string[], ReadonlySet<string>>();

/**
 * Cached Set view of visitedNodes — O(n) once per array reference, then O(1) lookups.
 * Array remains the persisted source of truth; Set is derived at runtime.
 */
export function getVisitedNodeSet(visitedNodes: readonly string[]): ReadonlySet<string> {
  let set = visitedSetByArray.get(visitedNodes);
  if (!set) {
    set = new Set(visitedNodes);
    visitedSetByArray.set(visitedNodes, set);
  }
  return set;
}

export function hasVisitedNode(visitedNodes: readonly string[], nodeId: string): boolean {
  return getVisitedNodeSet(visitedNodes).has(nodeId);
}
