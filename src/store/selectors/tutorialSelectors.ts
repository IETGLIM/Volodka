/* ─── Volodka RPG – first-play tutorial selectors ─── */

import { hasVisitedNode } from '@/store/visitedNodesIndex';
import { getGameStore } from '../gameStore';
import { useGamePrimitive } from './hooks';

/** Narrative nodes that indicate the player has left the wake VN and can see the tutorial. */
export const ACT1_TUTORIAL_READY_NODES = [
  'explore_mode',
  'room_table',
  'room_bookshelf',
  'corridor_door',
  'corridor_explore_mode',
] as const;

export function selectAct1TutorialReady(s = getGameStore()): boolean {
  const { visitedNodes } = s.playerState;
  return ACT1_TUTORIAL_READY_NODES.some((nodeId) => hasVisitedNode(visitedNodes, nodeId));
}

export function useTutorialReady() {
  return useGamePrimitive(selectAct1TutorialReady);
}
