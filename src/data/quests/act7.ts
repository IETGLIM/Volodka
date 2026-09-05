import type { QuestDefinition } from '@/shared/types/game';

export const QUESTS_ACT7: QuestDefinition[] = [
  /* ═══════════════════════════════════════════════════════════════════
     ACT 7 — РАЗРЕШЕНИЕ: Rebuilding, Legacy, New Dawn
     ═══════════════════════════════════════════════════════════════════ */

  /* ─────────────── QUEST: Восстановление гильдии ─────────────── */
  {
    id: 'rebuild_the_guild',
    title: 'Восстановление гильдии',
    description: 'После разоблачения «Надзора» IT-гильдия в руинах. Но без неё город погрузится в хаос — инфраструктура рухнет, данные исчезнут, связь прервётся. Нужно восстановить гильдию на новых принципах: свобода слова, открытый код, защита данных.',
    act: 7,
    faction: 'it_guild',
    questType: 'main',
    difficulty: 'medium',
    hint: 'Начни с кафе — там собираются те, кто готов строить новое.',
    requiresQuests: ['rooftop_confrontation'],
    objectives: [
      {
        id: 'gather_survivors',
        description: 'Собрать уцелевших членов гильдии в кафе',
        type: 'location_visited',
        target: 'cafe_evening',
        completed: false,
      },
      {
        id: 'draft_new_charter',
        description: 'Составить новый устав гильдии с бывшими коллегами',
        type: 'npc_talked',
        target: 'sergey',
        completed: false,
      },
      {
        id: 'establish_library_archive',
        description: 'Создать публичный архив знаний в библиотеке',
        type: 'location_visited',
        target: 'library_day',
        completed: false,
      },
      {
        id: 'elect_new_council',
        description: 'Избрать новый совет гильдии на демократических принципах',
        type: 'flag_set',
        target: 'new_council_elected',
        completed: false,
      },
      {
        id: 'restore_guild_network',
        description: 'Восстановить городскую сеть под новым управлением',
        type: 'flag_set',
        target: 'guild_restored',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'persuasion', value: 6 },
      { type: 'addSkill', skill: 'empathy', value: 5 },
      { type: 'addKarma', value: 30 },
      { type: 'setFlag', flag: 'guild_rebuilt', flagValue: true },
      { type: 'addXp', value: 400 },
    ],
    linkedStoryNodeId: 'act7_guild_rebuilding',
    linkedStoryNodeIds: [
      'act7_guild_rebuilding',
      'act7_charter_drafting',
      'act7_community_voice',
      'act7_library_archive',
      'act7_guild_restored',
    ],
    questGiverNpcId: 'anya',
  },

  /* ─────────────── QUEST: Отключение системы ─────────────── */
  {
    id: 'system_takedown',
    title: 'Отключение системы',
    description: '«Надзор» всё ещё функционирует — ослабленный, но живой. Его ядро продолжает работать в глубинах заброшенной фабрики. Пришло время отключить систему навсегда. Но будь готов — она будет защищаться.',
    act: 7,
    faction: 'network',
    questType: 'main',
    difficulty: 'hard',
    hint: 'Без союзников к ядру не пробиться. Собери отряд перед штурмом.',
    requiresQuests: ['rebuild_the_guild'],
    canRetry: false,
    objectives: [
      {
        id: 'assemble_strike_team',
        description: 'Собрать ударный отряд из лучших бойцов сопротивления',
        type: 'npc_talked',
        target: 'maxim',
        completed: false,
      },
      {
        id: 'battle_to_core',
        description: 'Пробиться с боем к ядру «Надзора»',
        type: 'flag_set',
        target: 'path_to_core_cleared',
        completed: false,
      },
      {
        id: 'disable_core_defenses',
        description: 'Отключить защитные системы ядра',
        type: 'flag_set',
        target: 'core_defenses_disabled',
        completed: false,
        poemPowerBypass: 'poem_act6_07',
        poemPowerHint: 'Стихотворение «Финал — не конец» отключит защиту',
      },
      {
        id: 'execute_shutdown',
        description: 'Запустить процедуру отключения «Надзора»',
        type: 'flag_set',
        target: 'nadzor_shutdown_complete',
        completed: false,
      },
      {
        id: 'witness_system_death',
        description: 'Стать свидетелем смерти системы',
        type: 'flag_set',
        target: 'nadzor_destroyed',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'coding', value: 8 },
      { type: 'addSkill', skill: 'logic', value: 6 },
      { type: 'addKarma', value: 25 },
      // setFlag «nadzor_destroyed» удалён: дублирует objective
      // witness_system_death (аудит EXPERT #3).
      { type: 'addXp', value: 500 },
    ],
    linkedStoryNodeId: 'act7_guild_restored',
    linkedStoryNodeIds: [
      'act7_guild_restored',
      'act7_system_shutdown',
      'act7_core_battle',
      'act7_nadzor_dies',
    ],
    questGiverNpcId: 'maxim',
  },

  /* ─────────────── QUEST: Финальное стихотворение ─────────────── */
  {
    id: 'final_poem',
    title: 'Финальное стихотворение',
    description: 'Система пала. Гильдия восстановлена. Город свободен. Но что-то по-прежнему не завершено. Ты чувствуешь, что внутри тебя зреет последнее стихотворение — то, которое подведёт итог всему. Найди тихое место и напиши его.',
    act: 7,
    faction: undefined,
    questType: 'main',
    difficulty: 'medium',
    hint: 'Парк днём — единственное место, где можно услышать собственные мысли.',
    requiresQuests: ['system_takedown'],
    canRetry: false,
    objectives: [
      {
        id: 'find_inspiration_park',
        description: 'Найти вдохновение в парке',
        type: 'location_visited',
        target: 'park_day',
        completed: false,
      },
      {
        id: 'reflect_on_journey',
        description: 'Осмыслить весь пройденный путь',
        type: 'flag_set',
        target: 'journey_reflected',
        completed: false,
      },
      {
        id: 'compose_masterpiece',
        description: 'Написать финальное стихотворение',
        type: 'flag_set',
        // act7_poem_written sets final_poem_written — not journey_reflected (that is reflect_on_journey).
        target: 'final_poem_written',
        completed: false,
      },
      {
        id: 'recite_on_rooftop',
        description: 'Прочитать финальное стихотворение на крыше',
        type: 'location_visited',
        target: 'rooftop_edge',
        completed: false,
      },
      {
        id: 'publish_final_poem',
        description: 'Опубликовать стихотворение в городской сети',
        type: 'flag_set',
        target: 'final_poem_published',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'writing', value: 12 },
      { type: 'addSkill', skill: 'rhythm', value: 10 },
      { type: 'addKarma', value: 30 },
      // setFlag «final_poem_written» удалён: дублирует objective
      // compose_masterpiece (аудит EXPERT #3).
      { type: 'addXp', value: 500 },
    ],
    linkedStoryNodeId: 'act7_final_poem_creation',
    linkedStoryNodeIds: [
      'act7_final_poem_creation',
      'act7_poem_written',
      'act7_rooftop_recital',
      'act7_poem_published',
    ],
    questGiverNpcId: undefined,
  },

  /* ─────────────── QUEST: Наследие Володьки ─────────────── */
  {
    id: 'volodka_legacy',
    title: 'Наследие Володьки',
    description: 'Всё закончилось. Или только начинается? Пройди по местам, которые изменили тебя — комната, дом, ночная улица. Попрощайся с теми, кто был рядом. И реши: кем ты станешь теперь, когда битва выиграна?',
    act: 7,
    faction: undefined,
    questType: 'main',
    difficulty: 'easy',
    hint: 'Начни с комнаты, где всё началось. Затем пройди по всем, кто был с тобой.',
    requiresQuests: ['final_poem'],
    canRetry: false,
    objectives: [
      {
        id: 'return_to_room',
        description: 'Вернуться в свою комнату — где всё началось',
        type: 'location_visited',
        target: 'volodka_room',
        completed: false,
      },
      {
        id: 'visit_zarema_final',
        description: 'Навестить Зарему дома последний раз',
        type: 'location_visited',
        target: 'home_evening',
        completed: false,
      },
      {
        id: 'walk_street_final',
        description: 'Пройтись по ночной улице в последний раз',
        type: 'location_visited',
        target: 'street_night',
        completed: false,
      },
      {
        id: 'say_goodbye_to_maria',
        description: 'Попрощаться с Викторией',
        type: 'npc_talked',
        target: 'maria',
        completed: false,
      },
      {
        id: 'choose_future',
        description: 'Решить своё будущее — поэт, хранитель, странник',
        type: 'flag_set',
        target: 'volodka_future_chosen',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'writing', value: 10 },
      { type: 'addSkill', skill: 'empathy', value: 8 },
      { type: 'addKarma', value: 40 },
      { type: 'setFlag', flag: 'volodka_legacy_complete', flagValue: true },
      { type: 'discoverLore', loreId: 'lore_volodka_legacy' },
      { type: 'addXp', value: 600 },
    ],
    linkedStoryNodeId: 'act7_legacy_walk',
    linkedStoryNodeIds: [
      'act7_legacy_walk',
      'act7_goodbye_zarema',
      'act7_final_walk',
      'act7_maria_future',
    ],
    questGiverNpcId: 'maria',
  },
];
