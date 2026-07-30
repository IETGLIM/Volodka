import type { StoryChoice, StoryNode } from '@/shared/types/game';
import { SCENE_EXPLORE_HUB_DEFS } from '@/shared/sceneExploreHubRegistry';

/** Act 1 already defines explore_mode, corridor_explore_mode, street_bench_view. */
const ACT1_HUB_IDS = new Set(['explore_mode', 'corridor_explore_mode', 'street_bench_view']);

/** Explore hubs with richer definitions in act story packs — skip auto-generation. */
const ACT_PACK_DEFINED_HUB_IDS = new Set([
  'pier_explore_mode',
  'factory_explore_mode',
  'basement_explore_mode',
  'solnysh_explore_mode',
]);

/** Golden-path continuation from auto-generated explore hubs (matches GOLDEN_PATH_STORY_SPINE). */
const GOLDEN_PATH_HUB_CONTINUE: Partial<
  Record<string, { next: string; text: string }>
> = {
  cafe_explore_mode: { next: 'cafe_barista', text: 'Подойти к баристе' },
  office_explore_mode: { next: 'start_diagnosis', text: 'Сесть за терминал Александра' },
  park_explore_mode: { next: 'act3_zarema_warning', text: 'Осторожно очистить надпись на камне' },
  street_winter_explore_mode: {
    next: 'act4_peaceful_march',
    text: 'Присоединиться к мирному маршу',
  },
  rooftop_explore_mode: {
    next: 'act4_rooftop_broadcast',
    text: 'Настроить передающую антенну',
  },
  library_explore_mode: {
    next: 'act7_library_archive',
    text: 'Открыть городской архив стихов',
  },
  chk_explore_mode: {
    next: 'chk_act5_campfire_dawn',
    text: 'Подойти к Ру — рассвет после эфира',
  },
  dream_explore_mode: {
    next: 'sleep_dream_entrance',
    text: 'Запомнить стихотворение из сна',
  },
  zarema_room_explore_mode: {
    next: 'zarema_bank_discovery',
    text: 'Зафиксировать следы и начать расследование',
  },
  zarema_room_solo_explore_mode: {
    next: 'act4_quiet_zarema_room',
    text: 'Заглянуть к Зареме',
  },
  pier_evening_explore_mode: {
    next: 'pier_story_intro',
    text: 'Поговорить с Трофимом и Риткой',
  },
  library_basement_explore_mode: {
    next: 'library_lost_archive_start',
    text: 'Искать утерянный архив с Катей',
  },
  bunker_explore_mode: {
    next: 'resistance_bunker_hub',
    text: 'Встретиться с Максимом',
  },
  albert_backroom_explore_mode: {
    next: 'act4_quiet_albert_backroom',
    text: 'Заглянуть к Альберту в подсобку',
  },
  mainframe_explore_mode: {
    next: 'act4_quiet_mainframe',
    text: 'Заглянуть в серверную гильдии',
  },
  factory_roof_explore_mode: {
    next: 'factory_roof_lookout',
    text: 'Подняться к Жеке на крышу',
  },
  city_square_explore_mode: {
    next: 'act4_public_leader',
    text: 'Выйти на площадь — обратиться к людям',
  },
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
    text: def.hubText ?? '',
    hubIntroText: def.hubText,
    hubRevisitText: def.hubTextRevisit,
    speaker: 'narrator',
    sceneId: def.sceneId,
    choices,
  };
}

/** Explore-hub story nodes for scenes beyond act 1. */
export const STORY_NODES_SCENE_EXPLORE_HUBS: Record<string, StoryNode> = Object.fromEntries(
  SCENE_EXPLORE_HUB_DEFS
    .filter(
      (def) => !ACT1_HUB_IDS.has(def.hubId) && !ACT_PACK_DEFINED_HUB_IDS.has(def.hubId),
    )
    .map((def) => [def.hubId, buildSceneExploreHubNode(def)]),
);
