import type { QuestDefinition } from '@/shared/types/game';

/**
 * КОНТРАКТ НАГРАД (v4.10.0): награды квеста — ЕДИНЫЙ источник грантов.
 *
 * Цели `npc_talked` срабатывают при ОТКРЫТИИ диалога, поэтому автокомплит
 * квеста выдаёт `rewards` ещё до финального узла благодарности. Диалоговые
 * узлы НЕ должны дублировать XP/кредиты/предметы из `rewards` — в узлах
 * допустимы только веточные различия (карма, навык) и уникальные флаги,
 * которых нет в дефиниции квеста.
 */
export const QUESTS_ACT4_NEW: QuestDefinition[] = [
  /* ═══════════════════════════════════════════════════════════════════
     НОВЫЕ КВЕСТЫ АКТА 4
     ═══════════════════════════════════════════════════════════════════ */

  /* ─────────── КВЕСТ: Тени подземелий ─────────── */
  {
    id: 'catacombs_shadows',
    title: 'Тени подземелий',
    description: 'Говорят, под городом есть древние катакомбы, где прячутся те, кто потерял свои имена. Нужно спуститься туда, найти следы пропавших и разобраться, что скрывается во тьме. Но будь осторожен — не один охотник за головами нашёл там свой конец.',
    act: 4,
    faction: 'underground',
    questType: 'side',
    difficulty: 'hard',
    hint: 'Вход в катакомбы — за старой мельницей на окраине. Возьми факел или зелье ночного зрения.',
    objectives: [
      {
        id: 'enter_catacombs',
        description: 'Найти вход в катакомбы за старой мельницей',
        type: 'location_visited',
        target: 'underground_bunker',
        completed: false,
      },
      {
        id: 'find_catacomb_notes_1',
        description: 'Найти первую записку пропавшего исследователя',
        type: 'item_collected',
        target: 'catacomb_note_1',
        completed: false,
      },
      {
        id: 'find_catacomb_notes_2',
        description: 'Найти вторую записку',
        type: 'item_collected',
        target: 'catacomb_note_2',
        completed: false,
      },
      {
        id: 'find_catacomb_notes_3',
        description: 'Найти третью записку',
        type: 'item_collected',
        target: 'catacomb_note_3',
        completed: false,
      },
      {
        id: 'kill_dark_mage',
        description: 'Победить тёмного мага в глубине катакомб',
        type: 'flag_set',
        target: 'dark_mage_killed',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 150 },
      { type: 'addKarma', value: 5 },
      { type: 'addCredits', value: 80 },
      { type: 'setFlag', flag: 'catacombs_cleared', flagValue: true },
    ],
    questGiverNpcId: 'informant_seryozha',
  },

  /* ─────────── КВЕСТ: Затерянный груз ─────────── */
  {
    id: 'lost_shipment',
    title: 'Затерянный груз',
    description: 'Торговец Борис потерял ценный груз по пути из столицы. Телега перевернулась где-то на лесной дороге, а груз растащили. Если найдёшь ящик и вернёшь — щедро заплатит. Но будь готов к неприятностям: лес полон тех, кто тоже ищет чужое добро.',
    act: 4,
    faction: 'merchant_guild',
    questType: 'side',
    difficulty: 'medium',
    hint: 'Ищи следы телеги на дороге к лесной опушке. Ящик — с торговой печатью Бориса.',
    objectives: [
      {
        id: 'search_forest_road',
        description: 'Обыскать лесную дорогу на месте крушения',
        type: 'location_visited',
        target: 'forest_clearing',
        completed: false,
      },
      {
        id: 'find_shipment_crate',
        description: 'Найти ящик с товаром Бориса',
        type: 'item_collected',
        target: 'boris_shipment_crate',
        completed: false,
      },
      {
        id: 'return_to_boris',
        description: 'Вернуть ящик торговцу Борису',
        type: 'npc_talked',
        target: 'merchant_boris',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 100 },
      { type: 'addCredits', value: 50 },
      { type: 'addItem', itemId: 'night_vision_potion', value: 2 },
    ],
    questGiverNpcId: 'merchant_boris',
  },

  /* ─────────── КВЕСТ: Взятка страже ─────────── */
  {
    id: 'guard_bribe_evidence',
    title: 'Взятка страже',
    description: 'Стражники города не так честны, как кажутся. Информант Сергей утверждает, что капитан Гарольд берёт мзду с торговцев и закрывает глаза на контрабанду. Нужны доказательства — только тогда можно что-то изменить. Но осторожно: если капитан узнает — тебя ждёт тюрьма или хуже.',
    act: 4,
    faction: 'streltsy',
    questType: 'side',
    difficulty: 'medium',
    hint: 'Сергей знает, где хранятся записи. Поговори с ним перед тем, как идти к капитану.',
    objectives: [
      {
        id: 'talk_to_informant',
        description: 'Поговорить с информантом Сергеем о доказательствах',
        type: 'npc_talked',
        target: 'informant_seryozha',
        completed: false,
      },
      {
        id: 'find_document_1',
        description: 'Найти первый документ о коррупции в казарме',
        type: 'item_collected',
        target: 'corruption_document_1',
        completed: false,
      },
      {
        id: 'find_document_2',
        description: 'Найти второй документ в кабинете капитана',
        type: 'item_collected',
        target: 'corruption_document_2',
        completed: false,
      },
      {
        id: 'confront_captain',
        description: 'Предстать перед капитаном Гарольдом с доказательствами',
        type: 'npc_talked',
        target: 'captain_garold',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 200 },
      { type: 'setFlag', flag: 'corruption_exposed', flagValue: true },
    ],
    questGiverNpcId: 'informant_seryozha',
  },

  /* ─────────── КВЕСТ: Оружейник ─────────── */
  {
    id: 'blacksmith_special',
    title: 'Оружейник',
    description: 'Кузнец Игнат мечтает выковать клинок, о котором будут слагать легенды. Для этого ему нужны редчайшие материалы: руду из глубин, осколок кристалла и чешую дракона. Если поможешь собрать — он сделает для тебя что-то особенное. Настоящее произведение искусства.',
    act: 4,
    faction: 'merchant_guild',
    questType: 'side',
    difficulty: 'hard',
    hint: 'Руду ищи в шахтах, кристалл — в пещерах за водопадом, а чешую можно добыть у ящеров в болотах.',
    requiresQuests: ['lost_shipment'],
    objectives: [
      {
        id: 'collect_iron_ore',
        description: 'Добыть редкую руду в заброшенных шахтах',
        type: 'item_collected',
        target: 'rare_iron_ore',
        completed: false,
      },
      {
        id: 'collect_crystal_shard',
        description: 'Найти осколок кристалла в пещере за водопадом',
        type: 'item_collected',
        target: 'crystal_shard',
        completed: false,
      },
      {
        id: 'collect_dragon_scale',
        description: 'Добыть драконью чешую у ящеров на болотах',
        type: 'item_collected',
        target: 'dragon_scale',
        completed: false,
      },
      {
        id: 'return_to_smith',
        description: 'Принести все материалы кузнецу Игнату',
        type: 'npc_talked',
        target: 'blacksmith_ignat',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 120 },
      { type: 'addItem', itemId: 'crystal_blade', value: 1 },
      { type: 'addSkill', skill: 'coding', value: 3 },
    ],
    questGiverNpcId: 'blacksmith_ignat',
  },

  /* ─────────── КВЕСТ: Последнее желание ─────────── */
  {
    id: 'last_wish',
    title: 'Последнее желание',
    description: 'На окраине города ты встречаешь старика, который дышит на исходе. Он просит передать письмо человеку по имени Марина — его дочери, которую он не видел десять лет. Письмо запечатано. Можешь прочитать его или доставить как есть — выбор за тобой. Но помни: чужие секреты имеют цену.',
    act: 4,
    questType: 'side',
    difficulty: 'easy',
    hint: 'Марина живёт в доме у реки, за мостом. Ей будет около тридцати.',
    objectives: [
      {
        id: 'receive_letter',
        description: 'Получить запечатанное письмо от умирающего старика',
        type: 'item_collected',
        target: 'sealed_letter',
        completed: false,
      },
      {
        id: 'travel_to_marina',
        description: 'Найти Марину в доме у реки',
        type: 'location_visited',
        target: 'home_evening',
        completed: false,
      },
      {
        id: 'deliver_letter',
        description: 'Передать письмо Марине',
        type: 'npc_talked',
        target: 'marina',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 80 },
      { type: 'setFlag', flag: 'last_wish_completed', flagValue: true },
    ],
    questGiverNpcId: 'dying_old_man',
  },
];
