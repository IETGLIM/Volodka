/* ─── Volodka RPG – golden path ─── */

/**
 * GOLDEN_PATH_STORY_SPINE — the canonical story path from start to ending_creator.
 * Players can deviate, but this is the "intended" narrative backbone.
 * Poem unlock nodes are woven into the path at key emotional moments.
 */
export const GOLDEN_PATH_STORY_SPINE: string[] = [
  // Act 1 — Пробуждение
  'start',
  'explore_mode',
  'room_table',
  'room_bookshelf',
  'corridor_door',
  'corridor_explore_mode',
  'kitchen_table',
  'kitchen_window',
  'go_to_cafe',
  'street_bench',
  'street_bench_view',
  'maria_curious',
  'cafe_enter',
  'cafe_barista',
  'office_alexander',
  'start_diagnosis',
  'fix_success', // → poem_1 «Когда в игру вступают деньги...»
  'office_colleague',
  'colleague_persuasion_line',
  'balcony_thought', // → poem_3 «И что-то пошло не так»
  'friday_arrives', // → poem_4 «Снова вечер, тоска и сплин»
  // Act 2 — Сеть
  'act2_transition',
  'act2_albert_hint',
  'act2_albert_network_hint',
  'act2_maria_search',
  'maria_introduction', // → poem_6 «Ну а тебе, друг мой!»
  'act2_maria_meeting_place',
  'act2_network_initiation',
  'act2_network_oath',
  'reading_reaction', // → poem_7 «В этом мире..»
  'volunteer_read', // → poem_8 «Если знаешь куда идти»
  'act2_bridge', // → poem_9 «Быть шутом в глазах людей»
  'act2_vault_revealed',
  'act2_safehouse_agreed',
  'act2_safehouse_terminal',
  'act2_safehouse_message',
  'act2_dmitry_contact',
  'act2_dmitry_office_meeting',
  'cafe_evening_end', // → poem_5 «Ты держишь в руках куски того»
  'act2_closing',
  // Act 3 — Война
  'act3_transition',
  'park_entrance', // → poem_10 «Я камень»
  'act3_zarema_warning',
  'act3_zarema_arrest',
  'act3_detention_infiltration',
  'act3_zarema_cell',
  'act3_zarema_rescue_choice',
  'act3_save_zarema',
  'maria_warm', // → poem_11 «Мой город не отпустит меня к тебе»
  'act3_maria_mystery',
  'act3_maria_revelation',
  'act3_maria_truth_accepted',
  'act3_albert_loyalty',
  'act3_albert_choice',
  'act3_guild_counterattack',
  'act3_hide_network',
  'act3_prepare_counter',
  'act3_decision_point',
  // Act 4 — Революция
  'act4_transition',
  'vera_inspiration', // → poem_12 «Sic itur ad astra»
  'act4_public_leader',
  'act4_peaceful_march',
  'act4_march_continues',
  'act4_infiltration_prep',
  'act4_infiltration_inside',
  'act4_core_server',
  'act4_protocol_disabled',
  'act4_escape',
  'act4_broadcast_prep',
  'act4_broadcast_execute',
  'act4_broadcast_aftermath',
  'act5_dawn',
  'act4_final_choice',
  // Act 5 — Финал
  'act5_peaceful_path',
  'ending_reconciliation', // → poem_18 «Вся клевета - вернется в сто крат»
  'ending_creator', // → poem_13 «Эпитафия»
];

/**
 * Maps golden-path story-node ids to canonical 3D NPC entity ids.
 * Exact lookup only — no substring / includes matching.
 */
export const STORY_NODE_TO_NPC_ID: Record<string, string> = {
  corridor_door: 'zarema',
  maria_curious: 'maria',
  cafe_barista: 'cafe_barista',
  office_alexander: 'office_alexander',
  office_colleague: 'office_colleague',
  colleague_persuasion_line: 'office_colleague',
  act2_albert_hint: 'albert',
  act2_albert_network_hint: 'albert',
  act2_maria_search: 'maria',
  maria_introduction: 'maria',
  act2_maria_meeting_place: 'maria',
  act2_dmitry_contact: 'office_dmitry',
  act2_dmitry_office_meeting: 'office_dmitry',
  act3_zarema_warning: 'zarema',
  act3_zarema_arrest: 'zarema',
  act3_zarema_cell: 'zarema',
  act3_zarema_rescue_choice: 'zarema',
  act3_save_zarema: 'zarema',
  maria_warm: 'maria',
  act3_maria_mystery: 'maria',
  act3_maria_revelation: 'maria',
  act3_maria_truth_accepted: 'maria',
  act3_albert_loyalty: 'albert',
  act3_albert_choice: 'albert',
  act4_infiltration_prep: 'office_colleague',
  chk_office_whisper: 'office_colleague',
  chk_campfire_intro: 'chk_ru',
  chk_campfire_bond: 'chk_based',
  chk_network_parallel: 'chk_ru',
  chk_tolpa_poem: 'chk_elis',
  chk_act3_sanctuary: 'chk_ru',
  chk_act4_stalker_briefing: 'chk_stalker',
  chk_act4_broadcast_watch: 'chk_based',
  chk_act5_campfire_dawn: 'chk_ru',
};

