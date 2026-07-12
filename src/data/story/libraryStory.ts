import type { StoryNode } from '@/shared/types/game';

/** Библиотека: Катя, архив, подвал — Acts 2–7. */
export const STORY_NODES_LIBRARY: Record<string, StoryNode> = {
  library_story_intro: {
    id: 'library_story_intro',
    text: 'Катя встречает тебя у картотеки — палец на губах. «Сегодня в подвале работают свои,» — шепчет она. «Архив, который гильдия списала в утиль, на самом деле лежит за решёткой. Нужны глаза, которые умеют читать между строк.»',
    contextNote: 'Библиотека. Катя у картотеки.',
    accessibilityAnnounce: 'Библиотека. Катя шепчет о подвале и утерянном архиве.',
    speaker: 'Катя',
    sceneId: 'library_day',
    guidanceHint: 'Архив в подвале или ночное исследование с Катей.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Помочь найти утерянный архив',
        next: 'library_lost_archive_start',
        effects: [{ type: 'triggerQuest', questId: 'library_lost_archive' }],
      },
      {
        text: 'Предложить помощь с исследованием',
        next: 'library_katya_research_start',
        effects: [{ type: 'triggerQuest', questId: 'library_katya_research' }],
      },
      { text: 'Вернуться к чтению', next: 'library_explore_mode' },
    ],
  },

  library_lost_archive_start: {
    id: 'library_lost_archive_start',
    text: 'Спуск в подвал — пыль, сырость, скрип железной двери. Катя зажигает фонарь: «Здесь хранили поэзию до Краха. Гильдия поставила замок с RFID — но старый ключ механический. Я спрятала копию в Запретном Фонде.» Она смотрит на тебя: «Ты умеешь не оставлять следов?»',
    contextNote: 'Подвал библиотеки. Железная дверь, пыль, фонарь Кати.',
    accessibilityAnnounce: 'Подвал библиотеки. Тихо, пахнет старой бумагой.',
    speaker: 'Катя',
    sceneId: 'library_basement',
    choices: [
      {
        text: 'Взять ключ и искать архив',
        next: 'library_lost_archive_found',
        goldenPath: true,
      },
      { text: 'Вернуться наверх', next: 'library_explore_mode' },
    ],
  },

  library_lost_archive_found: {
    id: 'library_lost_archive_found',
    text: 'За решёткой — коробки с пометкой «УТИЛЬ» и датой до Краха. Внутри — не макулатура. Стихи на машинописи, подписи, которые исчезли из городского реестра. Катя дрожащими руками перелистывает: «Они живы. На бумаге — живы.»',
    contextNote: 'Утерянный архив за решёткой. Стихи на машинописи.',
    accessibilityAnnounce: 'За решёткой — стихи, списанные гильдией в утиль.',
    proceduralAmbientOverride: 'library',
    speaker: 'Катя',
    sceneId: 'library_basement',
    choices: [
      {
        text: 'Помочь оцифровать тайно',
        next: 'library_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'library_lost_archive_done', flagValue: true },
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'kate', npcChange: { relation: 6 } },
        ],
      },
    ],
  },

  library_katya_research_start: {
    id: 'library_katya_research_start',
    text: 'Катя разворачивает схему связей поэтов — нити между именами, которые система разорвала. «Мне нужен второй мозг. Ты видишь паттерны в коде — я в строфах. Вместе найдём, кто первый спрятал стихи в прошивке серверов.»',
    contextNote: 'Исследование Кати. Схема связей поэтов.',
    speaker: 'Катя',
    sceneId: 'library_day',
    choices: [
      {
        text: 'Сесть и работать всю ночь',
        next: 'library_katya_research_done',
        effects: [{ type: 'addStat', stat: 'energy', value: -10 }],
      },
    ],
  },

  library_katya_research_done: {
    id: 'library_katya_research_done',
    text: 'К утру схема сложилась: один узел повторяется — «Марат», имя, которое везде зачёркнуто. Катя бледнеет: «Он был первым. Его стёрли полностью — но след в прошивке остался.» Она протягивает распечатку: координаты серверной гильдии.',
    contextNote: 'Результат исследования — след Марата в прошивке.',
    speaker: 'Катя',
    sceneId: 'library_day',
    choices: [
      {
        text: 'Забрать распечатку',
        next: 'library_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'library_katya_research_done', flagValue: true },
          { type: 'setFlag', flag: 'marat_trace_found', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 2 },
        ],
      },
    ],
  },

  library_marat_echo: {
    id: 'library_marat_echo',
    text: 'Терминал в подвале мигает сам — без питания сети. На экране строки, написанные не тобой: «Если читаешь это — я ещё в проводах. Не верь гильдии. Верь рифме.» Голос синтетический, но интонация живая. Катя отступает: «Это он. Цифровой след.»',
    contextNote: 'Призрачное сообщение Марата на терминале в подвале.',
    accessibilityAnnounce: 'Терминал мигает. Цифровой след поэта Марата.',
    speaker: 'Марат (эхо)',
    sceneId: 'library_basement',
    condition: { flag: 'marat_trace_found' },
    choices: [
      {
        text: 'Ответить строкой из тетради',
        next: 'library_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'marat_echo_answered', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_15' },
        ],
      },
    ],
  },
};
