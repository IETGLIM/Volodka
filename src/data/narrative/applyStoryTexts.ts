/* ─── Merge data-driven narrative texts into story node structure ─── */

import type { StoryChoice, StoryNode } from '@/shared/types/game';
import type { ActStoryTexts, StoryNodeTextBlob } from './storyTextTypes';

type StoryNodeStructure = Omit<StoryNode, 'text'> & {
  readonly text?: string;
  readonly choices: readonly StoryChoice[];
};

function applyBlobToNode(node: StoryNodeStructure, blob: StoryNodeTextBlob): StoryNode {
  const baseChoiceCount = blob.choices?.length ?? node.choices.length;
  const choices: StoryChoice[] = node.choices.map((choice, index) => {
    if (index < baseChoiceCount && blob.choices?.[index] !== undefined) {
      return { ...choice, text: blob.choices[index]! };
    }
    return { ...choice };
  });

  return {
    ...node,
    text: blob.text,
    textVariants: blob.textVariants ?? node.textVariants,
    contextNote: blob.contextNote ?? node.contextNote,
    hubIntroText: blob.hubIntroText ?? node.hubIntroText,
    hubRevisitText: blob.hubRevisitText ?? node.hubRevisitText,
    accessibilityAnnounce: blob.accessibilityAnnounce ?? node.accessibilityAnnounce,
    guidanceHint: blob.guidanceHint ?? node.guidanceHint,
    guidanceSceneLabel: blob.guidanceSceneLabel ?? node.guidanceSceneLabel,
    choices,
  };
}

/** Attach JSON/YAML narrative prose to structural story nodes. */
export function applyStoryTexts(
  structure: Readonly<Record<string, StoryNodeStructure>>,
  texts: ActStoryTexts,
): Record<string, StoryNode> {
  const result: Record<string, StoryNode> = {};

  for (const [nodeId, node] of Object.entries(structure)) {
    const blob = texts[nodeId];
    if (!blob) {
      if (!node.text) {
        throw new Error(`[applyStoryTexts] Missing narrative text for story node "${nodeId}"`);
      }
      result[nodeId] = node as StoryNode;
      continue;
    }
    result[nodeId] = applyBlobToNode(node, blob);
  }

  return result;
}