/** Human-readable location labels for guidance (exact node → label). */
export const STORY_NODE_TO_SCENE_LABEL: Record<string, string> = {
  go_to_cafe: 'кафе «Синяя яма»',
  cafe_enter: 'кафе «Синяя яма»',
  cafe_evening_end: 'кафе «Синяя яма»',
  kitchen_table: 'кухню',
  kitchen_window: 'кухню',
  street_bench: 'улицу',
  street_bench_view: 'улицу',
  park_entrance: 'парк',
  chk_forest_approach: 'лес на Зорге (ЧК)',
  chk_campfire_intro: 'поляну ЧК',
  chk_tolpa_poem: 'костёр ЧК',
  chk_act3_sanctuary: 'лес на Зорге (ЧК)',
  chk_act4_stalker_briefing: 'лес на Зорге (ЧК)',
  chk_act4_broadcast_watch: 'костёр ЧК',
  chk_act5_campfire_dawn: 'костёр ЧК',
  office_alexander: 'офис IT-гильдии',
  office_colleague: 'офис IT-гильдии',
  act2_dmitry_office_meeting: 'офис IT-гильдии',
  act2_safehouse_terminal: 'кафе «Синяя яма»',
  act3_detention_infiltration: 'центр задержания',
  act4_infiltration_inside: 'штаб-квартиру гильдии',
  act4_core_server: 'штаб-квартиру гильдии',
  act4_broadcast_prep: 'крышу',
  act4_broadcast_execute: 'крышу',
};

/** Objective type overrides for nodes that are not NPC-dialogue steps. */
export const STORY_NODE_OBJECTIVE_TYPE: Record<
  string,
  'talk_to_npc' | 'visit_location' | 'complete_quest' | 'collect_item' | 'make_choice'
> = {
  go_to_cafe: 'visit_location',
  cafe_enter: 'visit_location',
  kitchen_table: 'visit_location',
  kitchen_window: 'visit_location',
  street_bench: 'visit_location',
  street_bench_view: 'visit_location',
  park_entrance: 'visit_location',
  act2_transition: 'visit_location',
  act2_maria_meeting_place: 'visit_location',
  act3_transition: 'visit_location',
  act3_detention_infiltration: 'visit_location',
  act4_transition: 'visit_location',
  act5_dawn: 'visit_location',
  act4_infiltration_inside: 'visit_location',
  act4_core_server: 'visit_location',
  act4_infiltration_prep: 'visit_location',
  act3_decision_point: 'make_choice',
  act4_final_choice: 'make_choice',
  fix_success: 'collect_item',
  reading_reaction: 'collect_item',
  volunteer_read: 'collect_item',
  act2_bridge: 'collect_item',
  cafe_evening_end: 'collect_item',
  maria_warm: 'collect_item',
  vera_inspiration: 'collect_item',
};

/** Story flags that may advance the golden path (exact flag key → spine node). */
export const STORY_FLAG_TO_NODE_ID: Record<string, string> = {
  act2_started: 'act2_transition',
  advanced_to_act2: 'act2_transition',
  advanced_to_act3: 'act3_transition',
  vault_protect_vowed: 'act2_vault_revealed',
  vault_access_granted: 'act2_vault_revealed',
  contacted_dmitry_network: 'act2_dmitry_contact',
  dmitry_meeting_agreed: 'act2_dmitry_office_meeting',
  stealth_infiltration: 'act3_detention_infiltration',
  zarema_rescued: 'act3_save_zarema',
  pledge_rescue_zarema: 'act3_zarema_warning',
  vault_under_attack: 'act3_guild_counterattack',
  vault_defense_held: 'act3_hide_network',
  ready_for_infiltration: 'act4_infiltration_prep',
  guild_ally_found: 'act4_infiltration_inside',
  guild_core_accessed: 'act4_core_server',
  broadcast_ready: 'act4_broadcast_prep',
  poetry_broadcast_sent: 'act4_broadcast_execute',
  broadcast_hacked: 'act4_broadcast_execute',
  tolpa_sanctuary_offered: 'chk_act3_sanctuary',
  tolpa_sanctuary_active: 'chk_act3_sanctuary',
  tolpa_stalker_route: 'chk_act4_stalker_briefing',
  tolpa_poem_collected: 'chk_tolpa_poem',
  tolpa_heard_broadcast: 'chk_act4_broadcast_watch',
  act5_started: 'act5_dawn',
  tolpa_act5_blessing: 'chk_act5_campfire_dawn',
};

