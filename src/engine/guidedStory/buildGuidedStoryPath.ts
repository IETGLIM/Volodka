import {
  ACT_CHAPTER_TITLES,
  ACT_TRANSITIONS,
  GOLDEN_PATH_BRANCH_HINTS,
  GOLDEN_PATH_QUEST_SPINE,
  GOLDEN_PATH_STORY_SPINE,
  STORY_FLAG_TO_NODE_ID,
  STORY_NODE_OBJECTIVE_TYPE,
  STORY_NODE_TO_NPC_ID,
  STORY_NODE_TO_SCENE_LABEL,
  getNpcIdForStoryNode as getStaticNpcIdForStoryNode,
} from '@/data/goldenPath';
import type { QuestDefinition, StoryNode } from '@/shared/types/game';
import type { GuidedStoryPathConfig } from '@/engine/guidedStory/guidedStoryTypes';
import {
  buildStorySpineIndex,
  deriveGoldenPath,
  deriveQuestSpine,
} from '@/engine/story/deriveGoldenPath';

export function buildGuidedStoryPathConfig(
  storyNodes: Record<string, StoryNode>,
  quests: readonly QuestDefinition[],
): GuidedStoryPathConfig {
  const derived = deriveGoldenPath(storyNodes, {
    fallbackStorySpine: GOLDEN_PATH_STORY_SPINE,
    fallbackBranchHints: GOLDEN_PATH_BRANCH_HINTS,
    fallbackNpcMap: STORY_NODE_TO_NPC_ID,
    fallbackSceneLabels: STORY_NODE_TO_SCENE_LABEL,
    fallbackObjectiveTypes: STORY_NODE_OBJECTIVE_TYPE,
  });

  const storySpineIndex = buildStorySpineIndex(derived.storySpine);
  const questSpine = deriveQuestSpine(quests, storySpineIndex, GOLDEN_PATH_QUEST_SPINE);

  const npcByNodeId = derived.npcByNodeId;

  return {
    storySpine: derived.storySpine,
    questSpine,
    branchHints: derived.branchHints,
    actTransitions: ACT_TRANSITIONS,
    actChapterTitles: ACT_CHAPTER_TITLES,
    storyNodeToSceneLabel: derived.sceneLabelByNodeId,
    storyNodeObjectiveType: derived.objectiveTypeByNodeId,
    storyFlagToNodeId: STORY_FLAG_TO_NODE_ID,
    getNpcIdForStoryNode(nodeId: string): string | undefined {
      return npcByNodeId[nodeId] ?? getStaticNpcIdForStoryNode(nodeId);
    },
  };
}

/** Expose derivation diagnostics for validators / dev tools. */
export function getGoldenPathDerivationReport(
  storyNodes: Record<string, StoryNode>,
): ReturnType<typeof deriveGoldenPath> {
  return deriveGoldenPath(storyNodes, {
    fallbackStorySpine: GOLDEN_PATH_STORY_SPINE,
    fallbackBranchHints: GOLDEN_PATH_BRANCH_HINTS,
    fallbackNpcMap: STORY_NODE_TO_NPC_ID,
    fallbackSceneLabels: STORY_NODE_TO_SCENE_LABEL,
    fallbackObjectiveTypes: STORY_NODE_OBJECTIVE_TYPE,
  });
}
