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
  'act4_final_choice',
  // Act 5 — Финал
  'act5_peaceful_path',
  'ending_reconciliation', // → poem_18 «Вся клевета - вернется в сто крат»
  'ending_creator', // → poem_13 «Эпитафия»
];

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
  act2_bridge: 'Сохрани достоинство — шут побеждает молчанием.',
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
  act3_guild_counterattack: 'Укрой членов Сети — спасай людей.',
  act3_prepare_counter: 'Выйди к людям — правда сильнее протоколов.',
  act3_decision_point: 'Выбери борьбу — слово сильнее молчания.',
  // Act 4
  act4_transition: 'Стань голосом Сети — город ждёт лидера.',
  vera_inspiration: 'Вспомни детские мечты — звёзды ждут тех, кто дерзает.',
  act4_public_leader: 'Мирный марш — сила в правде, не в насилии.',
  act4_peaceful_march: 'Продолжай мирно — каждая жизнь на счету.',
  act4_infiltration_prep: 'Найди союзника внутри — коллега поможет.',
  act4_core_server: 'Отключи Протокол Забвения — спаси память.',
  act4_broadcast_prep: 'Начни вещание — пусть город услышит стихи.',
  act4_broadcast_execute: 'Добавь своё стихотворение — твой голос тоже важен.',
  act4_final_choice: 'Путь мира — переговоры побеждают разрушение.',
  // Act 5
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
    condition: 'Кодинг 8+ и эмпатия ниже 4',
  },
  {
    id: 'ending_poet',
    title: 'Поэт',
    description: 'Собраны ВСЕ стихи Владимира: Реальность — это поэзия, Володька открывает последнюю истину.',
    condition: 'Собраны все 21 стихотворение',
  },
];

/**
 * ENDING_PATHS — paths from act4_final_choice to each ending.
 * Used for navigation/hint systems.
 */
export const ENDING_PATHS: Record<string, string[]> = {
  ending_creator: ['act4_final_choice', 'act5_peaceful_path', 'ending_reconciliation', 'ending_creator'],
  ending_rebel: ['act4_final_choice', 'act5_revolution_path', 'ending_rebel'],
  ending_exile: ['act4_final_choice', 'act5_exile_path', 'ending_exile'],
  ending_machine: ['act4_final_choice', 'act5_revolution_path', 'ending_machine'],
  ending_poet: ['act4_final_choice', 'act5_poet_path', 'ending_poet'],
};

/**
 * POEM_UNLOCK_ORDER — the canonical order poems are revealed in the golden path.
 * Used by UI and progression systems.
 */
export const POEM_UNLOCK_ORDER: string[] = [
  // Act 1 — Пробуждение
  'poem_2',  // «Смерть есть лишь начало» — start
  'poem_19', // «Неоновая Панихида» — street_bench_view
  'poem_20', // «Чип в затылке» — office_alexander
  'poem_1',  // «Когда в игру вступают деньги...» — fix_success
  'poem_3',  // «И что-то пошло не так» — balcony_thought
  'poem_4',  // «Снова вечер, тоска и сплин» — friday_arrives
  'poem_16', // «Папе — вычислительный ларь-чемодан!» — friday_arrives (bonus)
  // Act 2 — Сеть
  'poem_6',  // «Ну а тебе, друг мой!» — maria_introduction
  'poem_14', // «Обязательно подумаю» — library_entrance (Act 2 side)
  'poem_7',  // «В этом мире..» — reading_reaction
  'poem_8',  // «Если знаешь куда идти» — volunteer_read
  'poem_9',  // «Быть шутом в глазах людей» — act2_bridge
  'poem_5',  // «Ты держишь в руках куски того» — cafe_evening_end
  'poem_15', // «Я отпуск - не советую вам господа» — cafe_evening_end (bonus)
  // Act 3 — Война
  'poem_10', // «Я камень» — park_entrance
  'poem_17', // «Мы стремимся ради других» — act3_save_zarema
  'poem_21', // «Белая Река, Чёрный Кабель» — rooftop_of_the_world (Act 3 bonus)
  'poem_11', // «Мой город не отпустит меня к тебе» — maria_warm
  // Act 4 — Революция
  'poem_12', // «Sic itur ad astra» — vera_inspiration
  // Act 5 — Финал
  'poem_18', // «Вся клевета - вернется в сто крат» — ending_reconciliation
  'poem_13', // «Эпитафия» — ending_creator
];
