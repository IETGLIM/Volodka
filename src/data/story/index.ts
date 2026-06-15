import type { StoryNode } from '@/shared/types/game';
import { buildStoryNodes, validateStoryNodes } from './buildStoryNodes';

/** Master story node registry — acts 1–7 + faction & location storylines. */
export const STORY_NODES: Record<string, StoryNode> = buildStoryNodes();

export const ALL_STORY_NODE_IDS = Object.keys(STORY_NODES);

export function getStoryNode(id: string): StoryNode | undefined {
  return STORY_NODES[id];
}

export { validateStoryNodes };
