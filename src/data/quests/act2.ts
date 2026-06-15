import type { QuestDefinition } from '@/shared/types/game';

export const QUESTS_ACT2: QuestDefinition[] = [
  /* ═══════════════════════════════════════════════════════════════════
     ACT 2 — ПОДПОЛЬЕ: Сеть
     ═══════════════════════════════════════════════════════════════════ */

  /* ─────────────── QUEST 8: Network initiation ─────────────── */
  {
    id: 'network_initiation',
    title: 'Посвящение в Сеть',
    description: 'Подпольная сеть поэтов-программистов существует в тени города. Виктория может устроить встречу, но сначала нужно доказать свою преданность идее свободного слова.',
    act: 2,
    faction: 'network',
    questType: 'main',
    difficulty: 'hard',
    hint: 'Виктория ждёт тебя — но сначала произнеси стих как клятву.',
    objectives: [
      {
        id: 'meet_maria_again',
        description: 'Встретиться с Викторией для посвящения',
        type: 'npc_talked',
        target: 'maria',
        completed: false,
      },
      {
        id: 'navigate_network',
        description: 'Пройти проверку Сети — навигация по сети (мини-игра «Взлом»)',
        type: 'minigame_completed',
        target: 'hacking',
        completed: false,
      },
      {
        id: 'recite_hidden_poem',
        description: 'Прочитать стихотворение по памяти на тайной встрече',
        type: 'flag_set',
        target: 'recited_poem_initiation',
        completed: false,
      },
      {
        id: 'swear_oath',
        description: 'Принести клятву Сети',
        type: 'flag_set',
        target: 'network_oath_taken',
        completed: false,
      },
      {
        id: 'receive_network_key',
        description: 'Получить ключ Сети — зашифрованный канал связи',
        type: 'item_collected',
        target: 'network_comm_key',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'persuasion', value: 3 },
      { type: 'addSkill', skill: 'writing', value: 2 },
      { type: 'addKarma', value: 8 },
      { type: 'setFlag', flag: 'network_member', flagValue: true },
      { type: 'addXp', value: 150 },
    ],
    linkedStoryNodeId: 'act2_network_initiation',
    questGiverNpcId: 'maria',
  },

  /* ─────────────── QUEST 9: Dmitry defection ─────────────── */
  {
    id: 'dmitry_defection',
    title: 'Дезертирство Дмитрия',
    description: 'Дмитрий — старший разработчик гильдии — разочарован в системе. Он знает слишком много, чтобы его просто уволили. Помоги ему скрыться, но взял ли ты на себя ответственность за его судьбу?',
    act: 2,
    faction: 'network',
    questType: 'main',
    difficulty: 'hard',
    hint: 'Время ограничено — Дмитрий не может ждать вечно.',
    requiresQuests: ['network_initiation'],
    timeLimitHours: 12,
    objectives: [
      {
        id: 'hear_dmitry_story',
        description: 'Выслушать историю Дмитрия о гильдии',
        type: 'flag_set',
        target: 'heard_dmitry_story',
        completed: false,
      },
      {
        id: 'plan_escape',
        description: 'Спланировать побег Дмитрия из гильдии',
        type: 'flag_set',
        target: 'dmitry_escape_planned',
        completed: false,
      },
      {
        id: 'escort_dmitry',
        description: 'Сопроводить Дмитрия до безопасного места',
        type: 'flag_set',
        target: 'dmitry_defected',
        completed: false,
      },
      {
        id: 'betray_dmitry_alt',
        description: 'Передать Дмитрия гильдии (альтернативная ветка)',
        type: 'flag_set',
        target: 'dmitry_betrayed',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'persuasion', value: 3 },
      { type: 'addSkill', skill: 'empathy', value: 2 },
      { type: 'addKarma', value: 10 },
      { type: 'addXp', value: 150 },
    ],
    linkedStoryNodeId: 'act2_dmitry_office_meeting',
    questGiverNpcId: 'office_dmitry',
  },

  /* ─────────────── QUEST 10: Vault key fragments ─────────────── */
  {
    id: 'vault_key_fragments',
    title: 'Фрагменты ключа',
    description: 'Хранилище — это не одно помещение, а распределённая система. Чтобы попасть в центральный архив, нужны три фрагмента ключа, разбросанные по городу. Каждый охраняется — один гильдией, один Сетью, один теми, кто не принадлежит никому.',
    act: 2,
    faction: 'neutral',
    questType: 'main',
    requiresQuests: ['vault_backup_trial'],
    objectives: [
      {
        id: 'find_guild_fragment',
        description: 'Найти фрагмент ключа в офисе гильдии',
        type: 'item_collected',
        target: 'vault_key_fragment',
        completed: false,
      },
      {
        id: 'find_network_fragment',
        description: 'Получить фрагмент ключа от Виктории и Сети',
        type: 'npc_talked',
        target: 'maria',
        completed: false,
      },
      {
        id: 'find_neutral_fragment',
        description: 'Отыскать последний фрагмент в заброшенном месте',
        type: 'location_visited',
        target: 'abandoned_factory',
        completed: false,
      },
      {
        id: 'assemble_key',
        description: 'Собрать полный ключ Хранилища',
        type: 'flag_set',
        target: 'vault_key_assembled',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'logic', value: 3 },
      { type: 'addSkill', skill: 'coding', value: 2 },
      { type: 'addKarma', value: 10 },
      { type: 'setFlag', flag: 'full_vault_access', flagValue: true },
      { type: 'addXp', value: 150 },
    ],
    linkedStoryNodeId: 'act2_vault_revealed',
    questGiverNpcId: 'maria',
  },

  /* ─────────────── QUEST 11: Cafe safehouse ─────────────── */
  {
    id: 'cafe_safehouse',
    title: 'Тихая гавань',
    description: 'Кафе «Синяя яма» может стать явочной квартирой для Сети. Но для этого нужно договориться с баристой и убедить Альберта хранить тайну. Один промах — и гильдия узнает.',
    act: 2,
    faction: 'network',
    questType: 'main',
    requiresQuests: ['network_initiation'],
    objectives: [
      {
        id: 'convince_barista',
        description: 'Убедить баристу предоставить заднюю комнату',
        type: 'npc_talked',
        target: 'cafe_barista',
        completed: false,
      },
      {
        id: 'ask_albert_secrecy',
        description: 'Попросить Альберта держать рот на замке',
        type: 'npc_talked',
        target: 'albert',
        completed: false,
      },
      {
        id: 'install_secret_terminal',
        description: 'Установить защищённый терминал в подсобке',
        type: 'flag_set',
        target: 'safehouse_terminal_installed',
        completed: false,
      },
      {
        id: 'test_secure_channel',
        description: 'Протестировать зашифрованный канал связи',
        type: 'flag_set',
        target: 'secure_channel_tested',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'persuasion', value: 3 },
      { type: 'addSkill', skill: 'coding', value: 1 },
      { type: 'addKarma', value: 6 },
      { type: 'setFlag', flag: 'cafe_safehouse_established', flagValue: true },
      { type: 'addXp', value: 100 },
    ],
    linkedStoryNodeId: 'act2_safehouse_agreed',
    questGiverNpcId: 'cafe_barista',
  },

  /* ─────────────── QUEST 12: Poetry smuggling ─────────────── */
  {
    id: 'poetry_smuggling',
    title: 'Контрабанда стихов',
    description: 'Запрещённые стихотворения нужно переправить через весь город — из библиотеки в кафе. Гильдия контролирует основные маршруты. Придётся идти окольными путями, через парк и крыши.',
    act: 2,
    faction: 'network',
    questType: 'side',
    timeLimitHours: 8,
    requiresQuests: ['cafe_safehouse'],
    objectives: [
      {
        id: 'retrieve_poems_library',
        description: 'Забрать стихи из тайника в библиотеке',
        type: 'location_visited',
        target: 'library_day',
        completed: false,
      },
      {
        id: 'evade_guild_patrol_park',
        description: 'Пройти через парк, избегая патруля гильдии',
        type: 'location_visited',
        target: 'park_day',
        completed: false,
      },
      {
        id: 'cross_rooftops',
        description: 'Перебраться через крыши к кафе',
        type: 'location_visited',
        target: 'rooftop_edge',
        completed: false,
      },
      {
        id: 'deliver_poems_cafe',
        description: 'Доставить стихи в безопасную комнату кафе',
        type: 'npc_talked',
        target: 'cafe_barista',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'intuition', value: 3 },
      { type: 'addSkill', skill: 'logic', value: 1 },
      { type: 'addKarma', value: 8 },
      { type: 'setFlag', flag: 'poems_smuggled', flagValue: true },
      { type: 'addXp', value: 100 },
    ],
    linkedStoryNodeId: 'street_bench',
    questGiverNpcId: 'kate',
  },

  /* ═══════════════════════════════════════════════════════════════════
     ПИРС И ПОДВАЛ — линия Трофима (форшадоуинг «Зари-М» из акта 5)
     ═══════════════════════════════════════════════════════════════════ */

  /* ─────────────── QUEST: Ключ сторожа ─────────────── */
  {
    id: 'pier_watchman_key',
    title: 'Ключ сторожа',
    description: 'Трофим — старик-рыбак с пирса №3 — тридцать лет сторожил завод «Хром-М» и до сих пор хранит ключ от нижней двери. Отдаст за бутылку портвейна «777» из ящика ЧК. Говорит, под полом завода до сих пор гудит.',
    act: 2,
    questType: 'side',
    difficulty: 'easy',
    hint: 'Ящик с портвейном — у костра на пирсе. Трофим — у перил, где удочки.',
    objectives: [
      {
        id: 'meet_trofim',
        description: 'Поговорить с Трофимом на пирсе',
        type: 'npc_talked',
        target: 'fisherman_trofim',
        completed: false,
      },
      {
        id: 'bring_portwine',
        description: 'Принести Трофиму бутылку портвейна «777»',
        type: 'flag_set',
        target: 'trofim_portwine_delivered',
        completed: false,
      },
      {
        id: 'receive_key',
        description: 'Получить ключ сторожа',
        type: 'item_collected',
        target: 'watchman_key',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 80 },
      { type: 'addKarma', value: 4 },
      { type: 'addSkill', skill: 'empathy', value: 1 },
    ],
    questGiverNpcId: 'fisherman_trofim',
  },

  /* ─────────────── QUEST: Гул под полом ─────────────── */
  {
    id: 'basement_hum',
    title: 'Гул под полом',
    description: 'Ключ Трофима открывает дверь в дальнем углу цеха «Хрома-М». Внизу — катакомбы «Прогресс-7»: серверные стойки, иней на трубах и чёрный монолит, который пульсирует зелёным. Трофим просил: не трогай — послушай.',
    act: 2,
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['pier_watchman_key'],
    requiredFlag: 'basement_key_found',
    hint: 'Дверь в подвал — в дальнем углу цеха завода. Внизу осмотри машину и взломай пульт у входа.',
    objectives: [
      {
        id: 'descend_basement',
        description: 'Спуститься в подвал завода',
        type: 'location_visited',
        target: 'factory_basement',
        completed: false,
      },
      {
        id: 'examine_zarya',
        description: 'Осмотреть монолит «Зари-М»',
        type: 'flag_set',
        target: 'zarya_monolith_examined',
        completed: false,
      },
      {
        id: 'hack_entry_terminal',
        description: 'Взломать терминал «Прогресс-7» у входа',
        type: 'flag_set',
        target: 'basement_terminal_accessed',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 120 },
      { type: 'addSkill', skill: 'intuition', value: 3 },
      { type: 'discoverLore', loreId: 'lore_factory_progress7' },
      { type: 'setFlag', flag: 'basement_hum_heard', flagValue: true },
    ],
    questGiverNpcId: 'fisherman_trofim',
  },

];