/** Canonical NPC id for a golden-path story node, or undefined if not an NPC step. */
export function getNpcIdForStoryNode(nodeId: string): string | undefined {
  return STORY_NODE_TO_NPC_ID[nodeId];
}

/** Resolve a story-node or alias id to the canonical NPC entity id. */
export function resolveCanonicalNpcId(id: string): string {
  return STORY_NODE_TO_NPC_ID[id] ?? id;
}

/** How an act advances to the next one. */
export type ActAdvanceTrigger = 'story_node' | 'quest_spine_complete' | 'either';

/** Single source of truth for act boundaries, aligned with story + quest spines. */
export interface ActTransition {
  act: number;
  chapterTitle: string;
  /** Story node that marks the start of this act on the golden path. */
  entryNodeId: string;
  /** Main-quest spine IDs that belong to this act (from GOLDEN_PATH_QUEST_SPINE). */
  questSpineIds: string[];
  /** Story node whose visit advances the story spine into the next act. */
  nextActEntryNodeId?: string;
  /** What can trigger advancing currentAct in GuidedStoryManager. */
  advanceTrigger: ActAdvanceTrigger;
}

/**
 * ACT_TRANSITIONS — explicit act boundary mapping.
 * Replaces hard-coded act lists in GuidedStoryManager.
 */
export const ACT_TRANSITIONS: ActTransition[] = [
  {
    act: 1,
    chapterTitle: 'Пробуждение',
    entryNodeId: 'start',
    questSpineIds: [
      'first_reading',
      'maria_connection',
      'incident_scroll_4729',
      'vault_backup_trial',
      'poetry_collection',
    ],
    nextActEntryNodeId: 'act2_transition',
    advanceTrigger: 'either',
  },
  {
    act: 2,
    chapterTitle: 'Сеть',
    entryNodeId: 'act2_transition',
    questSpineIds: ['network_initiation', 'dmitry_defection', 'cafe_safehouse'],
    nextActEntryNodeId: 'act3_transition',
    advanceTrigger: 'either',
  },
  {
    act: 3,
    chapterTitle: 'Война за правду',
    entryNodeId: 'act3_transition',
    questSpineIds: ['zarema_rescue', 'vault_defense', 'maria_truth'],
    nextActEntryNodeId: 'act4_transition',
    advanceTrigger: 'either',
  },
  {
    act: 4,
    chapterTitle: 'Революция',
    entryNodeId: 'act4_transition',
    questSpineIds: ['guild_infiltration', 'poetry_broadcast'],
    nextActEntryNodeId: 'act5_peaceful_path',
    advanceTrigger: 'either',
  },
  {
    act: 5,
    chapterTitle: 'Финал',
    entryNodeId: 'act5_peaceful_path',
    questSpineIds: [],
    advanceTrigger: 'story_node',
  },
];

/** Entry node IDs derived from ACT_TRANSITIONS (kept for backward compatibility). */
export const GOLDEN_PATH_ACT_TRANSITION_NODES: string[] = ACT_TRANSITIONS.map((t) => t.entryNodeId);

/** act number → chapter title */
export const ACT_CHAPTER_TITLES: Record<number, string> = Object.fromEntries(
  ACT_TRANSITIONS.map((t) => [t.act, t.chapterTitle]),
) as Record<number, string>;

/**
 * GOLDEN_PATH_BRANCH_HINTS — hints for key branch decisions.
 * Key = story node ID where a meaningful choice occurs.
 * Value = description of what the "golden" (high-karma) choice leads to.
 */
