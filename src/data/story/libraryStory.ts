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
    text: 'Катя ведёт тебя к стеллажу «Запретный Фонд» — полка с RFID-бирками и одной механической щелью. «Гильдия поставила замок с чипом. Старый ключ я спрятала здесь, между томами, которые никто не берёт. Ты умеешь не оставлять следов?»',
    contextNote: 'Библиотека. Запретный Фонд. Ключ к подвальному архиву.',
    accessibilityAnnounce: 'Катя указывает на Запретный Фонд — там спрятан ключ.',
    speaker: 'Катя',
    sceneId: 'library_day',
    guidanceHint: 'Возьми механический ключ из Запретного Фонда.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'kate',
    choices: [
      {
        text: 'Согласиться — искать ключ в Фонде',
        next: 'library_archive_fund_key',
        goldenPath: true,
        effects: [{ type: 'setFlag', flag: 'library_lost_archive_active', flagValue: true }],
      },
      { text: 'Вернуться наверх позже', next: 'library_explore_mode' },
    ],
  },

  library_archive_fund_key: {
    id: 'library_archive_fund_key',
    text: 'Между «Сборником забытых строф» и пустым корешком — холодный ключ без чипа. Катя кивает: «Подвал. Железная дверь. Не включай свет над входом — камера гильдии любит движение.»',
    contextNote: 'Ключ из Запретного Фонда в ладони.',
    accessibilityAnnounce: 'Ты нашёл механический ключ к подвалу.',
    speaker: 'Катя',
    sceneId: 'library_day',
    guidanceHint: 'Спустись в подвал библиотеки с Катей.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Подвал библиотеки',
    choices: [
      {
        text: 'Спуститься в подвал',
        next: 'library_archive_descent',
        effects: [
          { type: 'setFlag', flag: 'library_archive_key_found', flagValue: true },
          { type: 'transitionScene', sceneId: 'library_basement' },
        ],
      },
      {
        text: 'Спрятать ключ и отойти',
        next: 'library_explore_mode',
        effects: [{ type: 'setFlag', flag: 'library_archive_key_found', flagValue: true }],
      },
    ],
  },

  library_archive_descent: {
    id: 'library_archive_descent',
    text: 'Спуск — пыль, сырость, скрип железной двери. Фонарь Кати выхватывает решётку с RFID-замком и одну механическую скважину рядом. «Чип врёт. Ключ — нет.»',
    contextNote: 'Подвал библиотеки. Железная дверь, пыль, фонарь Кати.',
    accessibilityAnnounce: 'Подвал библиотеки. Тихо, пахнет старой бумагой.',
    speaker: 'Катя',
    sceneId: 'library_basement',
    guidanceHint: 'Открой решётку механическим ключом.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Вставить ключ в механическую скважину',
        next: 'library_archive_gate',
        effects: [{ type: 'setFlag', flag: 'library_basement_entered', flagValue: true }],
      },
    ],
  },

  library_archive_gate: {
    id: 'library_archive_gate',
    text: 'Щелчок — RFID мигает красным, но засов уже отошёл. За решёткой — коробки с пометкой «УТИЛЬ» и датой до Краха. Катя шепчет: «Не трогай верхний ряд. Нижний — наш.»',
    contextNote: 'Решётка архива открыта. Коробки «УТИЛЬ».',
    accessibilityAnnounce: 'Решётка открыта. Архив за ней.',
    speaker: 'Катя',
    sceneId: 'library_basement',
    guidanceHint: 'Разбери нижний ряд коробок — там стихи.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Открыть нижний ряд',
        next: 'library_lost_archive_found',
        effects: [{ type: 'setFlag', flag: 'library_archive_gate_open', flagValue: true }],
      },
    ],
  },

  library_lost_archive_found: {
    id: 'library_lost_archive_found',
    text: 'Внутри — не макулатура. Стихи на машинописи, подписи, которые исчезли из городского реестра. Катя дрожащими руками перелистывает: «Они живы. На бумаге — живы. Теперь надо унести следы — оцифровать тайно, пока гильдия не заметила скважину.»',
    contextNote: 'Утерянный архив за решёткой. Стихи на машинописи.',
    accessibilityAnnounce: 'За решёткой — стихи, списанные гильдией в утиль.',
    proceduralAmbientOverride: 'library',
    speaker: 'Катя',
    sceneId: 'library_basement',
    guidanceHint: 'Помоги Кате оцифровать архив тайно.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Помочь оцифровать тайно',
        next: 'library_archive_digitize',
        effects: [{ type: 'setFlag', flag: 'library_archive_recovered', flagValue: true }],
      },
    ],
  },

  library_archive_digitize: {
    id: 'library_archive_digitize',
    text: 'Ноутбук Кати жужжит без сети — локальный снимок. Страницы уходят в шифрованный том. Она закрывает крышку: «Теперь они не в утиле. Они — у нас.» RFID снова мигает зря. Вы поднимаетесь, не включая верхний свет.',
    contextNote: 'Тайная оцифровка архива завершена.',
    accessibilityAnnounce: 'Архив оцифрован тайно. Квест закрыт.',
    speaker: 'Катя',
    sceneId: 'library_basement',
    guidanceHint: 'Архив спасён — можно вернуться к чтению.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Подняться наверх',
        next: 'library_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'library_lost_archive_done', flagValue: true },
          { type: 'setFlag', flag: 'library_archive_digitized', flagValue: true },
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'kate', npcChange: { relation: 6 } },
          { type: 'transitionScene', sceneId: 'library_day' },
        ],
      },
    ],
  },

  library_katya_research_start: {
    id: 'library_katya_research_start',
    text: 'Катя разворачивает схему связей поэтов — нити между именами, которые система разорвала. «Мне нужен второй мозг. Ты видишь паттерны в коде — я в строфах. Вместе найдём, кто первый спрятал стихи в прошивке серверов.»',
    contextNote: 'Исследование Кати. Схема связей поэтов.',
    accessibilityAnnounce: 'Катя предлагает ночь на исследование схемы поэтов.',
    speaker: 'Катя',
    sceneId: 'library_day',
    guidanceHint: 'Согласись — разверните схему связей вместе.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'kate',
    choices: [
      {
        text: 'Сесть к схеме — начинаем',
        next: 'library_katya_schema',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'library_katya_research' },
          { type: 'setFlag', flag: 'library_katya_research_active', flagValue: true },
        ],
      },
      { text: 'Позже — голова ещё шумит', next: 'library_explore_mode' },
    ],
  },

  library_katya_schema: {
    id: 'library_katya_schema',
    text: 'Бумага шуршит. Имена, даты, обрывы строк. Катя ставит карандаш: «Сначала — граф. Кто цитировал кого до Краха. Гильдия вырезала рёбра; мы восстановим.» Ты видишь петлю, которую алгоритм счёл шумом.',
    contextNote: 'Развёрнутая схема связей поэтов на столе Кати.',
    accessibilityAnnounce: 'Вы открываете схему связей поэтов.',
    speaker: 'Катя',
    sceneId: 'library_day',
    guidanceHint: 'Сверь схему с каталогом прошивок гильдии.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Отметить петлю на схеме',
        next: 'library_katya_crossref',
        effects: [{ type: 'setFlag', flag: 'library_katya_schema_open', flagValue: true }],
      },
    ],
  },

  library_katya_crossref: {
    id: 'library_katya_crossref',
    text: 'Катя достаёт распечатку прошивочных хешей — «мусор» из серверной гильдии. «Ищи совпадения с рифмами. Код любит повторы.» Между CRC и строфой всплывает один и тот же отпечаток — зачёркнутое имя.',
    contextNote: 'Кросс-сверка схемы поэтов с прошивочными хешами.',
    accessibilityAnnounce: 'Сверка схемы с каталогом прошивок.',
    speaker: 'Катя',
    sceneId: 'library_day',
    guidanceHint: 'Останься на ночь — дожать узел.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Зафиксировать совпадение хеша',
        next: 'library_katya_night',
        effects: [{ type: 'setFlag', flag: 'library_katya_firmware_cross', flagValue: true }],
      },
    ],
  },

  library_katya_night: {
    id: 'library_katya_night',
    text: 'Часы сдвигаются. Лампа Кати жжёт глаза. «Ещё один проход,» — шепчет она. «Если узел живой — он ответит в подвале: терминал без сети иногда мигает сам.» Энергия уходит в строки.',
    contextNote: 'Ночная смена у схемы. Путь к подвальному терминалу.',
    accessibilityAnnounce: 'Ночь исследования. Катя предлагает спуститься в подвал.',
    speaker: 'Катя',
    sceneId: 'library_day',
    guidanceHint: 'Спустись в подвал — проверить терминал на след.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Подвал библиотеки',
    choices: [
      {
        text: 'Спуститься к терминалу',
        next: 'library_katya_marat_hit',
        effects: [
          { type: 'setFlag', flag: 'library_katya_night_pass', flagValue: true },
          { type: 'addStat', stat: 'energy', value: -10 },
          { type: 'transitionScene', sceneId: 'library_basement' },
        ],
      },
      {
        text: 'Дожать сверху — без спуска',
        next: 'library_katya_marat_hit',
        effects: [
          { type: 'setFlag', flag: 'library_katya_night_pass', flagValue: true },
          { type: 'addStat', stat: 'energy', value: -12 },
        ],
      },
    ],
  },

  library_katya_marat_hit: {
    id: 'library_katya_marat_hit',
    text: 'Узел вспыхивает один раз — как имя, которое система зачеркнула, но не стёрла из частоты. «Марат.» Катя бледнеет: «Он был первым. След в прошивке остался. Распечатаю координаты серверной — не теряй.»',
    contextNote: 'Узел «Марат» найден на схеме.',
    accessibilityAnnounce: 'Найден цифровой след поэта Марата.',
    speaker: 'Катя',
    sceneId: 'library_day',
    guidanceHint: 'Забери распечатку у Кати.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'kate',
    choices: [
      {
        text: 'Идти за распечаткой',
        next: 'library_katya_research_done',
        effects: [
          { type: 'setFlag', flag: 'library_katya_marat_node', flagValue: true },
          { type: 'transitionScene', sceneId: 'library_day' },
        ],
      },
    ],
  },

  library_katya_research_done: {
    id: 'library_katya_research_done',
    text: 'К утру схема сложилась: один узел повторяется — «Марат», имя, которое везде зачёркнуто. Катя протягивает распечатку: координаты серверной гильдии. «Теперь ты видишь. Не теряй.»',
    contextNote: 'Результат исследования — след Марата в прошивке.',
    accessibilityAnnounce: 'Исследование завершено. Распечатка со следом Марата.',
    speaker: 'Катя',
    sceneId: 'library_day',
    guidanceHint: 'Забери распечатку — исследование закрыто.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Забрать распечатку',
        next: 'library_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'library_katya_research_done', flagValue: true },
          { type: 'setFlag', flag: 'marat_trace_found', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'npcChange', npcId: 'kate', npcChange: { relation: 5 } },
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
