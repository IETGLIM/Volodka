import { dispatchGameAction } from '@/engine/GameActionDispatcher';

/**
 * Maps 3D exploration dialogue ids to golden-path story node ids.
 * Only include ids where opening the dialogue should visit the node immediately
 * (not choices that gate progression — those use visitStoryNode effects).
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
  dispatchGameAction({ type: 'story/visitNode', nodeId: storyNodeId });
}