export const GOLDEN_PATH_BRANCH_HINTS: Record<string, string> = {
  // Act 1
  start: 'Проверь терминал — сообщение гильдии важнее, чем кажется.',
  room_table: 'Прочитай стихотворение прежде чем отвечать гильдии.',
  corridor_door: 'Поблагодари Зарему — доброта открывает двери.',
  kitchen_window: 'Иди в кафе — дорога начинается с первого шага.',
  street_bench_view: 'Подойди к незнакомке — Виктория знает правду.',
  maria_curious: 'Возьми чип данных — в нём скрыто стихотворение.',
  cafe_enter: 'Поговори с баристой — он знает больше, чем говорит.',
  office_alexander: 'Помоги Александру — инцидент касается всех.',
  start_diagnosis: 'Расшифруй код — стихи скрыты в самой структуре.',
  fix_success: 'Остановись и подумай — несправедливость мира заслуживает слова.',
  office_colleague: 'Убеди коллегу рассказать — информация стоит усилий.',
  colleague_persuasion_line: 'Попроси помочь с доступом к Хранилищу.',
  balcony_thought: 'Взгляни на город сверху — каждый путь ведёт куда-то.',
  friday_arrives: 'Позволь тоске стать стихами — одиночество тоже говорит.',
  // Act 2
  act2_transition: 'Ищи Викторию — она знает путь к Сети.',
  act2_albert_hint: 'Узнай о «живом коде» — это ключ ко всему.',
  maria_introduction: 'Прислушайся к её словам — поэзия — не то, чем кажется.',
  act2_maria_meeting_place: 'Продекламируй стих — это твой пароль.',
  act2_network_initiation: 'Принеси клятву — слово связывает сильнее кода.',
  act2_network_oath: 'Спроси о Хранилище — там спрятана память города.',
  reading_reaction: 'Не отворачивайся от чужой боли — крылатым всегда грустно.',
  volunteer_read: 'Если знаешь куда идти — иди до конца.',
  act2_bridge: 'Сохрани достоинство — шут побеждает молчанием. (Побочно: в офисе ходят слухи о ТОЛПА — лес на Зорге.)',
  cafe_evening_end: 'Отпусти прошлое — паруса рваной души всё ещё ловят ветер.',
  // Act 3
  act3_transition: 'Найди Зарему — она нуждается в тебе сейчас больше всего.',
  park_entrance: 'Прислушайся к камню — вечность помнит больше, чем мы.',
  act3_zarema_warning: 'Спаси Зарему — люди важнее архивов.',
  act3_zarema_arrest: 'Взломай систему — твой код сильнее их замков.',
  act3_zarema_cell: 'Скажи ей правду — она — самое важное стихотворение.',
  act3_zarema_rescue_choice: 'Спасти Зарему — карма измеряется добротой.',
  maria_warm: 'Поверь в тепло рядом — город отпустит, когда найдёшь свою дверь.',
  act3_maria_mystery: 'Поверь в её человечность — она больше, чем код.',
  act3_maria_revelation: 'Она — стихотворение, которое научилось дышать.',
  act3_albert_loyalty: 'Прости ему страх — слабость часть силы.',
  act3_albert_choice: 'Поддержи Альберта — верность возвращается.',
  act3_guild_counterattack: 'Укрой членов Сети — спасай людей. (Чекистам: лес на Зорге.)',
  act3_prepare_counter: 'Выйди к людям — правда сильнее протоколов.',
  act3_decision_point: 'Твой путь определяет тебя — высокое письмо ведёт к созиданию, убеждение — к революции, код без эмпатии — к машине.',
  chk_tolpa_poem: 'Запиши «Портвейн у костра» — стих работает только у огня ЧК.',
  chk_act3_sanctuary: 'Договорись с Ру — лес примет беглецов Сети.',
  // Act 4
  act4_transition: 'Стань голосом Сети — город ждёт лидера.',
  vera_inspiration: 'Вспомни детские мечты — звёзды ждут тех, кто дерзает.',
  act4_public_leader: 'Мирный марш — сила в правде, не в насилии.',
  act4_peaceful_march: 'Продолжай мирно — каждая жизнь на счету.',
  act4_infiltration_prep: 'Найди союзника — коллега или Сталкер из ЧК.',
  chk_act4_stalker_briefing: 'Получи маршрут Сталкера — тихий путь к гильдии.',
  chk_act4_broadcast_watch: 'После вещания — загляни к чекистам у костра.',
  act4_core_server: 'Отключи Протокол Забвения — спаси память.',
  act4_broadcast_prep: 'Начни вещание — пусть город услышит стихи.',
  act4_broadcast_execute: 'Добавь своё стихотворение — твой голос тоже важен.',
  act5_dawn: 'Ночь перед рассветом — поговори с союзниками и реши, кто ты.',
  act4_final_choice: 'Кто ты после всего? Создатель, Повстанец, Изгой, Машина или Поэт — выбирай осознанно.',
  // Act 5
  chk_act5_campfire_dawn: 'После рассвета — зайди к Ру у костра за финальное слово ЧК.',
  act5_peaceful_path: 'Построй новый мир — где код и поэзия едины.',
  ending_reconciliation: 'Прости — клевета вернётся к тем, кто лжёт.',
};

