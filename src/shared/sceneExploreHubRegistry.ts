import type { SceneId } from '@/shared/types/game';

/** Per-scene exploration hub — spine node for saves/quests; overlay model varies by act. */
export interface SceneExploreHubDef {
  hubId: string;
  sceneId: SceneId;
  /** Location toast on first hub enter — omit when story node defines hubIntroText. */
  hubText?: string;
  /** Shorter toast on revisit (ui:exploration_message). */
  hubTextRevisit?: string;
  /** Door / arrival nodes promoted to this hub on physical scene enter. */
  entryNodeIds: readonly string[];
}

/** Single source of truth for scene ↔ explore-hub mapping (topology; prose via contentTruthManifest). */
export const SCENE_EXPLORE_HUB_DEFS: readonly SceneExploreHubDef[] = [
  {
    hubId: 'explore_mode',
    sceneId: 'volodka_room',
    entryNodeIds: ['start', 'go_home'],
  },
  {
    hubId: 'corridor_explore_mode',
    sceneId: 'volodka_corridor',
    entryNodeIds: ['corridor_door'],
  },
  {
    hubId: 'street_bench_view',
    sceneId: 'street_night',
    entryNodeIds: ['street_bench'],
  },
  {
    hubId: 'home_evening_explore_mode',
    sceneId: 'home_evening',
    hubText:
      'Общая кухня пахнет чаем, вареньем и нафталином из шкафа. Радиоприёмник «Океан» шипит между станциями — Зарема называет это «голосом тех, кого Сеть не слышит». За окном — серые панели и неон; здесь, между плитой и столом, время идёт по часам, а не по NTP.',
    hubTextRevisit: 'Кухня. Чайник свистит. Радио шипит.',
    entryNodeIds: ['kitchen_table', 'kitchen_window'],
  },
  {
    hubId: 'cafe_explore_mode',
    sceneId: 'cafe_evening',
    hubText:
      'Кафе «Синяя яма» — подвал с синими неоновыми трубками, запахом жжёного кофе и старым джазом из колонки без Bluetooth. Стены пропитаны поэтическим кодом: камеры слепнут, микрофоны глохнут. За стойкой — бариста с кибернетической рукой; в углу — Альберт, постукивающий пальцами в нервном ритме.',
    hubTextRevisit: 'Синяя яма. Мёртвая зона. Кофе горячий.',
    entryNodeIds: ['go_to_cafe', 'cafe_enter'],
  },
  {
    hubId: 'office_explore_mode',
    sceneId: 'office_day',
    hubText:
      'Офис IT-гильдии — стекло, хром и тихий гул серверов за перегородкой. Терминалы мерцают, коллеги снуют между кабинками с глазами, уставшими от «НейроМоста». Где-то в глубине — кабинет Александра. Воздух пахнет озоном и страхом перед инцидентом #4729.',
    hubTextRevisit: 'Офис. Гул серверов. Александр где-то там.',
    entryNodeIds: ['office_alexander'],
  },
  {
    hubId: 'street_winter_explore_mode',
    sceneId: 'street_winter',
    hubText:
      'Зимняя улица — снег хрустит под ногами, пар изо рта, редкие прохожие в тёплых шапках. Город кажется тише, но не менее опасным.',
    entryNodeIds: [],
  },
  {
    hubId: 'park_explore_mode',
    sceneId: 'park_day',
    hubText:
      'Парк днём — аллеи, скрипучие скамейки без NFC-чипов, шум листвы и далёкий гул города за деревьями. У обелиска — имена тех, кого стёрли после Краха. Здесь «Паноптикум» теряет фокус: слишком много теней. Стихи звучат честнее.',
    hubTextRevisit: 'Парк. Тише, чем в городе. Камень помнит.',
    entryNodeIds: ['park_entrance'],
  },
  {
    hubId: 'library_explore_mode',
    sceneId: 'library_day',
    hubText:
      'Библиотека — пыльные стеллажи, запах старой бумаги и тихий скрип половиц. На первом этаже — картотека, которую не оцифровали; на третьем — Запретный Фонд за решёткой. Между томами спрятаны истории, которые система пыталась стереть.',
    hubTextRevisit: 'Библиотека. Бумага не зависает.',
    entryNodeIds: ['library_entrance', 'act7_library_archive'],
  },
  {
    hubId: 'rooftop_explore_mode',
    sceneId: 'rooftop_edge',
    hubText:
      'Край крыши — ветер, огни города внизу и ощущение, что один шаг отделяет тебя от неба. «Высотники» на соседних крышах молчат; белый флаг с словом «ЖИВЫ» трепещет. Здесь слова звучат громче, чем в любой переговорке гильдии.',
    hubTextRevisit: 'Крыша. Ветер. Город как схема данных.',
    entryNodeIds: ['act4_transition', 'act4_rooftop_broadcast', 'rooftop_of_the_world', 'act6_rooftop_showdown', 'solnysh_roof_arrival', 'solnysh_roof_afterglow'],
  },
  {
    hubId: 'factory_explore_mode',
    sceneId: 'abandoned_factory',
    entryNodeIds: ['abandoned_workshop', 'act2_network_initiation'],
  },
  {
    hubId: 'basement_explore_mode',
    sceneId: 'factory_basement',
    entryNodeIds: ['factory_basement', 'factory_basement_familiar'],
  },
  {
    hubId: 'chk_explore_mode',
    sceneId: 'chk_forest_zorge',
    hubText:
      'Поляна ЧК — костёр в бочке, портвейн «777», гитара и бас из колонки. Лунный свет пробивается сквозь ели реже, чем в городе. Правило простое: что услышал в лесу — остаётся в лесу. Даже металл здесь играет тише.',
    hubTextRevisit: 'ЧК. Костёр. Лес слушает.',
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
      'chk_act7_farewell',
    ],
  },
  {
    hubId: 'pier_explore_mode',
    sceneId: 'river_pier',
    entryNodeIds: ['pier_arrival'],
  },
  {
    hubId: 'solnysh_explore_mode',
    sceneId: 'solnysh_room',
    entryNodeIds: ['solnysh_door'],
  },
  {
    hubId: 'zarema_room_explore_mode',
    sceneId: 'zarema_albert_room',
    hubText:
      'Комната Заремы и Альберта — уютный беспорядок книг, детских игрушек и чайника на плитке. Настольная лампа горит мягким янтарём; за стеной слышен гул города, но здесь его не слышат. Альберт чинит. Зарема молчит мудро.',
    hubTextRevisit: 'Соседи. Чайник. Тишина дороже Wi-Fi.',
    entryNodeIds: ['zarema_bank_discovery'],
  },
  {
    hubId: 'dream_explore_mode',
    sceneId: 'sleep_dream',
    hubText:
      'Сон — мягкий, нереальный свет, где стены дышат, а время течёт иначе. Строки парят в воздухе, как светящиеся нити; зеркал нет — только эхо, которое ты не писал наяву. Можно бродить, пока не проснёшься.',
    hubTextRevisit: 'Сон. Строки в воздухе. Не засыпай во сне.',
    entryNodeIds: [],
  },
  {
    hubId: 'pier_evening_explore_mode',
    sceneId: 'pier_evening',
    hubText:
      'Вечерний пирс — вода темнее, костёр в бочке рыжее, чем в лесу. Трофим смотрит на поплавок, Ритка перебирает струны. Здесь ЧК дышит спокойнее.',
    hubTextRevisit: 'Пирс. Вода. Костёр.',
    entryNodeIds: ['pier_story_intro', 'pier_midnight_fishing_start'],
  },
  {
    hubId: 'library_basement_explore_mode',
    sceneId: 'library_basement',
    hubText:
      'Подвал библиотеки — сырость, железная решётка, запах бумаги, которую не успели сжечь. Катя знает каждый ящик с пометкой «УТИЛЬ».',
    entryNodeIds: ['library_lost_archive_start', 'library_marat_echo'],
  },
  {
    hubId: 'city_square_explore_mode',
    sceneId: 'city_square',
    hubText:
      'Центральная площадь — бетон, ветер, редкие прохожие. Здесь читают вслух то, что нельзя постить. Уличные поэты и дроны делят небо.',
    entryNodeIds: ['act4_quiet_poet_square', 'act4_public_leader', 'act4_peaceful_march', 'act4_march_continues'],
  },
  {
    hubId: 'bunker_explore_mode',
    sceneId: 'underground_bunker',
    hubText:
      'Бункер Сопротивления — зелёный свет, карта с нитями, запах пайки. Максим планирует, Аня держит связь. Здесь гильдия не слышит.',
    entryNodeIds: ['resistance_bunker_hub', 'resistance_story_intro'],
  },
  {
    hubId: 'mainframe_explore_mode',
    sceneId: 'guild_mainframe',
    hubText:
      'Серверная гильдии — ряды стоек, холодный воздух, зелёные индикаторы. Сердце Протокола Забвения бьётся где-то здесь.',
    entryNodeIds: ['act4_quiet_mainframe'],
  },
  {
    hubId: 'factory_roof_explore_mode',
    sceneId: 'factory_roof',
    hubText:
      'Крыша завода — ветер, ржавые перила, огни города и дроны на горизонте. Отсюда видно, куда идёт война.',
    entryNodeIds: ['factory_roof_lookout', 'act6_rooftop_showdown', 'act6_final_confrontation'],
  },
  {
    hubId: 'albert_backroom_explore_mode',
    sceneId: 'albert_backroom',
    hubText:
      'Подсобка «Синей ямы» — мешки зерна, кофемолка, запах жжёного. Здесь Альберт говорит правду, которую в зале не скажешь.',
    entryNodeIds: ['act4_quiet_albert_backroom', 'chk_portwine_pickup'],
  },
  {
    hubId: 'chk_campfire_night_explore_mode',
    sceneId: 'chk_campfire_night',
    hubText:
      'Ночной костёр ЧК — огонь выше, тени длиннее. То, о чём днём молчат, здесь звучит вполголоса под гитару Элис.',
    entryNodeIds: ['chk_campfire_night_arrival', 'chk_portwine_delivered'],
  },
  {
    hubId: 'zarema_room_solo_explore_mode',
    sceneId: 'zarema_room',
    hubText:
      'Комната Заремы — лампа, книга на середине, тишина дороже Wi-Fi. Здесь можно поплакать и никто не запишет в лог.',
    entryNodeIds: ['act4_quiet_zarema_room'],
  },
] as const;

