import { hasVisitedNode } from '@/shared/visitedNodesIndex';

export interface Act1PrologueGateState {
  currentNodeId: string | null;
  showStoryOverlay: boolean;
  visitedNodes: readonly string[];
}

/** Gate deferred wake handoff so cutscene end / timers cannot reopen start after Act I exploration. */
export function shouldOpenAct1PrologueStory(state: Act1PrologueGateState): boolean {
  if (state.currentNodeId !== 'start') return false;
  if (hasVisitedNode(state.visitedNodes, 'explore_mode')) return false;
  if (state.showStoryOverlay) return false;
  return true;
}
