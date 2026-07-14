import type { DialogueNode } from '@/shared/types/game';
import type { NarrativeTextVariants } from '@/shared/types/definitions/narrative';
import { hasVisitedNode } from '@/shared/visitedNodesIndex';
import {
  buildNarrativeLiveMessage,
  resolveNarrativeText } from '@/shared/narrativePresentation';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';

export { DEFAULT_KARMA_THRESHOLDS } from '@/shared/narrativePresentation';

export type DialogueTextVariants = NarrativeTextVariants;

/** Entry nodes that redirect to a return variant after the first visit.
 *  Built dynamically from NPC definitions that define both
 *  `dialogueNodeId` and `returnDialogueNodeId`. */
const DIALOGUE_RETURN_ENTRY_NODES: Readonly<Record<string, string>> = (() => {
  const map: Record<string, string> = {};
  for (const npc of ALL_NPC_DEFINITIONS) {
    if (npc.dialogueNodeId && npc.returnDialogueNodeId) {
      map[npc.dialogueNodeId] = npc.returnDialogueNodeId;
    }
  }
  return map;
})();

export function resolveDialogueText(
  node: Pick<DialogueNode, 'text' | 'textVariants' | 'karmaThresholds'>,
  karma: number,
): string {
  return resolveNarrativeText(node, karma);
}

export function resolveDialogueEntryNodeId(
  requestedId: string,
  visitedNodes: readonly string[],
): string {
  const returnNodeId = DIALOGUE_RETURN_ENTRY_NODES[requestedId];
  if (returnNodeId && hasVisitedNode(visitedNodes, requestedId)) {
    return returnNodeId;
  }
  return requestedId;
}

export function buildDialogueLiveMessage(
  node: Pick<DialogueNode, 'speaker' | 'contextNote'>,
  displayedText: string,
  done: boolean,
  includeContextNote: boolean,
): string {
  return buildNarrativeLiveMessage(
    {
      contextNote: includeContextNote ? node.contextNote : undefined,
      speaker: node.speaker },
    displayedText,
    done,
  );
}