/** Hubs that close the VN overlay — location via scene toast; actions via 3D triggers. */
export const CLOSED_OVERLAY_EXPLORE_HUB_IDS: ReadonlySet<string> = new Set(
  SCENE_EXPLORE_HUB_DEFS.map((def) => def.hubId),
);

/** @deprecated Use CLOSED_OVERLAY_EXPLORE_HUB_IDS */
export const ACT1_FREE_EXPLORATION_HUB_IDS = CLOSED_OVERLAY_EXPLORE_HUB_IDS;

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

export function isClosedOverlayExploreHub(hubId: string): boolean {
  return CLOSED_OVERLAY_EXPLORE_HUB_IDS.has(hubId);
}

/** @deprecated Use isClosedOverlayExploreHub */
export function isAct1FreeExplorationHub(hubId: string): boolean {
  return isClosedOverlayExploreHub(hubId);
}

export function getExploreHubDef(hubId: string): SceneExploreHubDef | undefined {
  return SCENE_EXPLORE_HUB_DEFS.find((def) => def.hubId === hubId);
}

export function getExploreHubForScene(sceneId: SceneId): string | undefined {
  return SCENE_TO_EXPLORE_HUB[sceneId];
}

export function getExploreHubDefForScene(sceneId: SceneId): SceneExploreHubDef | undefined {
  return SCENE_EXPLORE_HUB_DEFS.find((def) => def.sceneId === sceneId);
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