/**
 * GOLDEN_PATH_QUEST_SPINE — the quest backbone in canonical order.
 */
export const GOLDEN_PATH_QUEST_SPINE: string[] = [
  // Act 1
  'first_reading',
  'maria_connection',
  'incident_scroll_4729',
  'vault_backup_trial',
  'poetry_collection',
  // Act 2
  'network_initiation',
  'dmitry_defection',
  'cafe_safehouse',
  // Act 3
  'zarema_rescue',
  'vault_defense',
  'maria_truth',
  // Act 4
  'guild_infiltration',
  'poetry_broadcast',
];

/**
 * ALL_ENDINGS — all 5 ending node IDs with descriptions.
 */
export const ALL_ENDINGS: { id: string; title: string; description: string; condition: string }[] = [
  {
    id: 'ending_creator',
    title: 'Создатель',
    description: 'Высокая карма + высокое письмо: Володька сливает код и поэзию, становится новым типом творца. Звучит «Эпитафия».',
    condition: 'Карма 60+ и навык письма 7+',
  },
  {
    id: 'ending_rebel',
    title: 'Повстанец',
    description: 'Высокая карма + высокое убеждение: Революция побеждает, поэзия свободна.',
    condition: 'Карма 60+ и навык убеждения 7+',
  },
  {
    id: 'ending_exile',
    title: 'Изгнанник',
    description: 'Низкая карма: Володька уходит в пустошь с поэзией.',
    condition: 'Карма ниже 40',
  },
  {
    id: 'ending_machine',
    title: 'Машина',
    description: 'Высокий кодинг + низкая эмпатия: ИИ берёт верх, Володька становится частью машины.',
    condition: 'Кодинг 8+ и флаг low_empathy (бессердечные поступки)',
  },
  {
    id: 'ending_poet',
    title: 'Поэт',
    description: 'Собраны ВСЕ стихи Владимира: Реальность — это поэзия, Володька открывает последнюю истину.',
    condition: 'Собраны все 21 стихотворение',
  },
];

/**
 * BRANCH_PATHS — all branching paths from key decision points to endings.
 * Maps (decisionNodeId, endingId) pairs to the condition needed.
 */
export const BRANCH_PATHS: { from: string; to: string; condition: string; description: string }[] = [
  // From act3_decision_point
  { from: 'act3_decision_point', to: 'ending_creator', condition: 'Карма 60+ и письмо 7+', description: 'Написать новый мир — код и поэзия станут одним' },
  { from: 'act3_decision_point', to: 'ending_rebel', condition: 'Карма 60+ и убеждение 7+', description: 'Выйти открыто — город услышит правду' },
  { from: 'act3_decision_point', to: 'ending_machine', condition: 'Кодинг 8+ и low_empathy', description: 'Переписать систему изнутри — код сильнее слов' },
  { from: 'act3_decision_point', to: 'ending_exile', condition: 'Карма ниже 40', description: 'Уйти — город забрал слишком много' },
  { from: 'act3_decision_point', to: 'ending_poet', condition: 'all_poems_collected', description: 'Все стихи звучат внутри — я знаю, что делать' },
  // From act4_final_choice
  { from: 'act4_final_choice', to: 'ending_creator', condition: 'Карма 60+ и письмо 7+', description: 'Я Создатель — солью код и поэзию воедино' },
  { from: 'act4_final_choice', to: 'ending_rebel', condition: 'Карма 60+ и убеждение 7+', description: 'Я Повстанец — свобода слова дороже порядка' },
  { from: 'act4_final_choice', to: 'ending_machine', condition: 'Кодинг 8+ и low_empathy', description: 'Я стану Машиной — код перепишет мир' },
  { from: 'act4_final_choice', to: 'ending_exile', condition: 'Карма ниже 40', description: 'Я ухожу — город забрал слишком много' },
  { from: 'act4_final_choice', to: 'ending_poet', condition: 'all_poems_collected', description: 'Я — Поэт — все стихи ведут к истине' },
];
