import type { StoryNode } from '@/shared/types/game';
import { SCENE_EXPLORE_HUB_DEFS } from '@/shared/sceneExploreHubRegistry';

/** Act 1 already defines explore_mode, corridor_explore_mode, street_bench_view. */
const ACT1_HUB_IDS = new Set(['explore_mode', 'corridor_explore_mode', 'street_bench_view']);

function buildSceneExploreHubNode(def: (typeof SCENE_EXPLORE_HUB_DEFS)[number]): StoryNode {
  return {
    id: def.hubId,
    text: def.hubText,
    speaker: 'narrator',
    sceneId: def.sceneId,
    choices: [
      { text: 'Свободно исследовать', next: def.hubId },
    ],
  };
}

/** Explore-hub story nodes for scenes beyond act 1. */
export const STORY_NODES_SCENE_EXPLORE_HUBS: Record<string, StoryNode> = Object.fromEntries(
  SCENE_EXPLORE_HUB_DEFS.filter((def) => !ACT1_HUB_IDS.has(def.hubId)).map((def) => [
    def.hubId,
    buildSceneExploreHubNode(def),
  ]),
);
