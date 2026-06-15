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
    text: 'Трофим молча протягивает второй поплавок. «Молчи. Река не любит болтунов.» Час проходит без единой поклёвки — и это нормально. Где-то внизу гудит завод, как далёкий бас. Трофим вдруг говорит: «Ключ от подвала я спрятал под третьей сваей. Если дойдёшь — не трогай машину. Сначала слушай.»',
    contextNote: 'Ночная рыбалка с Трофимом. Тишина, гул завода под водой.',
    accessibilityAnnounce: 'Ночная рыбалка. Тишина, гул завода под водой.',
    proceduralAmbientOverride: 'pier',
    speaker: 'Трофим',
    sceneId: 'pier_evening',
    choices: [
      {
        text: 'Запомнить про третью сваю',
        next: 'pier_evening_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'pier_midnight_fishing_done', flagValue: true },
          { type: 'npcChange', npcId: 'npc_trofim', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  pier_ritka_strings_start: {
    id: 'pier_ritka_strings_start',
    text: 'Ритка вздыхает: «Струны кончились. В городе — только гильдейские, с чипом прослушки. В ЧК у Элис была запасная шестёрка — E для тех, кто играет тихо.» Она смотрит на реку: «Достань — спою на эфире. Без струн я только шепчу.»',
    contextNote: 'Ритка просит струны для гитары.',
    speaker: 'Ритка',
    sceneId: 'pier_evening',
    guidanceHint: 'Найди струны в ЧК у Элис.',
    guidanceObjectiveType: 'complete_quest',
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
    speaker: 'Ритка',
    sceneId: 'pier_evening',
    choices: [
      {
        text: 'Отправиться в ЧК за струнами',
        next: 'chk_explore_mode',
        condition: { flag: 'chk_forest_unlocked' },
      },
      { text: 'Остаться на пирсе', next: 'pier_evening_explore_mode' },
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
    choices: [
      {
        text: 'Послушать и уйти',
        next: 'pier_evening_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'pier_ritka_strings_done', flagValue: true },
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
