import type { StoryNode } from '@/shared/types/game';
import { buildStoryNodes, validateStoryNodes } from './buildStoryNodes';

/** Master story node registry — acts 1–7 + faction & location storylines. */
export const STORY_NODES: Record<string, StoryNode> = buildStoryNodes();

if (import.meta.env?.DEV) {
  void import('@/shared/validation/storyNodeValidationRegistry').then(
    ({ buildStoryNodeValidationRegistry }) => {
      void import('@/shared/validation/storyNodeValidation').then(
        ({ validateStoryNodeGraph, formatStoryNodeValidationErrors }) => {
          const errors = formatStoryNodeValidationErrors(
            validateStoryNodeGraph(
              STORY_NODES,
              buildStoryNodeValidationRegistry(Object.keys(STORY_NODES)),
            ),
          );
          // Room examination nodes may reference expansion fragments still being authored.
          const coreErrors = errors.filter(
            (e) => !e.includes('_exp_') && !e.startsWith('story:examine_'),
          );
          if (coreErrors.length > 0) {
            console.warn(
              `[STORY_NODES] ${coreErrors.length} validation issue(s):\n${coreErrors.join('\n')}`,
            );
          }
        },
      );
    },
  );
}

export const ALL_STORY_NODE_IDS = Object.keys(STORY_NODES);

export function getStoryNode(id: string): StoryNode | undefined {
  return STORY_NODES[id];
}

export { validateStoryNodes };
