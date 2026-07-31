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

/**
 * Explore hubs whose prose lives in act JSON / story packs — skip auto-generation
 * and do not duplicate hubText in SCENE_EXPLORE_HUB_DEFS.
 */
export const STORY_DEFINED_EXPLORE_HUB_IDS = new Set([
  'explore_mode',
  'corridor_explore_mode',
  'street_bench_view',
  'pier_explore_mode',
  'factory_explore_mode',
  'basement_explore_mode',
  'solnysh_explore_mode',
]);

/** Single source of truth for scene ↔ explore-hub mapping (topology; prose via contentTruthManifest). */
export const SCENE_EXPLORE_HUB_DEFS: readonly SceneExploreHubDef[] = [
  {
    hubId: 'explore_mode',
    sceneId: 'volodka_room',
    entryNodeIds: ['start', 'go_home', 'act7_legacy_walk', 'act7_true_end', 'sync_end', 'act6_bridge'],
  },
  {
    hubId: 'corridor_explore_mode',
    sceneId: 'volodka_corridor',
    entryNodeIds: ['corridor_door', 'act6_heist_success'],
  },
  {
    hubId: 'street_bench_view',
    sceneId: 'street_night',
    entryNodeIds: [
      'street_bench',
      'act6_escape_success',
      'act6_resistance_formed',
      'act6_resistance_briefing',
      'act6_maria_warning',
      'act7_final_walk',
      'act7_maria_future',
      'resistance_defector_tunnel',
      'resistance_defector_poem_stun',
      'resistance_defector_extract',
    ],
  },
  {
    hubId: 'home_evening_explore_mode',
    sceneId: 'home_evening',
    hubText:
      'Общая кухня пахнет чаем, вареньем и нафталином из шкафа. Радиоприёмник «Океан» шипит между станциями — Зарема называет это «голосом тех, кого Сеть не слышит». За окном — серые панели и неон; здесь, между плитой и столом, время идёт по часам, а не по NTP.',
    hubTextRevisit: 'Кухня. Чайник свистит. Радио шипит.',
    entryNodeIds: [
      'kitchen_table',
      'kitchen_window',
      'bank_transfer_moral',
      'banking_crash_verify',
      'act7_goodbye_zarema',
    ],
  },
  {
    hubId: 'cafe_explore_mode',
    sceneId: 'cafe_evening',
    hubText:
      'Кафе «Синяя яма» — подвал с синими неоновыми трубками, запахом жжёного кофе и старым джазом из колонки без Bluetooth. Стены пропитаны поэтическим кодом: камеры слепнут, микрофоны глохнут. За стойкой — бариста с кибернетической рукой; в углу — Альберт, постукивающий пальцами в нервном ритме.',
    hubTextRevisit: 'Синяя яма. Мёртвая зона. Кофе горячий.',
    entryNodeIds: [
      'go_to_cafe',
      'cafe_enter',
      'blind_spot_approach',
      'poem_undercover_approach',
      'poem_undercover_infiltrate',
      'poem_undercover_identify',
      'poem_undercover_extract',
      'old_code',
      'old_code_read',
      'final_code_virus',
      'final_code_rally',
      'night_before_dawn_maria',
      'night_before_dawn_albert',
      'act7_guild_rebuilding',
      'act7_charter_drafting',
      'act7_community_voice',
      'act7_guild_restored',
      'act7_ending_poet_legacy',
      'act7_poet_legacy_mirror',
      'quest_act2_chk_neon_archive_hack',
    ],
  },
  {
    hubId: 'office_explore_mode',
    sceneId: 'office_day',
    hubText:
      'Офис IT-гильдии — стекло, хром и тихий гул серверов за перегородкой. Терминалы мерцают, коллеги снуют между кабинками с глазами, уставшими от «НейроМоста». Где-то в глубине — кабинет Александра. Воздух пахнет озоном и страхом перед инцидентом #4729.',
    hubTextRevisit: 'Офис. Гул серверов. Александр где-то там.',
    entryNodeIds: [
      'office_alexander',
      'digital_ghost_approach',
      'bank_transfer_culprit',
      'blind_spot_confront',
      'act6_office_confrontation',
      'act6_dmitry_confession',
      'act6_alliance_formed',
      'act6_dmitry_exiled',
      'final_code_core',
      'final_code_deploy',
      'night_before_dawn_dmitry',
      'quest_act2_server_poem_hunt_start',
      'quest_act2_server_poem_office',
      'pier_ritka_office_string',
    ],
  },
  {
    hubId: 'street_winter_explore_mode',
    sceneId: 'street_winter',
    hubText:
      'Зимняя улица — снег хрустит под ногами, пар изо рта, редкие прохожие в тёплых шапках. Город кажется тише, но не менее опасным.',
    entryNodeIds: ['night_watch_child', 'night_watch_friend', 'act7_ending_wanderer', 'act7_wanderer_legacy_mirror'],
  },
  {
    hubId: 'park_explore_mode',
    sceneId: 'park_day',
    hubText:
      'Парк днём — аллеи, скрипучие скамейки без NFC-чипов, шум листвы и далёкий гул города за деревьями. У обелиска — имена тех, кого стёрли после Краха. Здесь «Паноптикум» теряет фокус: слишком много теней. Стихи звучат честнее.',
    hubTextRevisit: 'Парк. Тише, чем в городе. Камень помнит.',
    entryNodeIds: [
      'park_entrance',
      'quest_act3_park_cyber_bloom_start',
      'quest_act3_park_cyber_bloom_alpha',
      'quest_act3_park_cyber_bloom_beta',
      'quest_act3_park_cyber_bloom_gamma',
      'quest_act7_poets_monument_inscription_start',
      'quest_act7_poets_monument_plate',
      'quest_act7_poets_monument_recall',
      'quest_act7_poets_monument_carve',
      'quest_act7_poets_monument_inscribe',
      'act7_final_poem_creation',
      'act7_poem_written',
    ],
  },
  {
    hubId: 'library_explore_mode',
    sceneId: 'library_day',
    hubText:
      'Библиотека — пыльные стеллажи, запах старой бумаги и тихий скрип половиц. На первом этаже — картотека, которую не оцифровали; на третьем — Запретный Фонд за решёткой. Между томами спрятаны истории, которые система пыталась стереть.',
    hubTextRevisit: 'Библиотека. Бумага не зависает.',
    entryNodeIds: [
      'library_entrance',
      'act7_library_archive',
      'archive_forgotten_approach',
      'archive_forgotten_meet',
      'archive_forgotten_save',
      'echo_of_vladimir_approach',
      'echo_of_vladimir_kate',
      'vladimir_secret_room',
      'vladimir_secret_room_read',
      'act7_ending_guardian',
      'act7_guardian_legacy_mirror',
      'quest_act4_street_samizdat_library',
      'quest_act3_zarema_evidence_run_start',
      'library_lost_archive_start',
      'library_archive_fund_key',
      'library_katya_research_start',
      'library_katya_schema',
      'library_katya_crossref',
      'library_katya_night',
      'library_katya_marat_hit',
      'library_katya_research_done',
    ],
  },
  {
    hubId: 'rooftop_explore_mode',
    sceneId: 'rooftop_edge',
    hubText:
      'Край крыши — ветер, огни города внизу и ощущение, что один шаг отделяет тебя от неба. «Высотники» на соседних крышах молчат; белый флаг с словом «ЖИВЫ» трепещет. Здесь слова звучат громче, чем в любой переговорке гильдии.',
    hubTextRevisit: 'Крыша. Ветер. Город как схема данных.',
    entryNodeIds: ['act4_transition', 'act4_rooftop_broadcast', 'quest_act4_rooftop_broadcast_setup_start', 'quest_act4_rooftop_broadcast_repair', 'rooftop_of_the_world', 'roof_of_the_world_approach', 'roof_of_the_world_ending', 'last_poem_approach', 'last_poem_compose', 'last_poem_recite', 'act6_rooftop_showdown', 'solnysh_roof_arrival', 'solnysh_roof_afterglow', 'final_code_approach', 'night_before_dawn_approach', 'act5_dawn', 'act7_bridge', 'act7_rooftop_recital', 'act7_poem_published'],
  },
  {
    hubId: 'factory_explore_mode',
    sceneId: 'abandoned_factory',
    entryNodeIds: [
      'abandoned_workshop',
      'act2_network_initiation',
      'voice_of_the_past_approach',
      'voice_of_the_past_listen_1',
      'voice_of_the_past_listen_2',
      'voice_of_the_past_listen_final',
      'act6_secret_archive_approach',
      'act6_secret_archive_start',
      'act6_secret_archive_door',
      'act6_secret_archive_decode',
      'act6_secret_archive_extract',
      'act6_secret_archive_seal',
      'act6_traitor_approach',
      'act6_factory_investigation',
      'act6_zeka_encounter',
      'act6_zeka_story',
      'act6_zeka_trust_test',
      'act6_zeka_nadzor_origin',
      'act6_traitor_discovery',
      'act6_traitor_revealed',
      'act6_nadzor_revealed',
      'act6_infiltration_prep',
      'act6_nadzor_battle',
      'act6_battle_victory',
      'act6_core_choice',
      'quest_act5_factory_zarya_memory_restore_start',
      'quest_act5_zarya_fragment_1',
      'quest_act5_zarya_fragment_3',
      'factory_baba_zina_tea_kettle',
      'factory_baba_zina_tea_mint',
      'factory_baba_zina_tea_hum',
      'factory_baba_zina_tea_history',
      'act7_system_shutdown',
      'act7_core_battle',
      'act7_nadzor_dies',
    ],
  },
  {
    hubId: 'basement_explore_mode',
    sceneId: 'factory_basement',
    entryNodeIds: [
      'factory_basement',
      'factory_basement_familiar',
      'voices_of_factory_poem',
      'voices_of_factory_protect',
      'machine_confession_approach',
      'machine_confession_scene',
      'machine_confession_scene_familiar',
      'machine_confession_scene_thread',
      'quest_act5_zarya_fragment_2',
      'quest_act5_bunker_poem_key',
      'factory_zarya_storm',
      'factory_zarya_photo',
      'factory_zarya_memory_restore',
    ],
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
      'quest_act4_street_samizdat_chk',
      'quest_act2_server_poem_chk',
      'quest_act2_chk_neon_archive_start',
      'pier_ritka_elis_ask',
      'pier_ritka_elis_pack',
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
    entryNodeIds: ['zarema_bank_discovery', 'night_before_dawn_zarema'],
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
    entryNodeIds: [
      'pier_story_intro',
      'pier_midnight_fishing_start',
      'pier_midnight_fishing_sit',
      'pier_midnight_fishing_bass',
      'pier_midnight_fishing_key',
      'quest_act4_street_samizdat_pier',
      'quest_act2_server_poem_pier',
    ],
  },
  {
    hubId: 'library_basement_explore_mode',
    sceneId: 'library_basement',
    hubText:
      'Подвал библиотеки — сырость, железная решётка, запах бумаги, которую не успели сжечь. Катя знает каждый ящик с пометкой «УТИЛЬ».',
    entryNodeIds: [
      'library_lost_archive_start',
      'library_archive_descent',
      'library_archive_gate',
      'library_lost_archive_found',
      'library_archive_digitize',
      'library_marat_echo',
      'quest_act3_zarema_evidence_secure',
    ],
  },
  {
    hubId: 'city_square_explore_mode',
    sceneId: 'city_square',
    hubText:
      'Центральная площадь — бетон, ветер, редкие прохожие. Здесь читают вслух то, что нельзя постить. Уличные поэты и дроны делят небо.',
    entryNodeIds: [
      'act4_quiet_poet_square',
      'act4_public_leader',
      'act4_peaceful_march',
      'act4_march_continues',
      'act7_exp_epilogue_vision',
    ],
  },
  {
    hubId: 'bunker_explore_mode',
    sceneId: 'underground_bunker',
    hubText:
      'Бункер Сопротивления — зелёный свет, карта с нитями, запах пайки. Максим планирует, Аня держит связь. Здесь гильдия не слышит.',
    entryNodeIds: [
      'resistance_bunker_hub',
      'resistance_story_intro',
      'quest_act5_bunker_code_poem_break_start',
      'quest_act5_bunker_code_break',
      'resistance_defector_rescue_start',
      'resistance_defector_rescued',
      'quest_act6_defector_rescue_expanded_start',
      'quest_act6_defector_infiltrate',
      'quest_act6_defector_free_cell',
      'quest_act6_defector_escape_sewers',
    ],
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
    entryNodeIds: [
      'factory_roof_lookout',
      'act6_rooftop_showdown',
      'act6_final_confrontation',
      'factory_zarya_snow',
    ],
  },
  {
    hubId: 'albert_backroom_explore_mode',
    sceneId: 'albert_backroom',
    hubText:
      'Подсобка «Синей ямы» — мешки зерна, кофемолка, запах жжёного. Здесь Альберт говорит правду, которую в зале не скажешь.',
    entryNodeIds: ['act4_quiet_albert_backroom', 'chk_portwine_pickup', 'final_code_rally', 'night_before_dawn_albert'],
  },
  {
    hubId: 'chk_campfire_night_explore_mode',
    sceneId: 'chk_campfire_night',
    hubText:
      'Ночной костёр ЧК — огонь выше, тени длиннее. То, о чём днём молчат, здесь звучит вполголоса под гитару Элис.',
    entryNodeIds: [
      'chk_campfire_night_arrival',
      'chk_portwine_delivered',
      'pier_ritka_elis_pack',
    ],
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
