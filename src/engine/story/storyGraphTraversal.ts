import { isExploreHubNode } from '@/shared/exploreHubNodes';

/** Skip self-loops on exploration hub nodes (explore_mode, corridor_explore_mode). */
export function isStoryGraphEdge(fromNodeId: string, toNodeId: string | null | undefined): boolean {
  if (!toNodeId) return false;
  if (fromNodeId === toNodeId && isExploreHubNode(fromNodeId)) return false;
  return true;
}

/** Max BFS hops when walking descendants/ancestors (guards accidental mega-graph walks). */
export const STORY_GRAPH_TRAVERSAL_MAX_HOPS = 128;
