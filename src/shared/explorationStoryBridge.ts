import { dispatchStateAction } from '@/shared/gameBridge/stateDispatcher';

/**
 * Maps 3D exploration dialogue ids to golden-path story node ids.
 */
export const EXPLORATION_DIALOGUE_STORY_STEP: Readonly<Record<string, string>> = {
  explore_room_table: 'room_table',
  explore_room_bookshelf: 'room_bookshelf',
  explore_room_window: 'room_table',
  explore_corridor_door: 'corridor_door',
  explore_kitchen_table: 'kitchen_table',
  explore_solnysh_door: 'solnysh_door',
  explore_solnysh_room_talk: 'solnysh_room_talk',
};

export function recordExplorationStoryStep(dialogueNodeId: string): void {
  const storyNodeId = EXPLORATION_DIALOGUE_STORY_STEP[dialogueNodeId];
  if (!storyNodeId) return;
  dispatchStateAction({ type: 'story/visitNode', nodeId: storyNodeId });
}
