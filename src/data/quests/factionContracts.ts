import type { QuestDefinition } from '@/shared/types/game';

/**
 * «Фракционные поручения» — 5 новых побочных квестов (Акт 3 → Акт 4),
 * по одному на каждую фракцию города + один кросс-фракционный.
 *
 * Тема пака: доверие. Каждая фракция доверяет Володьке одно поручение,
 * после которого фракция раскрывается изнутри — со своими сомнениями,
 * долгами и представлением о чести. Пятый квест («Руки, которые чинят»)
 * обходит все фракции разом и спрашивает: кому принадлежат свободные руки.
 *
 * Пять механик: сбор фрагментов цифрового эха по трём точкам города;
 * курьерская доставка «списка наблюдений» через слепую зону камер;
 * ремонт вещевой станции (две запчасти + антенна на крыше + тест-эфир);
 * расследование пропажи угольных писем у костра Толпы; тройная доставка
 * отремонтированных вещей трём фракциям с моральным финалом.
 *
 * Все ID NPC, предметов, сцен сверены с реестрами
 * (allNpcDefinitions.ts, items.ts, config/sceneIds.ts).
 * Story-ноды — в src/data/story/factionContractsStory.ts.
 * Сеттеры всех flag_set-объективов находятся в том же паке story-нод
 * (инвариант KNOWN_DEAD_FLAG_OBJECTIVES остаётся пустым).
 */
