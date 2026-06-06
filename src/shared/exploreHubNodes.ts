/** Story nodes that act as in-world exploration hubs — overlay may stay open but movement is allowed. */
export const EXPLORE_HUB_NODE_IDS = new Set(['explore_mode', 'corridor_explore_mode']);

export function isExploreHubNode(nodeId: string): boolean {
  return EXPLORE_HUB_NODE_IDS.has(nodeId);
}

/** True when narrative overlay should freeze player locomotion. */
export function isNarrativeMovementLocked(
  showStoryOverlay: boolean,
  currentNodeId: string,
): boolean {
  return showStoryOverlay && !isExploreHubNode(currentNodeId);
}
