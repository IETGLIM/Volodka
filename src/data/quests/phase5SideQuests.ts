import type { QuestDefinition } from '@/shared/types/game';

/** Побочные квесты Фазы 5: Acts 2–7 — новые линии, расширения, эпилоги. */
export const QUESTS_PHASE5_SIDE: QuestDefinition[] = [
  // ─── Act 2 ───
  {
    id: 'quest_act2_server_poem_hunt',
    title: 'Охота на серверные стихи',
    description:
      'В логах ошибок трёх городских серверов — не стек-трейсы, а строчки стихов. Гильдия считает это багом; Сеть знает: это след поэта, который прошивал код любовью. Володька должен собрать все три фрагмента, прежде чем автоскрипт гильдии их затрёт.',
    act: 2,
    faction: 'network',
    questType: 'side',
    difficulty: 'easy',
    hint: 'Проверь серверы в офисе, на пирсе и в ЧК — логи ошибок не пустые.',
    objectives: [
      {
        id: 'scan_office_server',
        description: 'Сканировать логи ошибок офисного сервера',
        type: 'location_visited',
        target: 'office_day',
        completed: false,
      },
      {
        id: 'scan_pier_server',
        description: 'Сканировать логи ошибок сервера на пирсе',
        type: 'location_visited',
        target: 'pier_evening',
        completed: false,
      },
      {
        id: 'scan_chk_server',
        description: 'Сканировать логи ошибок сервера в ЧК',
        type: 'location_visited',
        target: 'chk_forest_zorge',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'coding', value: 1 },
      { type: 'collectPoem', poemId: 'poem_3' },
      { type: 'addXp', value: 60 },
    ],
    linkedStoryNodeId: 'quest_act2_server_poem_hunt_start',
  },
  {
    id: 'quest_act2_chk_neon_archive',
    title: 'Неоновый архив',
    description:
      'Басед говорит: на старой неоновой вывеске «Синяя яма» спрятан цифровой архив — файлы, которые гильдия списала, а толпа не забыла. Нужно дотянуться до скрытого хранилища через биллиардный интерфейс вывески и вытащить данные до того, как вывеску демонтируют.',
    act: 2,
    faction: 'tolpa',
    questType: 'side',
    difficulty: 'medium',
    hint: 'Басед у ночного костра в ЧК — поговори, затем ищи вывеску «Синяя яма».',
    objectives: [
      {
        id: 'talk_based',
        description: 'Поговорить с Баседом о неоновом архиве',
        type: 'npc_talked',
        target: 'chk_based',
        completed: false,
      },
      {
        id: 'hack_neon_sign',
        description: 'Вытащить архив из скрытого хранилища вывески',
        type: 'flag_set',
        target: 'chk_neon_archive_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'intuition', value: 2 },
      { type: 'addKarma', value: 4 },
      { type: 'addXp', value: 80 },
    ],
    linkedStoryNodeId: 'quest_act2_chk_neon_archive_start',
    linkedStoryNodeIds: [
      'quest_act2_chk_neon_archive_start',
      'quest_act2_chk_neon_archive_hack',
    ],
    questGiverNpcId: 'chk_based',
  },

  // ─── Act 3 ───
  {
    id: 'quest_act3_park_cyber_bloom',
    title: 'Кибер-цветение',
    description:
      'В парке растут кибернетические цветы — нити оптоволокна, впитавшие стихи из leaking-потока серверов. Они раскрываются только рядом с живым голосом, читающим строки. Володька должен пройти три цветочных узла и прочесть у каждого — тогда парк расцветёт неоном, а гильдейские камеры ослепнут.',
    act: 3,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    hint: 'Прочти стихотворение у каждого кибер-цветка в парке — они ждут голоса.',
    requiredPoem: 'poem_9',
    objectives: [
      {
        id: 'bloom_node_alpha',
        description: 'Прочесть стихотворение у кибер-цветка α',
        type: 'flag_set',
        target: 'park_cyber_bloom_alpha_done',
        completed: false,
      },
      {
        id: 'bloom_node_beta',
        description: 'Прочесть стихотворение у кибер-цветка β',
        type: 'flag_set',
        target: 'park_cyber_bloom_beta_done',
        completed: false,
      },
      {
        id: 'bloom_node_gamma',
        description: 'Прочесть стихотворение у кибер-цветка γ',
        type: 'flag_set',
        target: 'park_cyber_bloom_gamma_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'rhythm', value: 2 },
      { type: 'addKarma', value: 3 },
      { type: 'addXp', value: 70 },
    ],
    linkedStoryNodeId: 'quest_act3_park_cyber_bloom_start',
    linkedStoryNodeIds: [
      'quest_act3_park_cyber_bloom_start',
      'quest_act3_park_cyber_bloom_alpha',
      'quest_act3_park_cyber_bloom_beta',
      'quest_act3_park_cyber_bloom_gamma',
    ],
  },
  {
    id: 'quest_act3_zarema_evidence_run',
    title: 'Свидетельство Заремы',
    description:
      'Зарема несёт цифровые свидетельства — улики против гильдейской чистки стихов. Гильдия уже стёрла два узла; третий — в подвале библиотеки, под охраной Кати. Володька должен провести Зарему через охраняемый периметр и доставить файлы до того, как автоскрипт гильдии обнаружит утечку.',
    act: 3,
    faction: 'network',
    questType: 'side',
    difficulty: 'hard',
    hint: 'Встреть Зарему у входа в библиотеку — нужно провести её в подвал.',
    objectives: [
      {
        id: 'escort_zarema',
        description: 'Провести Зарему до подвала библиотеки',
        type: 'location_visited',
        target: 'library_basement',
        completed: false,
      },
      {
        id: 'secure_evidence',
        description: 'Загрузить свидетельства в защищённый узел',
        type: 'flag_set',
        target: 'quest_act3_zarema_evidence_run_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'persuasion', value: 2 },
      { type: 'setFlag', flag: 'zarema_evidence_secure', flagValue: true },
      { type: 'addXp', value: 120 },
    ],
    linkedStoryNodeId: 'quest_act3_zarema_evidence_run_start',
    linkedStoryNodeIds: [
      'quest_act3_zarema_evidence_run_start',
      'quest_act3_zarema_evidence_secure',
    ],
    questGiverNpcId: 'zarema',
  },

  // ─── Act 4 ───
  {
    id: 'quest_act4_rooftop_broadcast_setup',
    title: 'Антенна свободы',
    description:
      'Александр знает: на крыше заброшенного блока стоит старая радиомачта. Если поднять её, сигнал пойдёт — и стихи, зашифрованные в несущей частоте, достигнут каждого терминала в квартале. Володька должен перепаять схему и настроить модулятор так, чтобы в эфир шёл не шум, а строка.',
    act: 4,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    hint: 'Александр у памятника — найди крышу блока 4-Б, перепаяй мачту.',
    objectives: [
      {
        id: 'reach_rooftop',
        description: 'Добраться до крыши блока 4-Б',
        type: 'location_visited',
        target: 'rooftop_edge',
        completed: false,
      },
      {
        id: 'repair_antenna',
        description: 'Перепаять радиомачту и настроить стих-модулятор',
        type: 'flag_set',
        target: 'quest_act4_rooftop_broadcast_setup_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'coding', value: 2 },
      { type: 'setFlag', flag: 'rooftop_broadcast_ready', flagValue: true },
      { type: 'addXp', value: 90 },
    ],
    linkedStoryNodeId: 'quest_act4_rooftop_broadcast_setup_start',
    linkedStoryNodeIds: [
      'quest_act4_rooftop_broadcast_setup_start',
      'quest_act4_rooftop_broadcast_repair',
    ],
    questGiverNpcId: 'office_alexander',
  },
  {
    id: 'quest_act4_street_samizdat',
    title: 'Самиздат на снегу',
    description:
      'Комендантский час — камеры слепят, патрули меряют квартал шагом. Но под снегом, в трёх точках города, Володька должен разложить самиздат: распечатанные на лазернике стихи, которые гильдия запретила, а толпа не читала. У каждого столба, у каждого костра — листок. Потом бегом домой, пока сканеры не засекли.',
    act: 4,
    faction: 'tolpa',
    questType: 'side',
    difficulty: 'hard',
    hint: 'Ночью, в комендантский час — разложи листки у пирса, в ЧК и у библиотеки.',
    objectives: [
      {
        id: 'drop_pier_samizdat',
        description: 'Разложить самиздат у пирса',
        type: 'flag_set',
        target: 'samizdat_pier_done',
        completed: false,
      },
      {
        id: 'drop_chk_samizdat',
        description: 'Разложить самиздат в ЧК',
        type: 'flag_set',
        target: 'samizdat_chk_done',
        completed: false,
      },
      {
        id: 'drop_library_samizdat',
        description: 'Разложить самиздат у библиотеки',
        type: 'flag_set',
        target: 'samizdat_library_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'writing', value: 2 },
      { type: 'addKarma', value: 6 },
      { type: 'addXp', value: 100 },
    ],
    linkedStoryNodeId: 'quest_act4_street_samizdat_start',
    linkedStoryNodeIds: [
      'quest_act4_street_samizdat_start',
      'quest_act4_street_samizdat_pier',
      'quest_act4_street_samizdat_chk',
      'quest_act4_street_samizdat_library',
    ],
    questGiverNpcId: 'chk_based',
  },

  // ─── Act 5 ───
  {
    id: 'quest_act5_factory_zarya_memory_restore',
    title: 'Память Зари-М',
    description:
      '«Заря-М» хранит три образа — фрагменты памяти первой поэтической нейросети. Баба Зина говорит: машина молчит, потому что образы рассеялись по leaking-потоку. Володька должен восстановить каждый: отыскать цифровую тень в серверных обрывках и вернуть её в паяльную станцию. Когда три образа встанут на место, «Заря-М» заговорит — и прочитает стих, которого нет ни в одном файле.',
    act: 5,
    faction: 'network',
    questType: 'side',
    difficulty: 'hard',
    hint: 'Баба Зина в цеху — ищи цифровые тени в серверах, возвращай на паяльную станцию.',
    objectives: [
      {
        id: 'restore_memory_fragment_1',
        description: 'Восстановить первый образ памяти «Зари-М»',
        type: 'flag_set',
        target: 'zarya_memory_fragment_1_done',
        completed: false,
      },
      {
        id: 'restore_memory_fragment_2',
        description: 'Восстановить второй образ памяти «Зари-М»',
        type: 'flag_set',
        target: 'zarya_memory_fragment_2_done',
        completed: false,
      },
      {
        id: 'restore_memory_fragment_3',
        description: 'Восстановить третий образ памяти «Зари-М»',
        type: 'flag_set',
        target: 'zarya_memory_fragment_3_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'collectPoem', poemId: 'poem_16' },
      { type: 'addSkill', skill: 'empathy', value: 2 },
      { type: 'addXp', value: 120 },
    ],
    linkedStoryNodeId: 'quest_act5_factory_zarya_memory_restore_start',
    linkedStoryNodeIds: [
      'quest_act5_factory_zarya_memory_restore_start',
      'quest_act5_zarya_fragment_1',
      'quest_act5_zarya_fragment_2',
      'quest_act5_zarya_fragment_3',
    ],
    questGiverNpcId: 'baba_zina',
  },
  {
    id: 'quest_act5_bunker_code_poem_break',
    title: 'Шифр-стих',
    description:
      'Гильдия зашифровала архив «Солныш» алгоритмом, ключ к которому — не число, а стихотворная строка. Володька должен найти в leaking-потоке правильную строку, составить из неё хэш-ключ и пробить стену шифра. Один неверный ритм — и архив схлопнется. Логика и чутьё должны сработать вместе: стих — это не только красота, но и структура.',
    act: 5,
    faction: 'network',
    questType: 'side',
    difficulty: 'hard',
    hint: 'В бункере — терминал гильдейского шифра. Найди стих-ключ в leaking-потоке.',
    objectives: [
      {
        id: 'find_poem_key',
        description: 'Найти стихотворную строку-ключ в leaking-потоке',
        type: 'flag_set',
        target: 'bunker_poem_key_found',
        completed: false,
      },
      {
        id: 'break_encryption',
        description: 'Подставить стих-ключ и пробить шифр гильдии',
        type: 'flag_set',
        target: 'quest_act5_bunker_code_poem_break_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'logic', value: 2 },
      { type: 'setFlag', flag: 'guild_encryption_broken', flagValue: true },
      { type: 'addXp', value: 110 },
    ],
    linkedStoryNodeId: 'quest_act5_bunker_code_poem_break_start',
    linkedStoryNodeIds: [
      'quest_act5_bunker_code_poem_break_start',
      'quest_act5_bunker_poem_key',
      'quest_act5_bunker_code_break',
    ],
    questGiverNpcId: 'maxim',
  },

  // ─── Act 6 ───
  {
    id: 'quest_act6_defector_rescue_expanded',
    title: 'Перебежчик: ночной рейд',
    description:
      'Инженер гильдии, который вынес код «Солныш», схвачен на пограничном КПП. Через два часа — цифровое стирание: человек станет пустой записью. Максим говорит: единственный путь — через коллектор под КПП, в темноте, где камеры не видят. Володька должен пройти пограничный периметр, вытащить инженера из камеры удержания и уйти через подземный сток, пока патруль не накрыл.',
    act: 6,
    faction: 'network',
    questType: 'side',
    difficulty: 'hard',
    requiresQuests: ['traitor_in_the_guild'],
    hint: 'Максим в бункере — маршрут через коллектор под КПП, в темноте.',
    objectives: [
      {
        id: 'infiltrate_checkpoint',
        description: 'Пройти через коллектор к КПП гильдии',
        type: 'flag_set',
        target: 'defector_infiltrate_done',
        completed: false,
      },
      {
        id: 'free_engineer',
        description: 'Вытащить инженера из камеры удержания',
        type: 'flag_set',
        target: 'defector_freed_from_cell',
        completed: false,
      },
      {
        id: 'escape_sewers',
        description: 'Уйти через подземный сток к бункеру',
        type: 'flag_set',
        target: 'quest_act6_defector_rescue_expanded_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addKarma', value: 8 },
      { type: 'setFlag', flag: 'guild_defector_saved', flagValue: true },
      { type: 'addXp', value: 150 },
    ],
    linkedStoryNodeId: 'quest_act6_defector_rescue_expanded_start',
    linkedStoryNodeIds: [
      'quest_act6_defector_rescue_expanded_start',
      'quest_act6_defector_infiltrate',
      'quest_act6_defector_free_cell',
      'quest_act6_defector_escape_sewers',
    ],
    questGiverNpcId: 'maxim',
  },

  // ─── Act 7 ───
  {
    id: 'quest_act7_poets_monument_inscription',
    title: 'Имена на камне',
    description:
      'Памятник в парке восстановлен — но на обелиске нет имен тех, кто молчал, кто стихи прятал в серверах, кто исчез в чистке. Володька знает эти имена: каждый стих, который он нашёл в leaking-потоке, подписан. Нужно соскрести гильдейскую табличку, вспомнить подписи, вырезать имена и принять тишину — не гравировкой гильдии, а собственной рукой.',
    act: 7,
    faction: 'network',
    questType: 'side',
    difficulty: 'easy',
    requiresQuests: ['rebuild_the_guild'],
    hint: 'Парк — обелиск: табличка → память → резьба → тишина.',
    objectives: [
      {
        id: 'visit_monument',
        description: 'Прийти к обелиску в парке',
        type: 'flag_set',
        target: 'quest_act7_poets_monument_inscription_active',
        completed: false,
      },
      {
        id: 'scrape_plate',
        description: 'Соскрести гильдейскую табличку с обелиска',
        type: 'flag_set',
        target: 'quest_act7_poets_monument_plate_cleared',
        completed: false,
      },
      {
        id: 'recall_names',
        description: 'Вспомнить имена из leaking-потока',
        type: 'flag_set',
        target: 'quest_act7_poets_monument_names_recalled',
        completed: false,
      },
      {
        id: 'carve_names',
        description: 'Вырезать первые имена на камне',
        type: 'flag_set',
        target: 'quest_act7_poets_monument_carved',
        completed: false,
      },
      {
        id: 'inscribe_names',
        description: 'Завершить надпись и принять тишину парка',
        type: 'flag_set',
        target: 'quest_act7_poets_monument_inscription_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'collectPoem', poemId: 'poem_17' },
      { type: 'addSkill', skill: 'writing', value: 1 },
      { type: 'addXp', value: 50 },
    ],
    linkedStoryNodeId: 'quest_act7_poets_monument_inscription_start',
    linkedStoryNodeIds: [
      'quest_act7_poets_monument_inscription_start',
      'quest_act7_poets_monument_plate',
      'quest_act7_poets_monument_recall',
      'quest_act7_poets_monument_carve',
      'quest_act7_poets_monument_inscribe',
    ],
  },
];