export const FACTION_CONTRACTS_QUESTS: QuestDefinition[] = [
  /* ═══════════════════════════════════════════════════════════════
     СЕТЬ — «Эхо на проводе» (Акт 3)
     Эхо Марата рассыпается: три фрагмента застряли в терминале
     кафе, серверном каркасе Гильдии и старом телефоне на крыше.
     Собрать — и решить судьбу цифрового следа поэта.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'fc_network_echo',
    title: 'Эхо на проводе',
    description:
      'Терминал в кафе снова мигает: эхо Марата — цифровой след поэта, застрявший в городских проводах, — рассыпается. Три его фрагмента остались там, где Марат бывал чаще всего: в терминале кафе, в серверном каркасе Гильдии и в старом телефоне на крыше, где дописывались последние строки. Сеть не умеет хранить своих мёртвых — но умеет отдавать их по частям. Собери эхо, пока город не затёр след окончательно.',
    act: 3,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['network_initiation'],
    hint: 'Марат (эхо) у терминала кафе → подвальная серверная стойка → крыша → выбор судьбы следа.',
    objectives: [
      {
        id: 'hear_echo_plea',
        description: 'Услышать от эха Марата просьбу о сборе',
        type: 'npc_talked',
        target: 'marat_echo',
        completed: false,
      },
      {
        id: 'recover_terminal_fragment',
        description: 'Снять фрагмент следа с терминала в кафе',
        type: 'item_collected',
        target: 'digital_ghost_trace',
        completed: false,
      },
      {
        id: 'recover_server_fragment',
        description: 'Достать фрагмент со серверной стойки Гильдии',
        type: 'item_collected',
        target: 'server_fragment',
        completed: false,
      },
      {
        id: 'recover_phone_fragment',
        description: 'Найти старый телефон на крыше — последний фрагмент',
        type: 'item_collected',
        target: 'old_phone',
        completed: false,
      },
      {
        id: 'assemble_echo_on_rooftop',
        description: 'Собрать эхо на крыше, где ветер чище',
        type: 'location_visited',
        target: 'rooftop_edge',
        completed: false,
      },
      {
        id: 'decide_echo_fate',
        description: 'Решить судьбу цифрового следа поэта',
        type: 'flag_set',
        target: 'fc_echo_fate_decided',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 140 },
      { type: 'addSkill', skill: 'intuition', value: 2 },
      { type: 'npcChange', npcId: 'marat_echo', npcChange: { relation: 8 } },
      { type: 'npcChange', npcId: 'kate', npcChange: { relation: 4 } },
      { type: 'setFlag', flag: 'fc_network_echo_done', flagValue: true },
    ],
    rewardItems: [{ itemId: 'echo_headband', quantity: 1 }],
    questGiverNpcId: 'marat_echo',
    linkedStoryNodeId: 'fc_echo_start',
    linkedStoryNodeIds: [
      'fc_echo_start',
      'fc_echo_terminal',
      'fc_echo_server',
      'fc_echo_rooftop',
      'fc_echo_assembly',
      'fc_echo_resolve',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     ГИЛЬДИЯ — «Три минуты слепой зоны» (Акт 4)
     Олег выносит чип со списком наблюдений за 3:14–3:17.
     Нести через ночной город до тайника в бункере.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'fc_guild_blind_spot',
    title: 'Три минуты слепой зоны',
    description:
      'Олег решился. С 3:14 до 3:17 камеры Гильдии слепы — три минуты технического обслуживания, которые он сберёг, как сберегают патрон: на один честный выстрел. В слепой зоне он оставит чип со списком наблюдений — тем самым, где против каждого горожанина записано по строчке. Дальше чип должен пройти ночной город в чужом кармане и дойти до тайника в старом бункере. У списков нет фракций. Есть только те, кто их составляет, — и тот, кто их носит.',
    act: 4,
    faction: 'guild',
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['network_initiation'],
    hint: 'Олег у офиса Гильдии → слепая зона, забрать чип → ночной город → старый бункер → выбор судьбы списка.',
    objectives: [
      {
        id: 'accept_oleg_blind_spot_job',
        description: 'Принять поручение у Олега',
        type: 'npc_talked',
        target: 'oleg',
        completed: false,
      },
      {
        id: 'take_watch_list_chip',
        description: 'Забрать чип со списком наблюдений из слепой зоны',
        type: 'item_collected',
        target: 'dmitry_data_chip',
        completed: false,
      },
      {
        id: 'cross_city_at_night',
        description: 'Пронести чип через ночной город',
        type: 'location_visited',
        target: 'street_night',
        completed: false,
      },
      {
        id: 'reach_dead_drop_bunker',
        description: 'Дойти до тайника в старом бункере',
        type: 'location_visited',
        target: 'underground_bunker',
        completed: false,
      },
      {
        id: 'decide_watch_list_fate',
        description: 'Решить судьбу списка наблюдений',
        type: 'flag_set',
        target: 'fc_blindspot_fate_decided',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 150 },
      { type: 'addSkill', skill: 'persuasion', value: 2 },
      { type: 'addCredits', value: 60 },
      { type: 'npcChange', npcId: 'oleg', npcChange: { relation: 10 } },
      { type: 'setFlag', flag: 'fc_guild_blind_spot_done', flagValue: true },
    ],
    questGiverNpcId: 'oleg',
    linkedStoryNodeId: 'fc_blindspot_start',
    linkedStoryNodeIds: [
      'fc_blindspot_start',
      'fc_blindspot_pickup',
      'fc_blindspot_street',
      'fc_blindspot_bunker',
      'fc_blindspot_resolve',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     СОПРОТИВЛЕНИЕ — «Частота „Заря-М“» (Акт 4)
     Жека поднимает передатчик «Заря-М»: перфокарта из книжного
     подвала, медь из «Хрома-М», антенна на крыше. Тест-эфир.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'fc_resistance_zarya',
    title: 'Частота «Заря-М»',
    description:
      'Жека нашёл в цеху передатчик «Заря-М» — тот самый, что писал стихи на пятидесяти герцах. Машина молчит: без перфокарты-пароля не вспомнит ни строчки, без медной антенны не дотянется до города. Перфокарта — в книжном подвале, между серверными полками; моток меди — в «Хроме-М», где Зина паяет всю жизнь. Собери обе руки машины, поднимись с ними на крышу — и реши, кому будет слышна новая частота: только своим или всему городу.',
    act: 4,
    faction: 'resistance',
    questType: 'side',
    difficulty: 'hard',
    requiresQuests: ['network_initiation'],
    hint: 'Жека в цеху → перфокарта в книжном подвале → медь в «Хрома-М» → крыша завода: антенна и тест-эфир → выбор частоты.',
    objectives: [
      {
        id: 'hear_zarya_broadcast_plan',
        description: 'Услышать от Жеки план подъёма «Зари-М»',
        type: 'npc_talked',
        target: 'zeka',
        completed: false,
      },
      {
        id: 'find_zarya_punch_card',
        description: 'Найти перфокарту-пароль в книжном подвале',
        type: 'item_collected',
        target: 'zarya_punch_card',
        completed: false,
      },
      {
        id: 'find_antenna_copper_wire',
        description: 'Добыть моток меди в «Хрома-М»',
        type: 'item_collected',
        target: 'copper_wire',
        completed: false,
      },
      {
        id: 'climb_factory_roof',
        description: 'Подняться на крышу завода с антенной',
        type: 'location_visited',
        target: 'factory_roof',
        completed: false,
      },
      {
        id: 'run_zarya_test_broadcast',
        description: 'Провести тест-эфир «Зари-М»',
        type: 'flag_set',
        target: 'fc_zarya_test_done',
        completed: false,
      },
      {
        id: 'decide_zarya_frequency',
        description: 'Выбрать частоту: своя или общая',
        type: 'flag_set',
        target: 'fc_zarya_frequency_decided',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 160 },
      { type: 'addSkill', skill: 'coding', value: 2 },
      { type: 'npcChange', npcId: 'zeka', npcChange: { relation: 10 } },
      { type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 6 } },
      { type: 'setFlag', flag: 'fc_resistance_zarya_done', flagValue: true },
    ],
    rewardItems: [{ itemId: 'circuit_board', quantity: 1 }],
    questGiverNpcId: 'zeka',
    linkedStoryNodeId: 'fc_zarya_start',
    linkedStoryNodeIds: [
      'fc_zarya_start',
      'fc_zarya_punchcard',
      'fc_zarya_wire',
      'fc_zarya_roof',
      'fc_zarya_test',
      'fc_zarya_resolve',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     ТОЛПА — «Угольные письма» (Акт 3)
     У костра ЧК пропадают письма, которые пишут в огонь.
     Ру просит найти, кто выносит их до пламени.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'fc_tolpa_embers',
    title: 'Угольные письма',
    description:
      'У костра Чёрной Комнаты есть обычай: угольные письма. Пишешь строку — и бросаешь в огонь: письмо считается доставленным, когда сгорит. Три недели назад письма перестали сгорать: их вынимают из костра раньше пламени и уносят. Ру говорит об этом спокойно, но чай в его руке остыл. Поговори со Сталкером — он видит всех, кто подходит к лагерю, — и найди, кто забирает чужие послания до отправки.',
    act: 3,
    faction: 'tolpa',
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['network_initiation'],
    hint: 'Ру у костра → Сталкер на краю лагеря → обыскать тропу у костра → разговор с гостем-аналитиком → выбор.',
    objectives: [
      {
        id: 'hear_ru_ember_story',
        description: 'Услышать от Ру про пропажу угольных писем',
        type: 'npc_talked',
        target: 'chk_ru',
        completed: false,
      },
      {
        id: 'ask_stalker_about_letters',
        description: 'Спросить Сталкера про тень у костра',
        type: 'npc_talked',
        target: 'chk_stalker',
        completed: false,
      },
      {
        id: 'search_campfire_grounds',
        description: 'Обыскать тропу за костровой поляной',
        type: 'location_visited',
        target: 'chk_campfire_night',
        completed: false,
      },
      {
        id: 'find_missing_ember_letters',
        description: 'Найти пачку ненаправленных писем',
        type: 'item_collected',
        target: 'anonymous_letter',
        completed: false,
      },
      {
        id: 'decide_letter_thief_fate',
        description: 'Решить судьбу гостя и писем',
        type: 'flag_set',
        target: 'fc_embers_fate_decided',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 130 },
      { type: 'addSkill', skill: 'empathy', value: 2 },
      { type: 'npcChange', npcId: 'chk_ru', npcChange: { relation: 10 } },
      { type: 'npcChange', npcId: 'chk_stalker', npcChange: { relation: 4 } },
      { type: 'setFlag', flag: 'fc_tolpa_embers_done', flagValue: true },
    ],
    rewardItems: [{ itemId: 'port_wine_777', quantity: 1 }],
    questGiverNpcId: 'chk_ru',
    linkedStoryNodeId: 'fc_embers_start',
    linkedStoryNodeIds: [
      'fc_embers_start',
      'fc_embers_stalker',
      'fc_embers_search',
      'fc_embers_analyst',
      'fc_embers_resolve',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     КРОСС-ФРАКЦИОННЫЙ — «Руки, которые чинят» (Акт 4)
     Баба Зина отремонтировала три вещи для трёх фракций
     и просит доставить. Каждая фракция предлагает «эксклюзив».
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'fc_neutral_hands',
    title: 'Руки, которые чинят',
    description:
      'Баба Зина чинит для всего города — без ведомости и пропусков: Сети, Гильдии, Сопротивлению, кому угодно. Сегодня готовы три вещи: восстановленный терминал-ключ для библиотеки Кати, перепаянный значок пропуска для Олега и самодельная антенна для станции Максима. Отнеси все три — и послушай, что предложат взамен: каждая фракция хочет получить эти руки только себе. Зина об этом не спрашивала. Она вообще мало о чём спрашивает — просто чинит.',
    act: 4,
    faction: 'neutral',
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['factory_zarya_memory'],
    hint: 'Зина в цеху «Хрома-М» → терминал-ключ Кате в библиотеку → значок Олегу в офис → антенну Максиму в цех → вернуться к Зине.',
    objectives: [
      {
        id: 'accept_zina_delivery_job',
        description: 'Принять у Зины три доставки',
        type: 'npc_talked',
        target: 'baba_zina',
        completed: false,
      },
      {
        id: 'take_repaired_terminal_key',
        description: 'Взять восстановленный терминал-ключ',
        type: 'item_collected',
        target: 'hacked_terminal_key',
        completed: false,
      },
      {
        id: 'take_guild_repair_badge',
        description: 'Взять перепаянный значок пропуска',
        type: 'item_collected',
        target: 'corporate_badge',
        completed: false,
      },
      {
        id: 'take_resistance_antenna',
        description: 'Взять самодельную антенну',
        type: 'item_collected',
        target: 'signal_booster',
        completed: false,
      },
      {
        id: 'deliver_terminal_key_to_kate',
        description: 'Доставить терминал-ключ Кате в библиотеку',
        type: 'npc_talked',
        target: 'kate',
        completed: false,
      },
      {
        id: 'deliver_badge_to_oleg',
        description: 'Доставить значок Олегу в офис Гильдии',
        type: 'npc_talked',
        target: 'oleg',
        completed: false,
      },
      {
        id: 'deliver_antenna_to_maxim',
        description: 'Доставить антенну Максиму',
        type: 'npc_talked',
        target: 'maxim',
        completed: false,
      },
      {
        id: 'decide_zina_freedom',
        description: 'Решить: обещать фракциям или остаться честным',
        type: 'flag_set',
        target: 'fc_hands_promise_decided',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 180 },
      { type: 'addStat', stat: 'stress', value: -4 },
      { type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 12 } },
      { type: 'setFlag', flag: 'fc_neutral_hands_done', flagValue: true },
    ],
    rewardItems: [
      { itemId: 'repair_kit', quantity: 1 },
      { itemId: 'tea', quantity: 2 },
    ],
    questGiverNpcId: 'baba_zina',
    linkedStoryNodeId: 'fc_hands_start',
    linkedStoryNodeIds: [
      'fc_hands_start',
      'fc_hands_kate',
      'fc_hands_oleg',
      'fc_hands_maxim',
      'fc_hands_resolve',
    ],
  },
];

/**
 * «Крипта Тишины» — боссовое подземелье (продолжение линии Сопротивления).
 *
 * Отдельный экспорт (не входит в FACTION_CONTRACTS_QUESTS из 5 квестов):
 * вход открывается только после «Частоты „Заря-М“» — Жека доверяет спуск
 * в нижний ярус бункера, где двадцать лет стоит тишина и её Хранитель.
 *
 * Босс: boss_silent_warden (Тихий Хранитель) — 520 HP, три фазы
 * (Слушатель → Помехи → Белый шум), спец-атаки с телеграфированием.
 * Победа автоматически ставит флаг boss_silent_warden_defeated
 * (CombatSystem.isBoss), квестные флаги ставит пост-бойная цепочка нод.
 */
export const FACTION_CONTRACTS_DUNGEON_QUESTS: QuestDefinition[] = [
  {
    id: 'fc_silent_warden',
    title: 'Крипта Тишины',
    description:
      'После подъёма «Зари-М» Жека открывает то, что Сопротивление бережёт для своих: в нижнем ярусе бункера, за вратами с довоенной символикой, стоит архив прослушки Гильдии — и его страж. Двадцать лет тишины. Двадцать лет ни один смельчак не вернулся со словами, только с молчанием. Жека говорит просто: «Станция теперь в эфире, Володька. Пусть и архив заговорит». Спустись, победи Тихого Хранителя — и реши, что делать с архивом, который слушал весь город.',
    act: 4,
    faction: 'resistance',
    questType: 'side',
    difficulty: 'hard',
    requiresQuests: ['fc_resistance_zarya'],
    hint: 'Жека в цеху → бункер Сопротивления → врата нижнего яруса (дальний угол) → шаг в тишину → архив после победы.',
    objectives: [
      {
        id: 'hear_warden_rumor',
        description: 'Услышать от Жеки про нижний ярус',
        type: 'npc_talked',
        target: 'zeka',
        completed: false,
      },
      {
        id: 'descend_to_lower_tier',
        description: 'Спуститься в бункер Сопротивления',
        type: 'location_visited',
        target: 'underground_bunker',
        completed: false,
      },
      {
        id: 'find_warden_lair',
        description: 'Найти врата нижнего яруса',
        type: 'flag_set',
        target: 'fc_warden_lair_found',
        completed: false,
      },
      {
        id: 'defeat_silent_warden',
        description: 'Победить Тихого Хранителя',
        type: 'flag_set',
        target: 'fc_warden_defeated',
        completed: false,
      },
      {
        id: 'claim_warden_archive',
        description: 'Решить судьбу архива прослушки',
        type: 'flag_set',
        target: 'fc_warden_archive_claimed',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 200 },
      { type: 'addCredits', value: 120 },
      { type: 'addSkill', skill: 'logic', value: 2 },
      { type: 'npcChange', npcId: 'zeka', npcChange: { relation: 10 } },
      { type: 'npcChange', npcId: 'kate', npcChange: { relation: 6 } },
      { type: 'setFlag', flag: 'fc_silent_warden_done', flagValue: true },
    ],
    rewardItems: [{ itemId: 'memory_crystal', quantity: 1 }],
    questGiverNpcId: 'zeka',
    linkedStoryNodeId: 'fc_warden_start',
    linkedStoryNodeIds: [
      'fc_warden_start',
      'fc_warden_descent',
      'fc_warden_aftermath',
      'fc_warden_resolve',
    ],
  },
];
