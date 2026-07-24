import type { DialogueNode } from '@/shared/types/game';
import type { NarrativeTextVariants } from '@/shared/types/definitions/narrative';
import { hasVisitedNode } from '@/shared/visitedNodesIndex';
import {
  buildNarrativeLiveMessage,
  resolveNarrativeText } from '@/shared/narrativePresentation';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { sanitizePlainText } from '@/shared/utils/sanitizePlainText';

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

/** Default relation thresholds for text variant selection. */
const DEFAULT_RELATION_THRESHOLDS = { high: 60, low: 30 } as const;

export function resolveDialogueText(
  node: Pick<DialogueNode, 'text' | 'textVariants' | 'karmaThresholds'>,
  karma: number,
  npcRelation?: number,
): string {
  const variants = node.textVariants;
  if (!variants) return resolveNarrativeText(node, karma);

  // Priority: karma > relation > neutralKarma > default text.
  // Karma is checked first (global player trait), then relation (per-NPC).
  const karmaText = resolveNarrativeText(node, karma);
  if (karmaText !== resolveNarrativeText({ ...node, textVariants: undefined }, karma)) {
    // A karma variant was selected — it takes priority over relation.
    return karmaText;
  }

  // No karma variant matched — check relation.
  if (npcRelation !== undefined) {
    if (npcRelation >= DEFAULT_RELATION_THRESHOLDS.high && variants.highRelation) {
      return sanitizePlainText(variants.highRelation);
    }
    if (npcRelation <= DEFAULT_RELATION_THRESHOLDS.low && variants.lowRelation) {
      return sanitizePlainText(variants.lowRelation);
    }
  }

  return karmaText;
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
