import type { QuestDefinition } from '@/shared/types/game';
import {
  getStoryGraphIndex,
  getStoryAncestorIds,
  getStoryDescendants,
  getQuestsForLinkedStoryNode,
  getQuestDefinitionById,
  getQuestLinkedStoryNodes,
} from '@/engine/story/storyGraphIndex';
import { pickQuestFromSpine } from '@/engine/guidedStory/guidedStoryLogic';
import type { GuidedStoryGraphAccess } from '@/engine/guidedStory/guidedStoryTypes';
import { DEFAULT_GUIDED_STORY_PATH } from '@/engine/guidedStory/guidedStoryPath';

function questLinkedOnSpine(questId: string, spineIdx: number): boolean {
  const graph = getStoryGraphIndex();
  for (const linkedId of getQuestLinkedStoryNodes(questId)) {
    const linkedIdx = graph.storySpineIndex.get(linkedId) ?? -1;
    if (linkedIdx >= spineIdx) return true;
  }
  return false;
}

export function findQuestForStoryNode(
  nodeId: string,
  questSpineIndex: number,
  snapshot: { quests: readonly { questId: string; status: string }[] },
  path = DEFAULT_GUIDED_STORY_PATH,
): QuestDefinition | null {
  const graph = getStoryGraphIndex();
  const spineIdx = graph.storySpineIndex.get(nodeId) ?? -1;

  const exactMatches = getQuestsForLinkedStoryNode(nodeId);
  if (exactMatches.length > 0) {
    return (
      pickQuestFromSpine(exactMatches, questSpineIndex, snapshot as never, path, getQuestDefinitionById) ??
      exactMatches[0]
    );
  }

  const ancestors = getStoryAncestorIds(nodeId);
  const ancestorMatches: QuestDefinition[] = [];
  const seenQuestIds = new Set<string>();
  for (const ancestorId of ancestors) {
    for (const def of getQuestsForLinkedStoryNode(ancestorId)) {
      if (!graph.spineQuestIds.has(def.id) || seenQuestIds.has(def.id)) continue;
      seenQuestIds.add(def.id);
      ancestorMatches.push(def);
    }
  }
  if (ancestorMatches.length > 0) {
    return (
      pickQuestFromSpine(ancestorMatches, questSpineIndex, snapshot as never, path, getQuestDefinitionById) ??
      ancestorMatches[0]
    );
  }

  if (spineIdx < 0) return null;

  const descendants = getStoryDescendants(nodeId);

  for (let i = questSpineIndex; i < path.questSpine.length; i++) {
    const questId = path.questSpine[i];
    const def = graph.questById.get(questId);
    const linkedNodes = getQuestLinkedStoryNodes(questId);
    if (!def || linkedNodes.length === 0) continue;

    const questState = snapshot.quests.find((q) => q.questId === def.id);
    if (questState?.status === 'completed') continue;

    if (linkedNodes.some((linkedId) => descendants.has(linkedId))) {
      return def;
    }
  }

  for (let i = questSpineIndex; i < path.questSpine.length; i++) {
    const questId = path.questSpine[i];
    const def = graph.questById.get(questId);
    const linkedNodes = getQuestLinkedStoryNodes(questId);
    if (!def || linkedNodes.length === 0) continue;

    const questState = snapshot.quests.find((q) => q.questId === def.id);
    if (questState?.status === 'completed') continue;

    if (questLinkedOnSpine(questId, spineIdx)) return def;

    const hasOffSpineLink = linkedNodes.every(
      (linkedId) => !graph.storySpineIndex.has(linkedId),
    );
    if (hasOffSpineLink && i === questSpineIndex) return def;
  }

  return null;
}

/** Graph access that reads live snapshot for quest state during lookup. */
export function createSnapshotStoryGraphAccess(
  getSnapshot: () => { quests: readonly { questId: string; status: string }[] },
): GuidedStoryGraphAccess {
  return {
    findQuestForNode(nodeId, questSpineIndex) {
      return findQuestForStoryNode(nodeId, questSpineIndex, getSnapshot());
    },
    getQuestDefinitionById,
  };
}
