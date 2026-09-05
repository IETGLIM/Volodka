import type { QuestDefinition } from '@/shared/types/game';

/**
 * AAA-расширение: 8 новых побочных квестов (Акт 2 → Акт 7).
 *
 * Темы — киберпанк-сказка Володьки: потерянный дневник, подземное эхо,
 * контрабанда стихов, старая фотография, сломанная машина, ночная
 * рыбалка с философским диалогом, легенды у лагерного костра и
 * последнее письмо от погибшего героя.
 *
 * Каждый квест: 3–5 целей, осмысленные награды (XP, предметы, карма,
 * репутация), корректный questGiverNpcId и requiresQuests там, где
 * это логично. Все ID NPC, предметов и сцен сверены с реестрами
 * (allNpcDefinitions.ts, items.ts, sceneIds.ts).
 */
export const AAA_EXPANSION_QUESTS: QuestDefinition[] = [
  /* ═══════════════════════════════════════════════════════════════
     АКТ 2 — «Пропавший дневник»
     Мария просит найти дневник пропавшего поэта в офисе гильдии.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'aaa_maria_lost_diary',
    title: 'Пропавший дневник',
    description:
      'Мария вспоминает поэта, чьи стихи гильдия списала в утиль, а сам он исчез после последнего ночного дежурства. Его дневник — последний след. По слухам, тетрадь до сих пор лежит в одном из офисных ящиков.',
    act: 2,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['network_initiation'],
    hint: 'Мария → офис гильдии → ящик стола → дневник → вернуть Марии.',
    objectives: [
      {
        id: 'accept_lost_diary',
        description: 'Поговорить с Марией о пропавшем поэте',
        type: 'npc_talked',
        target: 'maria',
        completed: false,
      },
      {
        id: 'investigate_office_desk',
        description: 'Исследовать офис гильдии в поисках следов',
        type: 'location_visited',
        target: 'office_day',
        completed: false,
      },
      {
        id: 'find_poet_diary',
        description: 'Найти дневник пропавшего поэта в ящике стола',
        type: 'item_collected',
        target: 'old_poetry_book',
        completed: false,
      },
      {
        id: 'return_diary_to_maria',
        description: 'Вернуть дневник Марии и узнать финал истории',
        type: 'npc_talked',
        target: 'maria',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 70 },
      { type: 'addKarma', value: 4 },
      { type: 'npcChange', npcId: 'maria', npcChange: { relation: 8 } },
      { type: 'setFlag', flag: 'aaa_lost_diary_done', flagValue: true },
    ],
    rewardItems: [{ itemId: 'old_poetry_book', quantity: 1 }],
    questGiverNpcId: 'maria',
    linkedStoryNodeId: 'aaa_maria_lost_diary_start',
    linkedStoryNodeIds: [
      'aaa_maria_lost_diary_start',
      'aaa_maria_lost_diary_office',
      'aaa_maria_lost_diary_found',
      'aaa_maria_lost_diary_return',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 3 — «Эхо в канализации»
     Странные звуки из-под земли ведут к подземелью и встрече с
     эхом Марата.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'aaa_sewer_echo',
    title: 'Эхо в канализации',
    description:
      'Трофим шепчет, что под заводом, в старом коллекторе, кто-то читает стихи. Не громко — почти неслышно. Голос не чужой. Голос — знакомый. Тот, кого списали. Тот, кого стёрли. Спустись и проверь.',
    act: 3,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['pier_midnight_fishing'],
    hint: 'Трофим → подвал завода → канализационный сток → эхо Марата.',
    objectives: [
      {
        id: 'hear_trofim_whisper',
        description: 'Услышать от Трофима про подземный голос',
        type: 'npc_talked',
        target: 'fisherman_trofim',
        completed: false,
      },
      {
        id: 'descend_factory_basement',
        description: 'Спуститься в подвал заброшенного завода',
        type: 'location_visited',
        target: 'factory_basement',
        completed: false,
      },
      {
        id: 'follow_poem_sound',
        description: 'Пройти по звуку стихов через коллектор',
        type: 'flag_set',
        target: 'aaa_sewer_echo_followed',
        completed: false,
      },
      {
        id: 'meet_marat_echo',
        description: 'Встретить эхо Марата в глубине коллектора',
        type: 'npc_talked',
        target: 'marat_echo',
        completed: false,
      },
      {
        id: 'record_echo_phrase',
        description: 'Запомнить последнюю фразу эха',
        type: 'flag_set',
        target: 'aaa_sewer_echo_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 110 },
      { type: 'addSkill', skill: 'intuition', value: 2 },
      { type: 'setFlag', flag: 'marat_trace_found', flagValue: true },
      // setFlag «aaa_sewer_echo_done» удалён: дублирует objective
      // record_echo_phrase (validate:content).
    ],
    rewardItems: [{ itemId: 'marat_code_copy', quantity: 1 }],
    questGiverNpcId: 'fisherman_trofim',
    linkedStoryNodeId: 'aaa_sewer_echo_start',
    linkedStoryNodeIds: [
      'aaa_sewer_echo_start',
      'aaa_sewer_echo_descent',
      'aaa_sewer_echo_corridor',
      'aaa_sewer_echo_meeting',
      'aaa_sewer_echo_resolve',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 3 — «Контрабанда стихов»
     Помочь Борису переправить стихи через блокпост гильдии.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'aaa_boris_poem_smuggling',
    title: 'Контрабанда стихов',
    description:
      'У Бориса в цеху спрятана тетрадь — сорок восемь строк, которые он никогда никому не показывал. Завтра гильдия проводит зачистку цеха. Тетрадь нужно вынести через блокпост на улице до рассвета — иначе строки исчезнут навсегда.',
    act: 3,
    faction: 'network',
    questType: 'side',
    difficulty: 'hard',
    requiresQuests: ['chip_cafe_clearance'],
    hint: 'Борис → забрать тетрадь в цеху → улица → блокпост → передать связному.',
    objectives: [
      {
        id: 'accept_smuggling_brief',
        description: 'Принять поручение от Бориса',
        type: 'npc_talked',
        target: 'boris',
        completed: false,
      },
      {
        id: 'collect_poem_tape',
        description: 'Забрать тетрадь, спрятанную в цеху завода',
        type: 'item_collected',
        target: 'tape',
        completed: false,
      },
      {
        id: 'cross_street_checkpoint',
        description: 'Пройти через уличный блокпост гильдии',
        type: 'location_visited',
        target: 'street_night',
        completed: false,
      },
      {
        id: 'distract_patrol',
        description: 'Отвлечь патруль стихом- diversией',
        type: 'flag_set',
        target: 'aaa_smuggling_patrol_distracted',
        completed: false,
      },
      {
        id: 'hand_off_to_contact',
        description: 'Передать тетрадь связному Сети',
        type: 'flag_set',
        target: 'aaa_smuggling_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 130 },
      { type: 'addKarma', value: 6 },
      { type: 'npcChange', npcId: 'boris', npcChange: { relation: 10 } },
      { type: 'setFlag', flag: 'aaa_poem_smuggling_done', flagValue: true },
    ],
    rewardItems: [{ itemId: 'encrypted_scroll', quantity: 1 }],
    questGiverNpcId: 'boris',
    linkedStoryNodeId: 'aaa_boris_smuggling_start',
    linkedStoryNodeIds: [
      'aaa_boris_smuggling_start',
      'aaa_boris_smuggling_pickup',
      'aaa_boris_smuggling_street',
      'aaa_boris_smuggling_distraction',
      'aaa_boris_smuggling_handoff',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 4 — «Старая фотография»
     Найти фотографию в библиотеке и узнать историю старых поэтов.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'aaa_library_old_photo',
    title: 'Старая фотография',
    description:
      'Тамара шепчет о фотографии, спрятанной между полок Запретного Фонда: на ней — пятеро поэтов, чьи имена гильдия вычеркнула из всех реестров. Фото хранит последний снимок тех, кто начинал Сеть. Найди его — и узнаешь, кто стоял у истока.',
    act: 4,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['library_lost_archive'],
    hint: 'Тамара → Запретный Фонд → между полок → фотография → история.',
    objectives: [
      {
        id: 'hear_photo_rumor',
        description: 'Услышать от Тамары историю о пяти поэтах',
        type: 'npc_talked',
        target: 'tamara',
        completed: false,
      },
      {
        id: 'search_library_basement_shelves',
        description: 'Обыскать полки Запретного Фонда в подвале',
        type: 'location_visited',
        target: 'library_basement',
        completed: false,
      },
      {
        id: 'find_old_photo',
        description: 'Найти старую фотографию между полок',
        type: 'item_collected',
        target: 'father_photo',
        completed: false,
      },
      {
        id: 'study_poets_history',
        description: 'Изучить историю старых поэтов по надписям на обороте',
        type: 'flag_set',
        target: 'aaa_old_photo_history_learned',
        completed: false,
      },
      {
        id: 'return_photo_to_tamara',
        description: 'Вернуть фотографию Тамаре для архива',
        type: 'npc_talked',
        target: 'tamara',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 140 },
      { type: 'addSkill', skill: 'logic', value: 2 },
      { type: 'addKarma', value: 5 },
      { type: 'npcChange', npcId: 'tamara', npcChange: { relation: 10 } },
      { type: 'discoverLore', loreId: 'lore_guild_poet_recruitment' },
      { type: 'setFlag', flag: 'aaa_old_photo_done', flagValue: true },
    ],
    rewardItems: [{ itemId: 'father_photo', quantity: 1 }],
    questGiverNpcId: 'tamara',
    linkedStoryNodeId: 'aaa_library_old_photo_start',
    linkedStoryNodeIds: [
      'aaa_library_old_photo_start',
      'aaa_library_old_photo_search',
      'aaa_library_old_photo_found',
      'aaa_library_old_photo_history',
      'aaa_library_old_photo_return',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 5 — «Сломанный механизм»
     Починить механизм на фабрике (миниигра). Награда — редкий предмет.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'aaa_factory_broken_mechanism',
    title: 'Сломанный механизм',
    description:
      'Баба Зина показывает на релейный блок в дальней стене цеха: «Это сердце. Тридцать лет молчит. Если ты сможешь его починить — „Заря-М“ снова заговорит в полную силу. Стих, что она спрятала внутри, никто никогда не слышал.»',
    act: 5,
    faction: 'network',
    questType: 'side',
    difficulty: 'hard',
    hint: 'Баба Зина → дальний цех → релейный блок → миниигра → стих.',
    objectives: [
      {
        id: 'accept_mechanism_repair',
        description: 'Согласиться починить механизм для «Зари-М»',
        type: 'npc_talked',
        target: 'baba_zina',
        completed: false,
      },
      {
        id: 'reach_factory_deep_workshop',
        description: 'Дойти до дальней стены цеха с релейным блоком',
        type: 'location_visited',
        target: 'abandoned_factory',
        completed: false,
      },
      {
        id: 'repair_mechanism_minigame',
        description: 'Починить релейный механизм (миниигра)',
        type: 'minigame_completed',
        target: 'bash_terminal',
        completed: false,
      },
      {
        id: 'hear_zarya_secret_verse',
        description: 'Услышать спрятанный стих «Зари-М»',
        type: 'flag_set',
        target: 'aaa_mechanism_verse_heard',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 220 },
      { type: 'addSkill', skill: 'coding', value: 2 },
      { type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 12 } },
      { type: 'setFlag', flag: 'aaa_broken_mechanism_done', flagValue: true },
    ],
    rewardItems: [
      { itemId: 'rare_alloy', quantity: 1 },
      { itemId: 'memory_crystal', quantity: 1 },
    ],
    questGiverNpcId: 'baba_zina',
    linkedStoryNodeId: 'aaa_factory_broken_mechanism_start',
    linkedStoryNodeIds: [
      'aaa_factory_broken_mechanism_start',
      'aaa_factory_broken_mechanism_workshop',
      'aaa_factory_broken_mechanism_repair',
      'aaa_factory_broken_mechanism_verse',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 5 — «Ночная рыбалка»
     Философский диалог с Трофимом у воды. Награда — репутация.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'aaa_trofim_night_philosophy',
    title: 'Ночная рыбалка',
    description:
      'Трофим зовёт на пирс №3 в час, когда дроны гильдии уходят на подзарядку. Удочки — повод. Настоящая цель — разговор. О реке, что помнит больше серверов. О слове, которое тяжелее кода. О том, что значит — остаться, когда все ушли.',
    act: 5,
    faction: 'network',
    questType: 'side',
    difficulty: 'easy',
    requiresQuests: ['pier_midnight_fishing'],
    hint: 'Пирс ночью → Трофим → удочка → тишина → разговор → рассвет.',
    objectives: [
      {
        id: 'meet_trofim_late_night',
        description: 'Встретить Трофима на ночном пирсе',
        type: 'npc_talked',
        target: 'fisherman_trofim',
        completed: false,
      },
      {
        id: 'sit_with_rod_in_silence',
        description: 'Посидеть с удочкой в тишине у воды',
        type: 'flag_set',
        target: 'aaa_night_philosophy_seated',
        completed: false,
      },
      {
        id: 'hear_trofim_legend',
        description: 'Услышать от Трофима легенду о поэте-рыбаке',
        type: 'flag_set',
        target: 'aaa_night_philosophy_legend_heard',
        completed: false,
      },
      {
        id: 'share_one_truth',
        description: 'Поделиться с Трофимом одной правдой о себе',
        type: 'flag_set',
        target: 'aaa_night_philosophy_truth_shared',
        completed: false,
      },
      {
        id: 'wait_for_dawn',
        description: 'Дождаться рассвета над рекой',
        type: 'flag_set',
        target: 'aaa_night_philosophy_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 90 },
      { type: 'addKarma', value: 3 },
      { type: 'addStat', stat: 'stress', value: -10 },
      { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 15 } },
      // setFlag «aaa_night_philosophy_done» удалён: дублирует objective
      // wait_for_dawn (validate:content).
    ],
    questGiverNpcId: 'fisherman_trofim',
    linkedStoryNodeId: 'aaa_trofim_night_philosophy_start',
    linkedStoryNodeIds: [
      'aaa_trofim_night_philosophy_start',
      'aaa_trofim_night_philosophy_silence',
      'aaa_trofim_night_philosophy_legend',
      'aaa_trofim_night_philosophy_truth',
      'aaa_trofim_night_philosophy_dawn',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 6 — «Лагерный огонь»
     Помочь ЧК/ТОЛПА с костром, выслушать легенды, получить lore.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'aaa_chk_campfire_legends',
    title: 'Лагерный огонь',
    description:
      'Басед зовёт к ночному костру ЧК: дрова кончаются, а без огня — нет круга, нет историй, нет Сети. Помоги собрать хворост по периметру, разожги третий костёр и сядь в круг — сталинградские барды расскажут то, чего нет ни в одном архиве гильдии.',
    act: 6,
    faction: 'tolpa',
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['underground_resistance'],
    hint: 'Басед → периметр лагеря → хворост → третий костёр → круг → легенды.',
    objectives: [
      {
        id: 'accept_campfire_duty',
        description: 'Принять у Баседа поручение по костру',
        type: 'npc_talked',
        target: 'chk_based',
        completed: false,
      },
      {
        id: 'gather_kindling_perimeter',
        description: 'Собрать хворост по периметру лагеря',
        type: 'flag_set',
        target: 'aaa_campfire_kindling_gathered',
        completed: false,
      },
      {
        id: 'light_third_fire',
        description: 'Разжечь третий костёр у старой сосны',
        type: 'flag_set',
        target: 'aaa_campfire_third_fire_lit',
        completed: false,
      },
      {
        id: 'sit_in_circle',
        description: 'Сесть в круг у костра и слушать',
        type: 'flag_set',
        target: 'aaa_campfire_circle_seated',
        completed: false,
      },
      {
        id: 'hear_three_legends',
        description: 'Услышать три легенды ЧК/ТОЛПА',
        type: 'flag_set',
        target: 'aaa_campfire_legends_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 150 },
      { type: 'addKarma', value: 5 },
      { type: 'npcChange', npcId: 'chk_based', npcChange: { relation: 12 } },
      { type: 'npcChange', npcId: 'chk_ru', npcChange: { relation: 8 } },
      { type: 'discoverLore', loreId: 'lore_chk_network_role' },
      { type: 'discoverLore', loreId: 'lore_banned_poetry_tapes' },
      // setFlag «aaa_campfire_legends_done» удалён: дублирует objective
      // hear_three_legends (validate:content).
    ],
    questGiverNpcId: 'chk_based',
    linkedStoryNodeId: 'aaa_chk_campfire_legends_start',
    linkedStoryNodeIds: [
      'aaa_chk_campfire_legends_start',
      'aaa_chk_campfire_legends_kindling',
      'aaa_chk_campfire_legends_third_fire',
      'aaa_chk_campfire_legends_circle',
      'aaa_chk_campfire_legends_resolve',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 7 — «Последнее письмо»
     Доставить письмо от погибшего NPC. Эмоциональная концовка.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'aaa_epilogue_last_letter',
    title: 'Последнее письмо',
    description:
      'Альберт передаёт тебе конверт, который всю войну берёг у паяльной станции. На конверте — твоё имя. Внутри — письмо от того, кого уже нет. Адресат — не ты. Ты — только почтальон. Но адресат тоже почти исчез. Найди его. Пока ещё не поздно — пока кто-то помнит.',
    act: 7,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['rebuild_the_guild'],
    hint: 'Альберт → конверт → улица → адресат → прочесть вслух → прощание.',
    objectives: [
      {
        id: 'receive_letter_from_albert',
        description: 'Получить письмо от Альберта',
        type: 'npc_talked',
        target: 'albert',
        completed: false,
      },
      {
        id: 'carry_letter_through_city',
        description: 'Пронести письмо через опустевший город',
        type: 'location_visited',
        target: 'street_night',
        completed: false,
      },
      {
        id: 'find_intended_recipient',
        description: 'Найти адресата в библиотеке — того, кто ещё помнит',
        type: 'location_visited',
        target: 'library_day',
        completed: false,
      },
      {
        id: 'read_letter_aloud',
        description: 'Прочесть письмо вслух у окна',
        type: 'flag_set',
        target: 'aaa_last_letter_read',
        completed: false,
      },
      {
        id: 'hold_silence',
        description: 'Помолчать вместе с тем, кто остался',
        type: 'flag_set',
        target: 'aaa_last_letter_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 180 },
      { type: 'addKarma', value: 10 },
      { type: 'addStat', stat: 'stress', value: -15 },
      { type: 'npcChange', npcId: 'albert', npcChange: { relation: 15 } },
      { type: 'npcChange', npcId: 'kate', npcChange: { relation: 10 } },
      { type: 'collectPoem', poemId: 'poem_34' },
      // setFlag «aaa_last_letter_done» удалён: дублирует objective
      // hold_silence (validate:content WARN / аудит EXPERT #3).
    ],
    rewardItems: [{ itemId: 'anonymous_letter', quantity: 1 }],
    questGiverNpcId: 'albert',
    linkedStoryNodeId: 'aaa_epilogue_last_letter_start',
    linkedStoryNodeIds: [
      'aaa_epilogue_last_letter_start',
      'aaa_epilogue_last_letter_carry',
      'aaa_epilogue_last_letter_recipient',
      'aaa_epilogue_last_letter_read',
      'aaa_epilogue_last_letter_silence',
    ],
  },
];
