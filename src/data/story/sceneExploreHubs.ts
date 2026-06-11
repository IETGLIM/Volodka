import type { StoryChoice, StoryNode } from '@/shared/types/game';
import { SCENE_EXPLORE_HUB_DEFS } from '@/shared/sceneExploreHubRegistry';

/** Act 1 already defines explore_mode, corridor_explore_mode, street_bench_view. */
const ACT1_HUB_IDS = new Set(['explore_mode', 'corridor_explore_mode', 'street_bench_view']);

/** Golden-path continuation from auto-generated explore hubs (matches GOLDEN_PATH_STORY_SPINE). */
const GOLDEN_PATH_HUB_CONTINUE: Partial<
  Record<string, { next: string; text: string }>
> = {
  cafe_explore_mode: { next: 'cafe_barista', text: 'Подойти к баристе' },
  office_explore_mode: { next: 'start_diagnosis', text: 'Сесть за терминал Александра' },
  park_explore_mode: { next: 'act3_zarema_warning', text: 'Осторожно очистить надпись на камне' },
};

function buildSceneExploreHubNode(def: (typeof SCENE_EXPLORE_HUB_DEFS)[number]): StoryNode {
  const continueChoice = GOLDEN_PATH_HUB_CONTINUE[def.hubId];
  const choices: StoryChoice[] = [];

  if (continueChoice) {
    choices.push({
      text: continueChoice.text,
      next: continueChoice.next,
      goldenPath: true,
    });
  }

  choices.push({ text: 'Свободно исследовать', next: def.hubId });

  return {
    id: def.hubId,
    text: def.hubText,
    speaker: 'narrator',
    sceneId: def.sceneId,
    choices,
  };
}

/** Explore-hub story nodes for scenes beyond act 1. */
export const STORY_NODES_SCENE_EXPLORE_HUBS: Record<string, StoryNode> = Object.fromEntries(
  SCENE_EXPLORE_HUB_DEFS.filter((def) => !ACT1_HUB_IDS.has(def.hubId)).map((def) => [
    def.hubId,
    buildSceneExploreHubNode(def),
  ]),
);
