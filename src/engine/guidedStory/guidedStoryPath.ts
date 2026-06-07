import {
  ACT_CHAPTER_TITLES,
  ACT_TRANSITIONS,
  GOLDEN_PATH_BRANCH_HINTS,
  GOLDEN_PATH_QUEST_SPINE,
  GOLDEN_PATH_STORY_SPINE,
  STORY_FLAG_TO_NODE_ID,
  STORY_NODE_OBJECTIVE_TYPE,
  STORY_NODE_TO_SCENE_LABEL,
  getNpcIdForStoryNode,
} from '@/data/goldenPath';
import type { GuidedStoryPathConfig } from '@/engine/guidedStory/guidedStoryTypes';
import { getQuestDefinitions, getStoryNodes, isNarrativeGameDataLoaded } from '@/data/gameDataLoader';
import { buildGuidedStoryPathConfig } from '@/engine/guidedStory/buildGuidedStoryPath';

/** Static path — tests and boot before narrative packs load. */
export const STATIC_GUIDED_STORY_PATH: GuidedStoryPathConfig = {
  storySpine: GOLDEN_PATH_STORY_SPINE,
  questSpine: GOLDEN_PATH_QUEST_SPINE,
  branchHints: GOLDEN_PATH_BRANCH_HINTS,
  actTransitions: ACT_TRANSITIONS,
  actChapterTitles: ACT_CHAPTER_TITLES,
  storyNodeToSceneLabel: STORY_NODE_TO_SCENE_LABEL,
  storyNodeObjectiveType: STORY_NODE_OBJECTIVE_TYPE,
  storyFlagToNodeId: STORY_FLAG_TO_NODE_ID,
  getNpcIdForStoryNode,
};

/** @deprecated Use getGuidedStoryPathConfig() — derived from story graph when loaded. */
export const DEFAULT_GUIDED_STORY_PATH = STATIC_GUIDED_STORY_PATH;

let cachedPath: GuidedStoryPathConfig | null = null;

/** Story spine + hints derived from loaded nodes; falls back to static tables. */
export function getGuidedStoryPathConfig(): GuidedStoryPathConfig {
  if (cachedPath) return cachedPath;
  if (!isNarrativeGameDataLoaded()) return STATIC_GUIDED_STORY_PATH;

  cachedPath = buildGuidedStoryPathConfig(getStoryNodes(), getQuestDefinitions());
  return cachedPath;
}

export function invalidateGuidedStoryPathConfig(): void {
  cachedPath = null;
}

/** Resolved story spine (derived when narrative data is loaded). */
export function getResolvedStorySpine(): readonly string[] {
  return getGuidedStoryPathConfig().storySpine;
}

/** Resolved quest spine (derived when narrative data is loaded). */
export function getResolvedQuestSpine(): readonly string[] {
  return getGuidedStoryPathConfig().questSpine;
}
