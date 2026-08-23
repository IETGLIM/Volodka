import type { QuestDefinition } from '@/shared/types/game';

/**
 * «Уличные легенды» — 5 новых побочных квестов (Акт 3 → Акт 5).
 *
 * Тема: ночной город рассказывают о себе сам — слухами, светом в брошенных
 * окнах, посылками без обратного адреса, крипами под заводом и голосом из
 * водостока. Каждый квест — одна городская легенда, в которой легендой
 * оказывается не страшилка, а чей-то незакрытый долг.
 *
 * Пять разных механик: наблюдение (флаги + время суток), доставка
 * (предмет + два NPC), зачистка (два крип-патруля + «король»), сбор трёх
 * потерянных вещей и расследование с моральным выбором в финале.
 *
 * Все ID NPC, предметов, сцен и врагов сверены с реестрами
 * (allNpcDefinitions.ts, items.ts, sceneIds.ts, engine/combat/enemies.ts).
 * Сюжетные ноды — в src/data/story/streetLegendsStory.ts.
 */
export const STREET_LEGENDS_QUESTS: QuestDefinition[] = [
  /* ═══════════════════════════════════════════════════════════════
     АКТ 3 — «Свет в окне напротив»
     Гриша с крыши видит мигающий свет в брошенном доме. Наблюдение
     в разное время суток → старый радиопередатчик.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'sl_window_light',
    title: 'Свет в окне напротив',
    description:
      'Гриша с крыши заметил: в брошенном доме по Косой, 12 — напротив твоего окна — по ночам мигает свет. Не хаотично: три длинных, девять коротких. Электричество в доме отключено лет двенадцать назад, а ритм — как азбука. Гильдия дом давно списала. Город — нет. Понаблюдай, спустись, найди источник.',
    act: 3,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['network_initiation'],
    hint: 'Гриша на крыше → наблюдение из своей комнаты (ночью ритм меняется) → Косая, 12 → передатчик.',
    objectives: [
      {
        id: 'hear_grisha_light_story',
        description: 'Услышать от Гриши про мигающий свет',
        type: 'npc_talked',
        target: 'grisha',
        completed: false,
      },
      {
        id: 'watch_window_from_room',
        description: 'Проследить за окном из своей комнаты',
        type: 'flag_set',
        target: 'sl_window_light_night_watch',
        completed: false,
      },
      {
        id: 'approach_abandoned_house',
        description: 'Выйти на улицу и найти брошенный дом на Косой, 12',
        type: 'location_visited',
        target: 'street_night',
        completed: false,
      },
      {
        id: 'find_transmitter_source',
        description: 'Найти источник света — старый радиопередатчик',
        type: 'flag_set',
        target: 'sl_window_light_transmitter_found',
        completed: false,
      },
      {
        id: 'decide_transmitter_fate',
        description: 'Решить судьбу передатчика — и легенды о нём',
        type: 'flag_set',
        target: 'sl_window_light_resolved',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 100 },
      { type: 'addSkill', skill: 'intuition', value: 2 },
      { type: 'npcChange', npcId: 'grisha', npcChange: { relation: 8 } },
      { type: 'discoverLore', loreId: 'lore_communal_radio' },
      { type: 'setFlag', flag: 'sl_window_light_done', flagValue: true },
    ],
    rewardItems: [{ itemId: 'old_radio_transmitter', quantity: 1 }],
    questGiverNpcId: 'grisha',
    linkedStoryNodeId: 'sl_window_light_start',
    linkedStoryNodeIds: [
      'sl_window_light_start',
      'sl_window_light_watch',
      'sl_window_light_street',
      'sl_window_light_house',
      'sl_window_light_room',
      'sl_window_light_resolve',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 3 — «Курьер поневоле»
     Лёня просит доставить запечатанную посылку Сергею через
     полгорода. Внутри — не кофемолка.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'sl_reluctant_courier',
    title: 'Курьер поневоле',
    description:
      'Лёня подзывает тебя в конце смены и протягивает крафт-пакет, перетянутый бечёвкой. Адресат — Сергей, сисадмин ночной смены, через полгорода. «Не потеряй. Не вскрывай. И не спрашивай, почему я не отдам его сам — я пробовал. Двенадцать лет пробовал». Пакет пахнет кофе и чем-то ещё — бумагой, которая ждала слишком долго.',
    act: 3,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['sl_window_light'],
    hint: 'Лёня в кафе → забрать посылку → ночная улица → серверная Сергея → вручить из рук в руки.',
    objectives: [
      {
        id: 'accept_lyonya_parcel',
        description: 'Принять поручение от Лёни',
        type: 'npc_talked',
        target: 'lyonya',
        completed: false,
      },
      {
        id: 'take_sealed_parcel',
        description: 'Забрать запечатанную посылку',
        type: 'item_collected',
        target: 'sealed_parcel',
        completed: false,
      },
      {
        id: 'carry_parcel_through_city',
        description: 'Пронести посылку через ночной город',
        type: 'location_visited',
        target: 'street_night',
        completed: false,
      },
      {
        id: 'deliver_parcel_to_sergey',
        description: 'Доставить посылку Сергею — из рук в руки',
        type: 'npc_talked',
        target: 'sergey',
        completed: false,
      },
      {
        id: 'witness_parcel_opening',
        description: 'Дождаться, пока Сергей откроет посылку',
        type: 'flag_set',
        target: 'sl_courier_parcel_delivered',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 120 },
      { type: 'addKarma', value: 4 },
      { type: 'addCredits', value: 40 },
      { type: 'npcChange', npcId: 'lyonya', npcChange: { relation: 10 } },
      { type: 'npcChange', npcId: 'sergey', npcChange: { relation: 6 } },
      { type: 'discoverLore', loreId: 'lore_coffee_code' },
      { type: 'setFlag', flag: 'sl_courier_done', flagValue: true },
    ],
    questGiverNpcId: 'lyonya',
    linkedStoryNodeId: 'sl_courier_start',
    linkedStoryNodeIds: [
      'sl_courier_start',
      'sl_courier_takeoff',
      'sl_courier_street',
      'sl_courier_delivery',
      'sl_courier_reading',
      'sl_courier_resolve',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 4 — «Крысиные бега»
     Мастер «Прогресса-7» платит за зачистку подвала от крип-патрулей.
     Два патруля и «крысиный король» на ржавой стойке.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'sl_rat_race',
    title: 'Крысиные бега',
    description:
      'Мастер завода «Прогресс-7» не верит в мистику, но платит за чистые подвалы. Ночами подвал оживает: крипы грызут кабели, стягиваются к старой серверной стойке и свивают вокруг неё что-то вроде гнезда. «Крысы — это ладно, — говорит мастер. — Крысы уходят от яда. Эти — приходят к броду». Зачисти два патруля и разберись с тем, что они охраняют.',
    act: 4,
    faction: 'guild',
    questType: 'side',
    difficulty: 'hard',
    requiresQuests: ['sl_reluctant_courier'],
    hint: 'Мастер в цеху → подвал завода → два крип-патруля → «крысиный король» на ржавой стойке → трофей.',
    objectives: [
      {
        id: 'accept_foreman_clearing_job',
        description: 'Взять у мастера заказ на зачистку подвала',
        type: 'npc_talked',
        target: 'factory_foreman',
        completed: false,
      },
      {
        id: 'descend_progress7_basement',
        description: 'Спуститься в подвал «Прогресса-7»',
        type: 'location_visited',
        target: 'factory_basement',
        completed: false,
      },
      {
        id: 'clear_first_crypt_patrol',
        description: 'Разогнать первый крип-патруль (Призрак Данных)',
        type: 'flag_set',
        target: 'sl_rat_race_patrol_one_cleared',
        completed: false,
      },
      {
        id: 'clear_second_crypt_patrol',
        description: 'Разогнать второй крип-патруль (Гильдейский силовик)',
        type: 'flag_set',
        target: 'sl_rat_race_patrol_two_cleared',
        completed: false,
      },
      {
        id: 'defeat_rat_king',
        description: 'Победить «крысиного короля» — Ржавого Стража',
        type: 'flag_set',
        target: 'sl_rat_race_king_defeated',
        completed: false,
      },
      {
        id: 'take_rat_king_crown',
        description: 'Забрать трофей — «крысиную корону» из оптоволокна',
        type: 'item_collected',
        target: 'rat_king_crown',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 170 },
      { type: 'addCredits', value: 90 },
      { type: 'addSkill', skill: 'coding', value: 2 },
      { type: 'npcChange', npcId: 'factory_foreman', npcChange: { relation: 10 } },
      { type: 'discoverLore', loreId: 'lore_factory_ghosts' },
      { type: 'setFlag', flag: 'sl_rat_race_done', flagValue: true },
    ],
    rewardItems: [{ itemId: 'rat_king_crown', quantity: 1 }],
    questGiverNpcId: 'factory_foreman',
    linkedStoryNodeId: 'sl_rat_race_start',
    linkedStoryNodeIds: [
      'sl_rat_race_start',
      'sl_rat_race_basement',
      'sl_rat_race_first_patrol',
      'sl_rat_race_second_patrol',
      'sl_rat_race_king',
      'sl_rat_race_resolve',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 4 — «Тихий час»
     Тамара верит в библиотечную легенду про «тихий час»: раз в год
     забытые вещи шепчут. Собрать три — очки, зонт и кассету.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'sl_quiet_hour',
    title: 'Тихий час',
    description:
      'Тамара шепчет про библиотечную легенду: раз в год, в «тихий час», все забытые читателями вещи начинают шептать — и если к утру их не вернуть владельцам, шёпот затихает навсегда. В этом году их три: очки в читальном зале, зонт у входа и кассета в подвале, на которой нацарапано «тихий час». Владельцев Тамара знает. Владельца кассеты — знала.',
    act: 4,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['library_lost_archive'],
    hint: 'Тамара → читальный зал (очки) → стояк у входа (зонт) → подвал Запретного Фонда (кассета) → вернуть Тамаре.',
    objectives: [
      {
        id: 'hear_tamara_quiet_hour',
        description: 'Услышать от Тамары легенду о тихом часе',
        type: 'npc_talked',
        target: 'tamara',
        completed: false,
      },
      {
        id: 'find_lost_reading_glasses',
        description: 'Найти забытые очки в читальном зале',
        type: 'item_collected',
        target: 'lost_reading_glasses',
        completed: false,
      },
      {
        id: 'find_lost_umbrella',
        description: 'Найти забытый зонт в стояке у входа',
        type: 'item_collected',
        target: 'lost_umbrella',
        completed: false,
      },
      {
        id: 'find_lost_tape',
        description: 'Найти кассету «тихий час» в подвале архива',
        type: 'item_collected',
        target: 'lost_tape',
        completed: false,
      },
      {
        id: 'return_items_to_tamara',
        description: 'Вернуть все три вещи Тамаре',
        type: 'npc_talked',
        target: 'tamara',
        completed: false,
      },
      {
        id: 'decide_tape_fate',
        description: 'Решить судьбу кассеты — последнего голоса',
        type: 'flag_set',
        target: 'sl_quiet_hour_choice_made',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 130 },
      { type: 'addKarma', value: 5 },
      { type: 'addSkill', skill: 'empathy', value: 2 },
      { type: 'npcChange', npcId: 'tamara', npcChange: { relation: 10 } },
      { type: 'discoverLore', loreId: 'lore_library_index' },
      { type: 'setFlag', flag: 'sl_quiet_hour_done', flagValue: true },
    ],
    questGiverNpcId: 'tamara',
    linkedStoryNodeId: 'sl_quiet_hour_start',
    linkedStoryNodeIds: [
      'sl_quiet_hour_start',
      'sl_quiet_hour_glasses',
      'sl_quiet_hour_umbrella',
      'sl_quiet_hour_tape',
      'sl_quiet_hour_return',
      'sl_quiet_hour_resolve',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 5 — «Голос из водостока»
     Уличный поэт собирает городские легенды. Одна из них — голос
     в парке, у водостока. Расследование с финальным выбором.
     ═══════════════════════════════════════════════════════════════ */
  {
    id: 'sl_drainpipe_voice',
    title: 'Голос из водостока',
    description:
      'Уличный поэт коллекционирует городские легенды, но одна не даёт ему спать: у старого водостока в мемориальном парке, если бросить в решётку монету, из-под земли отвечает голос. Не эхо — голос: старый диктор, обрывок стиха и тишина, которая слушает в ответ. У поэта своя теория. У старика на скамье — своя. Проверь, чья правда городу нужнее.',
    act: 5,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    requiresQuests: ['sl_rat_race'],
    hint: 'Уличный поэт на площади → старик на скамье в парке → водосточная решётка → источник → выбор.',
    objectives: [
      {
        id: 'hear_poet_drainpipe_legend',
        description: 'Услышать от уличного поэта легенду о голосе',
        type: 'npc_talked',
        target: 'street_poet',
        completed: false,
      },
      {
        id: 'ask_old_man_about_voice',
        description: 'Спросить старика на скамье про голос',
        type: 'npc_talked',
        target: 'park_old_man',
        completed: false,
      },
      {
        id: 'reach_park_drainpipe',
        description: 'Найти водосточную решётку в мемориальном парке',
        type: 'location_visited',
        target: 'park_day',
        completed: false,
      },
      {
        id: 'listen_to_drainpipe_voice',
        description: 'Послушать голос из-под земли',
        type: 'flag_set',
        target: 'sl_drainpipe_voice_heard',
        completed: false,
      },
      {
        id: 'find_voice_source',
        description: 'Найти источник голоса под решёткой',
        type: 'flag_set',
        target: 'sl_drainpipe_source_found',
        completed: false,
      },
      {
        id: 'decide_voice_fate',
        description: 'Решить: сообщить о находке — или сохранить тайну',
        type: 'flag_set',
        target: 'sl_drainpipe_resolved',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 150 },
      { type: 'addSkill', skill: 'intuition', value: 2 },
      { type: 'npcChange', npcId: 'street_poet', npcChange: { relation: 10 } },
      { type: 'npcChange', npcId: 'park_old_man', npcChange: { relation: 8 } },
      { type: 'discoverLore', loreId: 'lore_dead_channel' },
      { type: 'setFlag', flag: 'sl_drainpipe_done', flagValue: true },
    ],
    questGiverNpcId: 'street_poet',
    linkedStoryNodeId: 'sl_drainpipe_start',
    linkedStoryNodeIds: [
      'sl_drainpipe_start',
      'sl_drainpipe_oldman',
      'sl_drainpipe_listen',
      'sl_drainpipe_source',
      'sl_drainpipe_choice',
      'sl_drainpipe_resolve',
    ],
  },
];
