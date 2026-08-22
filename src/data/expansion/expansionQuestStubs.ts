/* ─── Quest definitions referenced from expanded dialogue (Albert deep talk) ─── */

import type { QuestDefinition } from '@/shared/types/game';

export const EXPANSION_QUEST_STUBS: QuestDefinition[] = [
  {
    id: 'act1_albert_alliance',
    title: 'Союз с Альбертом',
    description:
      'Альберт предлагает неформальный союз: обмен информацией, прикрытие в гильдии и доступ к закрытым логам. Это не подпись — расследование: условия, проверка на улице, возврат в кафе и закрепление доверия.',
    act: 1,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    hint: 'Кафе → условия союза → улица (слушать) → снова «Синяя яма» → закрепить с Альбертом.',
    objectives: [
      {
        id: 'accept_alliance_brief',
        description: 'Принять предложение союза и выслушать условия',
        type: 'flag_set',
        target: 'act1_albert_alliance_active',
        completed: false,
      },
      {
        id: 'agree_alliance_terms',
        description: 'Согласовать правила обмена и прикрытия',
        type: 'flag_set',
        target: 'act1_albert_terms_agreed',
        completed: false,
      },
      {
        id: 'listen_street_for_albert',
        description: 'Проверить улицу — убедиться, что никто не слушает',
        type: 'location_visited',
        target: 'street_night',
        completed: false,
      },
      {
        id: 'return_cafe_seal',
        description: 'Вернуться в «Синюю яму» для закрепления',
        type: 'location_visited',
        target: 'cafe_evening',
        completed: false,
      },
      {
        id: 'deep_talk_albert',
        description: 'Продолжить глубокий разговор с Альбертом в кафе',
        type: 'npc_talked',
        target: 'albert',
        completed: false,
      },
      {
        id: 'form_alliance',
        description: 'Закрепить союз с Альбертом',
        type: 'flag_set',
        target: 'act1_albert_alliance_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
      { type: 'addXp', value: 60 },
      { type: 'addSkill', skill: 'persuasion', value: 1 },
    ],
    linkedStoryNodeId: 'act1_albert_alliance_start',
    linkedStoryNodeIds: [
      'act1_albert_alliance_start',
      'act1_albert_alliance_terms',
      'act1_albert_alliance_street',
      'act1_albert_alliance_seal',
    ],
    questGiverNpcId: 'albert',
  },
  {
    id: 'act2_archive_seven',
    title: 'Архив-7',
    description:
      'Альберт намекает на Архив-7 — хранилище стёртых стихов и имён. Точка входа — не дверь: три следа (костёр ЧК, стена кафе, серверная), затем чип и checksum правды.',
    act: 2,
    faction: 'network',
    questType: 'side',
    difficulty: 'hard',
    requiresQuests: ['act1_albert_alliance'],
    hint: 'Альберт → костёр ЧК → стена «Синей ямы» → серверная офиса → чип → раскрытие.',
    objectives: [
      {
        id: 'hear_archive_brief',
        description: 'Услышать от Альберта схему трёх следов Архива-7',
        type: 'flag_set',
        target: 'act2_archive_seven_active',
        completed: false,
      },
      {
        id: 'trace_chk_campfire',
        description: 'Снять след у костра ЧК',
        type: 'location_visited',
        target: 'chk_forest_zorge',
        completed: false,
      },
      {
        id: 'trace_cafe_wall',
        description: 'Снять след со стены стихов в кафе',
        type: 'location_visited',
        target: 'cafe_evening',
        completed: false,
      },
      {
        id: 'trace_office_server',
        description: 'Снять след в серверной офиса',
        type: 'location_visited',
        target: 'office_day',
        completed: false,
      },
      {
        id: 'find_archive_chip',
        description: 'Найти чип Архива-7',
        type: 'item_collected',
        target: 'archive7_chip',
        completed: false,
      },
      {
        id: 'unlock_archive_truth',
        description: 'Раскрыть правду Архива-7',
        type: 'flag_set',
        target: 'act2_archive_seven_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'intuition', value: 2 },
      { type: 'addXp', value: 100 },
      { type: 'discoverLore', loreId: 'lore_archive_seven_truth' },
    ],
    linkedStoryNodeId: 'act2_archive_seven_start',
    linkedStoryNodeIds: [
      'act2_archive_seven_start',
      'act2_archive_seven_chk_trace',
      'act2_archive_seven_cafe_trace',
      'act2_archive_seven_resolve',
    ],
    questGiverNpcId: 'albert',
  },

  /* ═══════════════════════════════════════════════════════════════
     MILESTONE-80 STUB QUESTS
     Triggered by albert/zarema/maria/solnysh milestone_80 dialogues.
     Minimal side-quest shells — full content TBD by future content packs.
     ═══════════════════════════════════════════════════════════════ */

  {
    id: 'marat_archive_unlock',
    title: 'Архив Марата',
    description:
      'Альберт передаёт ключ: строку-пароль к архиву Марата — первого прошивщика. Стихи, спрятанные в логах Гильдии тридцать лет, ждут, пока их кто-то услышит. Задача — простая и страшная: открыть архив. Прочитать. Понять, почему Альберт нёс это один.',
    act: 2,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['act1_albert_alliance'],
    hint: 'Кафе → терминал Гильдии → ввести строку-пароль → прочитать стихи Марата → вернуться к Альберту.',
    objectives: [
      {
        id: 'receive_marat_key',
        description: 'Принять ключ-пароль от Альберта',
        type: 'flag_set',
        target: 'albert_marat_archive_key_received',
        completed: false,
      },
      {
        id: 'reach_guild_terminal',
        description: 'Добраться до терминала Гильдии с доступом к логам',
        type: 'location_visited',
        target: 'office_day',
        completed: false,
      },
      {
        id: 'enter_marat_archive',
        description: 'Ввести пароль и открыть архив Марата',
        type: 'flag_set',
        target: 'marat_archive_opened',
        completed: false,
      },
      {
        id: 'read_marat_poems',
        description: 'Прочитать стихи Марата из архива',
        type: 'flag_set',
        target: 'marat_poems_read',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 80 },
      { type: 'addSkill', skill: 'intuition', value: 2 },
      { type: 'setFlag', flag: 'marat_archive_unlocked', flagValue: true },
    ],
    questGiverNpcId: 'albert',
  },

  {
    id: 'zarema_heritage',
    title: 'Наследие Заремы',
    description:
      'Зарема достаёт со дна кухонного шкафа бабушкину тетрадь — стихи, переписанные от руки в шестьдесят восьмом. Книга хранилась в банке с солениями сорок лет. Зарема хочет, чтобы Володька помог донести её до тех, кому она теперь нужна — и решить, кому можно доверить копию.',
    act: 2,
    faction: 'network',
    questType: 'side',
    difficulty: 'easy',
    hint: 'Кухня → книга → проверить копию у Кейт в библиотеке → решить, кому доверить.',
    objectives: [
      {
        id: 'receive_grandmother_book',
        description: 'Принять от Заремы бабушкину тетрадь',
        type: 'flag_set',
        target: 'zarema_grandmother_book_received',
        completed: false,
      },
      {
        id: 'visit_kate_at_library',
        description: 'Отнести тетрадь Кейт в библиотеку для проверки',
        type: 'location_visited',
        target: 'library_day',
        completed: false,
      },
      {
        id: 'verify_book_authenticity',
        description: 'Сверить рукопись с архивными образцами',
        type: 'flag_set',
        target: 'zarema_book_verified',
        completed: false,
      },
      {
        id: 'decide_book_fate',
        description: 'Решить, кому доверить копию тетради',
        type: 'flag_set',
        target: 'zarema_heritage_decided',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 70 },
      { type: 'addKarma', value: 6 },
      { type: 'addSkill', skill: 'empathy', value: 2 },
      { type: 'setFlag', flag: 'zarema_heritage_honored', flagValue: true },
    ],
    questGiverNpcId: 'zarema',
  },

  {
    id: 'eye_blueprint_shutdown',
    title: 'Отключение «Ока»',
    description:
      'Мария разработала код: не взлом, а элегантное отключение. «Око» — система тотального наблюдения гильдии — можно погасить изнутри, если попасть в серверную через Олега. Код уже в коммуникаторе. Дело за малым — за самым опасным «малым» в жизни Володьки.',
    act: 4,
    faction: 'network',
    questType: 'side',
    difficulty: 'hard',
    hint: 'Олег у входа → серверная → загрузить код → подтвердить отключение.',
    objectives: [
      {
        id: 'recruit_oleg',
        description: 'Убедить Олега пропустить в серверную',
        type: 'flag_set',
        target: 'oleg_recruit_hint',
        completed: false,
      },
      {
        id: 'enter_guild_server_room',
        description: 'Проникнуть в серверную Гильдии',
        type: 'location_visited',
        target: 'guild_mainframe',
        completed: false,
      },
      {
        id: 'upload_eye_code',
        description: 'Загрузить код Марии в главный терминал',
        type: 'flag_set',
        target: 'maria_eye_code_uploaded',
        completed: false,
      },
      {
        id: 'confirm_shutdown',
        description: 'Подтвердить отключение «Ока»',
        type: 'flag_set',
        target: 'eye_blueprint_shutdown_confirmed',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 220 },
      { type: 'addKarma', value: 15 },
      { type: 'addSkill', skill: 'coding', value: 4 },
      { type: 'addSkill', skill: 'persuasion', value: 2 },
      { type: 'setFlag', flag: 'eye_blueprint_offline', flagValue: true },
    ],
    questGiverNpcId: 'maria',
  },

  {
    id: 'solnysh_mother_archive',
    title: 'Архив матери Солныш',
    description:
      'Солныш показывает тетрадь матери — подпольщицы, перепечатывавшей запрещённые стихи в подвале школы. Тетрадь — это имена, даты, явки. Гильдия стёрла её мать из реестра, но не из бумаги. Задача — найти, где ещё помнят, и вернуть тетрадь туда, где её сохранят.',
    act: 5,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    hint: 'Комната Солныш → костёр ЧК → встреча с теми, кто помнил её мать.',
    objectives: [
      {
        id: 'receive_mother_notebook',
        description: 'Принять от Солныш тетрадь её матери',
        type: 'flag_set',
        target: 'solnysh_mother_notebook_received',
        completed: false,
      },
      {
        id: 'reach_chk_campfire',
        description: 'Добраться до костра ЧК, где ещё помнят подпольщиков',
        type: 'location_visited',
        target: 'chk_forest_zorge',
        completed: false,
      },
      {
        id: 'find_witness',
        description: 'Найти свидетеля, знавшего мать Солныш',
        type: 'flag_set',
        target: 'solnysh_witness_found',
        completed: false,
      },
      {
        id: 'hand_over_notebook',
        description: 'Передать тетрадь в надёжные руки',
        type: 'flag_set',
        target: 'solnysh_mother_archive_deposited',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 120 },
      { type: 'addKarma', value: 10 },
      { type: 'addSkill', skill: 'empathy', value: 3 },
      { type: 'setFlag', flag: 'solnysh_mother_archive_honored', flagValue: true },
    ],
    questGiverNpcId: 'solnysh',
  },
];
