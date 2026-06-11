import type { SceneId } from '@/shared/types/game';

/** Per-scene exploration hub — overlay stays open, player can walk. */
export interface SceneExploreHubDef {
  hubId: string;
  sceneId: SceneId;
  hubText: string;
  /** Door / arrival nodes promoted to this hub on physical scene enter. */
  entryNodeIds: readonly string[];
}

/** Single source of truth for scene ↔ explore-hub mapping. */
export const SCENE_EXPLORE_HUB_DEFS: readonly SceneExploreHubDef[] = [
  {
    hubId: 'explore_mode',
    sceneId: 'volodka_room',
    hubText:
      'Комната небольшая, но уютная в своём роде. Стены увешаны распечатками кода и выцветшими фотографиями. Рабочий стол — эпицентр твоей жизни. Дверь в коридор приоткрыта.',
    entryNodeIds: ['start', 'go_home'],
  },
  {
    hubId: 'corridor_explore_mode',
    sceneId: 'volodka_corridor',
    hubText:
      'Коридор тянется в обе стороны — потёртый линолеум, облупившаяся краска, таблички с фамилиями на дверях. Лампочка под потолком то гаснет, то вспыхивает.',
    entryNodeIds: ['corridor_door'],
  },
  {
    hubId: 'street_bench_view',
    sceneId: 'street_night',
    hubText:
      'Улица залита неоновым светом. Рекламные голограммы мерцают на стенах домов. В переулке — кафе «Синяя яма», а вдалеке — башня IT-гильдии.',
    entryNodeIds: ['street_bench'],
  },
  {
    hubId: 'home_evening_explore_mode',
    sceneId: 'home_evening',
    hubText:
      'Общая кухня пахнет чаем и вареньем. Радиоприёмник тихо шипит, за окном — серые панельные дома и неоновые вывески.',
    entryNodeIds: ['kitchen_table', 'kitchen_window'],
  },
  {
    hubId: 'cafe_explore_mode',
    sceneId: 'cafe_evening',
    hubText:
      'Кафе «Синяя яма» — подвал с синими неоновыми трубками, запахом жжёного кофе и старым джazzом. За стойкой бариста, в углу — постоянные гости.',
    entryNodeIds: ['go_to_cafe', 'cafe_enter'],
  },
  {
    hubId: 'office_explore_mode',
    sceneId: 'office_day',
    hubText:
      'Офис IT-гильдии — стекло, хром и тихий гул серверов. Терминалы мерцают, коллеги снуют между кабинками, а где-то в глубине — комната Александра.',
    entryNodeIds: [
      'office_alexander',
      'start_diagnosis',
      'fix_success',
      'office_colleague',
      'colleague_persuasion_line',
      'chk_office_whisper',
    ],
  },
  {
    hubId: 'street_winter_explore_mode',
    sceneId: 'street_winter',
    hubText:
      'Зимняя улица — снег хрустит под ногами, пар изо рта, редкие прохожие в тёплых шапках. Город кажется тише, но не менее опасным.',
    entryNodeIds: ['act4_peaceful_march', 'act4_march_continues'],
  },
  {
    hubId: 'park_explore_mode',
    sceneId: 'park_day',
    hubText:
      'Парк днём — аллеи, скамейки, шум листвы и далёкий гул города за деревьями. Здесь можно перевести дух и прислушаться к себе.',
    entryNodeIds: ['park_entrance'],
  },
  {
    hubId: 'library_explore_mode',
    sceneId: 'library_day',
    hubText:
      'Библиотека — пыльные стеллажи, запах старой бумаги и тихий скрип половиц. Между томами спрятаны истории, которые система пыталась стереть.',
    entryNodeIds: ['library_entrance', 'act7_library_archive'],
  },
  {
    hubId: 'rooftop_explore_mode',
    sceneId: 'rooftop_edge',
    hubText:
      'Край крыши — ветер, огни города внизу и ощущение, что один шаг отделяет тебя от неба. Здесь слова звучат громче, чем в любой переговорке.',
    entryNodeIds: ['act4_transition', 'act4_rooftop_broadcast', 'rooftop_of_the_world', 'act6_rooftop_showdown'],
  },
  {
    hubId: 'factory_explore_mode',
    sceneId: 'abandoned_factory',
    hubText:
      'Заброшенный цех — ржавые станки, капающие трубы, эхо шагов под высоким потолком. Где-то здесь спрятано сердце старой гильдии.',
    entryNodeIds: ['abandoned_workshop'],
  },
  {
    hubId: 'basement_explore_mode',
    sceneId: 'factory_basement',
    hubText:
      'Подвал завода — ряды серверных стоек, красный аварийный свет и гул «Зари-М». Воздух холодный, пахнет озоном и машинным маслом.',
    entryNodeIds: ['factory_basement'],
  },
  {
    hubId: 'chk_explore_mode',
    sceneId: 'chk_forest_zorge',
    hubText:
      'Поляна ЧК — костёр в бочке, портвейн «777», гитара и бас из колонки. Правило простое: что услышал в лесу — остаётся в лесу.',
    entryNodeIds: [
      'chk_forest_approach',
      'chk_campfire_intro',
      'chk_campfire_bond',
      'chk_network_parallel',
      'chk_tolpa_poem',
      'chk_act3_sanctuary',
      'chk_act4_stalker_briefing',
      'chk_act4_broadcast_watch',
      'chk_act5_campfire_dawn',
    ],
  },
  {
    hubId: 'pier_explore_mode',
    sceneId: 'river_pier',
    hubText:
      'Пирс у реки — костёр в бочке, лунная дорожка на воде, камыши и старая лодка. Вторая тусовка ЧК, теплее и ближе к воде.',
    entryNodeIds: [],
  },
  {
    hubId: 'zarema_room_explore_mode',
    sceneId: 'zarema_albert_room',
    hubText:
      'Комната Заремы и Альберта — уютный беспорядок, книги, чайник и тихий свет настольной лампы.',
    entryNodeIds: [],
  },
  {
    hubId: 'dream_explore_mode',
    sceneId: 'sleep_dream',
    hubText:
      'Сон — мягкий, нереальный свет, где стены дышат, а время течёт иначе. Можно бродить, пока не проснёшься.',
    entryNodeIds: [],
  },
] as const;

