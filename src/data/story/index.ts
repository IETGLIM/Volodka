import type { StoryNode } from '@/shared/types/game';
import { buildStoryNodes, validateStoryNodes } from './buildStoryNodes';

/** Master story node registry — acts 1–7 + faction & location storylines. */
export const STORY_NODES: Record<string, StoryNode> = buildStoryNodes();

if (import.meta.env?.DEV) {
  void import('@/shared/validation/storyNodeValidationRegistry').then(
    ({ buildStoryNodeValidationRegistry }) => {
      const errors = validateStoryNodes(
        STORY_NODES,
        buildStoryNodeValidationRegistry(Object.keys(STORY_NODES)),
      );
      if (errors.length > 0) {
        console.warn(
          `[STORY_NODES] ${errors.length} validation issue(s):\n${errors.join('\n')}`,
        );
      }
    },
  );
}

export const ALL_STORY_NODE_IDS = Object.keys(STORY_NODES);

export function getStoryNode(id: string): StoryNode | undefined {
  return STORY_NODES[id];
}

export { validateStoryNodes };
