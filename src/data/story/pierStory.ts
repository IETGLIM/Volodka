import type { StoryNode } from '@/shared/types/game';

/** Пирс: Трофим, Ритка, река — побочная линия Acts 2–4. */
export const STORY_NODES_PIER: Record<string, StoryNode> = {
  pier_story_intro: {
    id: 'pier_story_intro',
    text: 'Вечерний пирс — другой ритм, чем у лесного костра. Вода шуршит о сваи, в бочке тлеет угли, а Трофим кивает тебе с удочкой: «Опоздал на закат — ничего. На рассвете клюёт правда.» Ритка сидит на ящике и перебирает струны — одна порвана.',
    contextNote: 'Вечерний пирс. Трофим, Ритка, костёр в бочке.',
    accessibilityAnnounce: 'Вечерний пирс. Костёр в бочке, вода у свай.',
    proceduralAmbientOverride: 'pier',
    speaker: 'narrator',
    sceneId: 'pier_evening',
    guidanceHint: 'Ночная рыбалка с Трофимом или струны для Ритки.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Сесть с Трофимом — ночная рыбалка',
        next: 'pier_midnight_fishing_start',
        effects: [{ type: 'triggerQuest', questId: 'pier_midnight_fishing' }],
      },
      {
        text: 'Спросить Ритку про струны',
        next: 'pier_ritka_strings_start',
        effects: [{ type: 'triggerQuest', questId: 'pier_ritka_strings' }],
      },
      { text: 'Вернуться к исследованию', next: 'pier_evening_explore_mode' },
    ],
  },

  pier_midnight_fishing_start: {
    id: 'pier_midnight_fishing_start',
    text: 'Трофим молча протягивает второй поплавок. «Молчи. Река не любит болтунов.» Ты берёшь удочку — рукоять тёплая от его ладони. Где-то в бочке тлеют угли. «Садись. Час без слов — это тоже разговор.»',
    contextNote: 'Ночная рыбалка начинается. Трофим протягивает поплавок.',
    accessibilityAnnounce: 'Трофим даёт второй поплавок. Садись у воды.',
    proceduralAmbientOverride: 'pier',
    speaker: 'Трофим',
    sceneId: 'pier_evening',
    guidanceHint: 'Возьми поплавок и сядь с Трофимом у свай.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'fisherman_trofim',
    choices: [
      {
        text: 'Взять поплавок и сесть',
        next: 'pier_midnight_fishing_sit',
        effects: [
          { type: 'setFlag', flag: 'pier_fishing_accepted', flagValue: true },
          { type: 'setFlag', flag: 'pier_fishing_float_taken', flagValue: true },
        ],
      },
      {
        text: 'Позже — река подождёт',
        next: 'pier_evening_explore_mode',
        condition: { missingFlag: 'pier_fishing_float_taken' },
      },
    ],
  },

  pier_midnight_fishing_sit: {
    id: 'pier_midnight_fishing_sit',
    text: 'Доски пирса холодят через джинсы. Леска уходит в чёрную воду — без поклёвки, и это нормально. Трофим курит молча. Минуты тянутся, как кабель без сигнала. Потом ты замечаешь: под ногами не только река.',
    contextNote: 'Тишина на пирсе. Удочки в воде. Нет поклёвки.',
    accessibilityAnnounce: 'Сидишь с удочкой. Тишина. Гул снизу.',
    proceduralAmbientOverride: 'pier',
    speaker: 'narrator',
    sceneId: 'pier_evening',
    guidanceHint: 'Прислушайся — под водой что-то гудит.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Прислушаться к воде',
        next: 'pier_midnight_fishing_bass',
        effects: [{ type: 'setFlag', flag: 'pier_fishing_seated', flagValue: true }],
      },
      {
        text: 'Отойти — леска ещё в воде',
        next: 'pier_evening_explore_mode',
        condition: { missingFlag: 'pier_fishing_seated' },
      },
    ],
  },

  pier_midnight_fishing_bass: {
    id: 'pier_midnight_fishing_bass',
    text: 'Где-то внизу гудит завод, как далёкий бас. Не машина на берегу — машина под сваей, под илом, под тем, что город называет «заброшенным». Трофим кивает, не глядя: «Слышишь. Значит, готов.»',
    contextNote: 'Гул завода под пирсом. Трофим кивает.',
    accessibilityAnnounce: 'Гул завода под водой. Трофим готов говорить.',
    proceduralAmbientOverride: 'pier',
    speaker: 'Трофим',
    sceneId: 'pier_evening',
    guidanceHint: 'Трофим расскажет про ключ — слушай.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'fisherman_trofim',
    choices: [
      {
        text: 'Кивнуть — слушаю',
        next: 'pier_midnight_fishing_key',
        effects: [{ type: 'setFlag', flag: 'pier_factory_bass_heard', flagValue: true }],
      },
      {
        text: 'Отойти — бас ещё гудит под сваей',
        next: 'pier_evening_explore_mode',
        condition: { missingFlag: 'pier_factory_bass_heard' },
      },
    ],
  },

  pier_midnight_fishing_key: {
    id: 'pier_midnight_fishing_key',
    text: 'Трофим вдруг говорит: «Ключ от подвала я спрятал под третьей сваей. Если дойдёшь — не трогай машину. Сначала слушай.» Он сматывает леску. «Ночь удалась. Даже без рыбы.»',
    contextNote: 'Трофим раскрывает тайну третьей сваи.',
    accessibilityAnnounce: 'Ключ под третьей сваей. Не трогай машину — сначала слушай.',
    proceduralAmbientOverride: 'pier',
    speaker: 'Трофим',
    sceneId: 'pier_evening',
    guidanceHint: 'Запомни про третью сваю — ночная рыбалка завершена.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Запомнить про третью сваю',
        next: 'pier_evening_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'pier_third_pile_hint', flagValue: true },
          { type: 'setFlag', flag: 'pier_midnight_fishing_done', flagValue: true },
          { type: 'npcChange', npcId: 'npc_trofim', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Отойти — свая подождёт',
        next: 'pier_evening_explore_mode',
        condition: { missingFlag: 'pier_midnight_fishing_done' },
      },
    ],
  },

  pier_ritka_strings_start: {
    id: 'pier_ritka_strings_start',
    text: 'Ритка вздыхает: «Струны кончились. В городе — только гильдейские, с чипом прослушки. В ЧК у Элис была запасная шестёрка — E для тех, кто играет тихо.» Она смотрит на реку: «Достань — спою на эфире. Без струн я только шепчу.»',
    contextNote: 'Ритка просит струны для гитары.',
    accessibilityAnnounce: 'Ритка просит струны. Запасная у Элис в ЧК.',
    proceduralAmbientOverride: 'pier',
    speaker: 'Ритка',
    sceneId: 'pier_evening',
    guidanceHint: 'Пообещай найти струны — путь через ЧК и Элис.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'chk_ritka',
    choices: [
      {
        text: 'Обещать найти струны в ЧК',
        next: 'pier_ritka_strings_promise',
        effects: [{ type: 'setFlag', flag: 'pier_ritka_strings_active', flagValue: true }],
      },
      { text: 'Не сейчас', next: 'pier_evening_explore_mode' },
    ],
  },

  pier_ritka_strings_promise: {
    id: 'pier_ritka_strings_promise',
    text: 'Ты киваешь. Ритка улыбается — редкое событие. «Тогда слушай реку, пока ищешь. Она иногда подсказывает, где спрятаны вещи, которые город забыл.»',
    contextNote: 'Обещание Ритке дано. Путь — к Элис.',
    accessibilityAnnounce: 'Ритка улыбается. Иди к Элис в ЧК.',
    proceduralAmbientOverride: 'pier',
    speaker: 'Ритка',
    sceneId: 'pier_evening',
    guidanceHint: 'Найди Элис у костра ЧК — спроси про запасную струну.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'chk_elis',
    choices: [
      {
        text: 'Отправиться в ЧК за струнами',
        next: 'chk_explore_mode',
        condition: { flag: 'chk_forest_unlocked' },
        effects: [{ type: 'transitionScene', sceneId: 'chk_forest_zorge' }],
      },
      { text: 'Остаться на пирсе', next: 'pier_evening_explore_mode' },
    ],
  },

  pier_ritka_elis_ask: {
    id: 'pier_ritka_elis_ask',
    text: 'Элис крутит колок без E: «Ритка прислала тебя? У меня — только обрывок. Полная шестёрка лежит у коллеги в офисе — он из ТОЛПЫ, но стесняется носить струны на работу. Принеси — соберу комплект, ты отнесёшь Ритке.»',
    contextNote: 'Элис указывает на офисного коллегу.',
    accessibilityAnnounce: 'Элис: запасная струна у коллеги в офисе.',
    speaker: 'Элис',
    sceneId: 'chk_forest_zorge',
    guidanceHint: 'Иди в офис — коллега отдаст струну без слов.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Офис',
    choices: [
      {
        text: 'Идти в офис за струной',
        next: 'pier_ritka_office_string',
        effects: [
          { type: 'setFlag', flag: 'pier_ritka_elis_asked', flagValue: true },
          { type: 'transitionScene', sceneId: 'office_day' },
        ],
      },
      {
        text: 'Запомнить и уйти',
        next: 'chk_explore_mode',
        effects: [{ type: 'setFlag', flag: 'pier_ritka_elis_asked', flagValue: true }],
      },
    ],
  },

  pier_ritka_office_string: {
    id: 'pier_ritka_office_string',
    text: 'Коллега в офисе открывает ящик, достаёт свёрток в газетной бумаге и подмигивает — ни слова. Струна холодит ладонь. На этикетке чужим почерком: «Для тех, кто играет тихо.»',
    contextNote: 'Офис. Коллега отдаёт запасную струну.',
    accessibilityAnnounce: 'Коллега отдал струну без слов.',
    speaker: 'narrator',
    sceneId: 'office_day',
    guidanceHint: 'Вернись к Элис в ЧК — она соберёт комплект.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'chk_elis',
    choices: [
      {
        text: 'Нести струну Элис',
        next: 'pier_ritka_elis_pack',
        effects: [
          { type: 'setFlag', flag: 'pier_ritka_get_strings_done', flagValue: true },
          { type: 'transitionScene', sceneId: 'chk_campfire_night' },
        ],
      },
      {
        text: 'Отойти — свёрток ещё в ящике',
        next: 'office_explore_mode',
        condition: { missingFlag: 'pier_ritka_get_strings_done' },
      },
    ],
  },

  pier_ritka_elis_pack: {
    id: 'pier_ritka_elis_pack',
    text: 'Элис натягивает струну на свою гитару на секунду — проверка — и сматывает комплект в тряпичный свёрток. «Ритке. Скажи: E должна звучать, как лёд на рассвете. И пусть не благодарит — просто играет.»',
    contextNote: 'Элис собрала комплект струн для Ритки.',
    accessibilityAnnounce: 'Элис отдала комплект струн для Ритки.',
    speaker: 'Элис',
    sceneId: 'chk_campfire_night',
    guidanceHint: 'Вернись на пирс — отдай струны Ритке.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'chk_ritka',
    choices: [
      {
        text: 'Нести свёрток на пирс',
        next: 'pier_ritka_strings_delivered',
        effects: [
          { type: 'setFlag', flag: 'pier_ritka_elis_pack_ready', flagValue: true },
          { type: 'transitionScene', sceneId: 'pier_evening' },
        ],
      },
      {
        text: 'Отойти — комплект ещё у костра',
        next: 'chk_campfire_night_explore_mode',
        condition: { missingFlag: 'pier_ritka_elis_pack_ready' },
      },
    ],
  },

  pier_ritka_strings_delivered: {
    id: 'pier_ritka_strings_delivered',
    text: 'Ритка натягивает новую струну — звук чистый, как утренний лёд. «Спасибо, Володька.» Она играет четыре такта — без слов, но ты узнаёшь мелодию из первого костра. Трофим хлопает в ладоши один раз. Река, кажется, тоже одобряет.',
    contextNote: 'Ритка натягивает новую струну на пирсе.',
    accessibilityAnnounce: 'Ритка играет на новой струне. Четыре такта у воды.',
    proceduralAmbientOverride: 'pier',
    speaker: 'Ритка',
    sceneId: 'pier_evening',
    guidanceHint: 'Послушай четыре такта — квест струн закрыт.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Послушать и уйти',
        next: 'pier_evening_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'pier_ritka_strings_done', flagValue: true },
          { type: 'setFlag', flag: 'pier_ritka_song_heard', flagValue: true },
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'chk_ritka', npcChange: { relation: 8 } },
        ],
      },
    ],
  },

  pier_river_thread: {
    id: 'pier_river_thread',
    text: 'Лунная дорожка на воде дрожит — не от ветра, от чего-то глубже. Трофим говорит шёпотом: «Река несёт не только рыбу. Несёт эхо — то, что стёрли из архивов. Прислушайся.» На секунду слышишь голос — не твой, не чужой. Потом только плеск.',
    contextNote: 'Лунная дорожка. Эхо стёртых архивов в воде.',
    accessibilityAnnounce: 'Река шепчет эхо стёртых записей.',
    proceduralAmbientOverride: 'pier',
    speaker: 'narrator',
    sceneId: 'river_pier',
    choices: [
      {
        text: 'Записать услышанное в тетрадь',
        next: 'pier_explore_mode',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'pier_river_echo', flagValue: true },
        ],
      },
    ],
  },
};