function buildMaps() {
  const hubIds = new Set<string>();
  const sceneToHub: Partial<Record<SceneId, string>> = {};
  const hubToScene: Record<string, SceneId> = {};
  const entryToHub: Record<string, string> = {};

  for (const def of SCENE_EXPLORE_HUB_DEFS) {
    hubIds.add(def.hubId);
    sceneToHub[def.sceneId] = def.hubId;
    hubToScene[def.hubId] = def.sceneId;
    for (const entryId of def.entryNodeIds) {
      entryToHub[entryId] = def.hubId;
    }
  }

  return { hubIds, sceneToHub, hubToScene, entryToHub };
}

const maps = buildMaps();

export const EXPLORE_HUB_NODE_IDS: ReadonlySet<string> = maps.hubIds;
export const SCENE_TO_EXPLORE_HUB: Partial<Record<SceneId, string>> = maps.sceneToHub;
export const EXPLORE_HUB_TO_SCENE: Readonly<Record<string, SceneId>> = maps.hubToScene;
export const SCENE_ENTRY_NODE_TO_HUB: Readonly<Record<string, string>> = maps.entryToHub;

export function isExploreHubNode(nodeId: string): boolean {
  return EXPLORE_HUB_NODE_IDS.has(nodeId);
}

export function getExploreHubForScene(sceneId: SceneId): string | undefined {
  return SCENE_TO_EXPLORE_HUB[sceneId];
}

export function getSceneForExploreHub(hubId: string): SceneId | undefined {
  return EXPLORE_HUB_TO_SCENE[hubId];
}

export type ExploreHubNavigation =
  | { action: 'navigate'; hubId: string }
  | { action: 'close' };

/**
 * Resolve a choice targeting an explore hub: stay in overlay on the correct scene hub,
 * remap legacy `explore_mode` from non-room scenes, or dismiss when no hub exists.
 */
export function resolveExploreHubNavigation(
  currentNodeId: string,
  nodeSceneId: SceneId | undefined,
  choiceNext: string,
): ExploreHubNavigation {
  if (!EXPLORE_HUB_NODE_IDS.has(choiceNext)) {
    return { action: 'navigate', hubId: choiceNext };
  }

  if (currentNodeId === choiceNext) {
    return { action: 'navigate', hubId: choiceNext };
  }

  const entryHub = SCENE_ENTRY_NODE_TO_HUB[currentNodeId];
  if (entryHub === choiceNext) {
    return { action: 'navigate', hubId: choiceNext };
  }

  if (nodeSceneId) {
    const sceneHub = SCENE_TO_EXPLORE_HUB[nodeSceneId];
    if (sceneHub) {
      return { action: 'navigate', hubId: sceneHub };
    }
  }

  const hubScene = EXPLORE_HUB_TO_SCENE[choiceNext];
  if (hubScene && nodeSceneId === hubScene) {
    return { action: 'navigate', hubId: choiceNext };
  }

  return { action: 'close' };
}
