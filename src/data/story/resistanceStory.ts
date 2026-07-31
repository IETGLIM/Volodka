import type { StoryNode } from '@/shared/types/game';

/** Сопротивление Act 6: Максим, Аня, бункер. */
export const STORY_NODES_RESISTANCE: Record<string, StoryNode> = {
  resistance_story_intro: {
    id: 'resistance_story_intro',
    text: 'Люк в канализационном колодце открывается изнутри. Максим протягивает руку: «Добро пожаловать в то, что осталось от честных. Здесь нет камер — мы их слепили сами. Аня настроила сеть. Ждём тебя.»',
    contextNote: 'Вход в бункер Сопротивления через люк.',
    accessibilityAnnounce: 'Подземный бункер. Зелёный аварийный свет, гул вентиляторов.',
    proceduralAmbientOverride: 'basement',
    speaker: 'Максим',
    sceneId: 'underground_bunker',
    condition: { flag: 'zeka_trusted' },
    choices: [
      {
        text: 'Спуститься',
        next: 'resistance_bunker_hub',
        effects: [{ type: 'setFlag', flag: 'resistance_bunker_found', flagValue: true }],
      },
      { text: 'Не сейчас', next: 'street_bench_view' },
    ],
  },

  resistance_bunker_hub: {
    id: 'resistance_bunker_hub',
    text: 'Бункер — столы с терминалами, карта города с нитками связей, запах пайки и кофе из сухого пайка. Максим показывает угол: «Здесь будешь спать, если придётся. Аня — связь. Я — планы. Ты — слова, которые они боятся.»',
    contextNote: 'Бункер Сопротивления. Карта, терминалы, зелёный свет.',
    proceduralAmbientOverride: 'basement',
    speaker: 'Максим',
    sceneId: 'underground_bunker',
    guidanceHint: 'Обустрой бункер или спаси перебежчика.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Помочь обустроить убежище',
        next: 'resistance_safehouse_start',
        condition: { missingFlag: 'resistance_safehouse_active' },
        effects: [{ type: 'triggerQuest', questId: 'resistance_safehouse' }],
      },
      {
        text: 'Продолжить обустройство — фильтры',
        next: 'resistance_safehouse_filters',
        condition: {
          flag: 'resistance_safehouse_active',
          missingFlag: 'resistance_safehouse_filters',
        },
      },
      {
        text: '433 и стихи — дожать дом',
        next: 'resistance_safehouse_radio',
        condition: {
          flag: 'resistance_safehouse_filters',
          missingFlag: 'resistance_safehouse_done',
        },
      },
      {
        text: 'Спросить про перебежчика',
        next: 'resistance_defector_brief',
        condition: {
          flag: 'traitor_discovered',
          missingFlag: 'resistance_defector_rescue_active',
        },
      },
      {
        text: 'Продолжить рейд — тоннель',
        next: 'resistance_defector_rescue_start',
        condition: {
          flag: 'resistance_defector_rescue_active',
          missingFlag: 'resistance_defector_tunnel',
        },
      },
      {
        text: 'Стих и увод — Олег ещё снаружи',
        next: 'resistance_defector_poem_stun',
        condition: {
          flag: 'resistance_defector_tunnel',
          missingFlag: 'resistance_defector_rescue_done',
        },
      },
      {
        text: 'Ночной рейд — коллектор под КПП',
        next: 'quest_act6_defector_rescue_expanded_start',
        condition: {
          flag: 'resistance_defector_rescue_done',
          missingFlag: 'quest_act6_defector_rescue_expanded_active',
        },
        effects: [{ type: 'triggerQuest', questId: 'quest_act6_defector_rescue_expanded' }],
      },
      {
        text: 'Коллектор — камеры слепы, люк впереди',
        next: 'quest_act6_defector_infiltrate',
        condition: {
          flag: 'quest_act6_defector_rescue_expanded_active',
          missingFlag: 'defector_infiltrate_done',
        },
      },
      {
        text: 'Камера удержания — вытащить Олега',
        next: 'quest_act6_defector_free_cell',
        condition: {
          flag: 'defector_infiltrate_done',
          missingFlag: 'defector_freed_from_cell',
        },
      },
      {
        text: 'Сток к бункеру — патруль близко',
        next: 'quest_act6_defector_escape_sewers',
        condition: {
          flag: 'defector_freed_from_cell',
          missingFlag: 'quest_act6_defector_rescue_expanded_done',
        },
      },
      {
        text: 'Собрать фронт — Максим у карты',
        next: 'act6_resistance_formed',
        condition: {
          flag: 'traitor_fate_decided',
          missingFlag: 'resistance_joined',
        },
      },
      {
        text: 'Брифинг — Аня и план связи',
        next: 'act6_resistance_briefing',
        condition: {
          flag: 'resistance_joined',
          missingFlag: 'three_defectors_recruited',
        },
      },
      {
        text: 'План похищения данных — кафе',
        next: 'act6_data_heist_planning',
        condition: {
          flag: 'three_defectors_recruited',
          missingFlag: 'act6_heist_planned',
        },
      },
      {
        text: 'Шифр-стих — ключ в leaking-потоке',
        next: 'quest_act5_bunker_code_poem_break_start',
        condition: {
          requiredAct: 5,
          missingFlag: 'quest_act5_bunker_code_poem_break_active',
        },
        effects: [{ type: 'triggerQuest', questId: 'quest_act5_bunker_code_poem_break' }],
      },
      {
        text: 'Ключ найден — пробить шифр «Солныш»',
        next: 'quest_act5_bunker_code_break',
        condition: {
          flag: 'bunker_poem_key_found',
          missingFlag: 'quest_act5_bunker_code_poem_break_done',
        },
      },
      { text: 'Вернуться на улицу', next: 'bunker_explore_mode' },
    ],
  },

  // ─── Обустроить убежище: список → фильтры → 433 → стихи-сетка → дом ───
  resistance_safehouse_start: {
    id: 'resistance_safehouse_start',
    text: 'Аня кидает список: матрасы, фильтры для воздуха, радиомолчание на частоте 433. «Гильдия сканирует стандартные диапазоны. Нам нужен угол, где серверы не слышат. Ты умеешь прятать смысл в шуме — помоги спрятать нас.»',
    speaker: 'Аня',
    sceneId: 'underground_bunker',
    accessibilityAnnounce: 'Аня даёт список для обустройства бункера.',
    guidanceHint: 'Прими список — матрасы, фильтры, частота 433.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'anya',
    choices: [
      {
        text: 'Взять список и начать с фильтров',
        next: 'resistance_safehouse_filters',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'resistance_safehouse_active', flagValue: true },
          { type: 'addStat', stat: 'energy', value: -4 },
        ],
      },
      { text: 'Позже — руки ещё дрожат', next: 'resistance_bunker_hub' },
    ],
  },

  resistance_safehouse_filters: {
    id: 'resistance_safehouse_filters',
    text: 'Фильтры из заводского запаса Зины — ржавые, но честные. Ты вкручиваешь их в вентиляцию: воздух становится суше, запах пайки слабеет. Аня кивает: «Дышать можно. Дальше — частота.»',
    speaker: 'Аня',
    sceneId: 'underground_bunker',
    contextNote: 'Воздушные фильтры установлены.',
    accessibilityAnnounce: 'Фильтры воздуха установлены в бункере.',
    guidanceHint: 'Настрой радиомолчание на 433 МГц.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'anya',
    choices: [
      {
        text: 'Крутить ручку на 433',
        next: 'resistance_safehouse_radio',
        effects: [{ type: 'setFlag', flag: 'resistance_safehouse_filters', flagValue: true }],
      },
      { text: 'Отойти — вентиляция уже дышит', next: 'resistance_bunker_hub' },
    ],
  },

  resistance_safehouse_radio: {
    id: 'resistance_safehouse_radio',
    text: 'Частота 433 — узкая щель между гильдейскими сканами. Приёмник шипит, потом затихает. Максим улыбается краем рта: «Теперь нас не слышат. Осталось спрятать смысл.»',
    speaker: 'Максим',
    sceneId: 'underground_bunker',
    contextNote: 'Радиомолчание на 433 МГц настроено.',
    accessibilityAnnounce: 'Частота четыреста тридцать три настроена.',
    guidanceHint: 'Развесь стихи как маскировочную сетку для сигналов.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'maxim',
    choices: [
      {
        text: 'Развесить стихи на стене',
        next: 'resistance_safehouse_poem_mesh',
        effects: [{ type: 'setFlag', flag: 'resistance_safehouse_radio', flagValue: true }],
      },
      { text: 'Отойти — 433 уже молчит', next: 'resistance_bunker_hub' },
    ],
  },

  resistance_safehouse_poem_mesh: {
    id: 'resistance_safehouse_poem_mesh',
    text: 'Строки на стене — не декор. Каждый лист ломает паттерн сканера: шум, похожий на поэзию. Аня проверяет спектр: «Красиво. И слепо для них.»',
    speaker: 'Аня',
    sceneId: 'underground_bunker',
    contextNote: 'Стихи работают как маскировочная сетка сигналов.',
    accessibilityAnnounce: 'Стихи развешаны. Сигналы замаскированы.',
    guidanceHint: 'Разложи матрасы — убежище должно быть домом.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Разложить матрасы в углу',
        next: 'resistance_safehouse_beds',
        effects: [{ type: 'setFlag', flag: 'resistance_safehouse_poem_mesh', flagValue: true }],
      },
      { text: 'Отойти — стихи уже на стене', next: 'resistance_bunker_hub' },
    ],
  },

  resistance_safehouse_beds: {
    id: 'resistance_safehouse_beds',
    text: 'Угол с матрасами — первый настоящий сон под землёй. Генераторы тише. На стене — стихи. Максим смотрит на карту города: «Завтра — планы. Сегодня — дом.»',
    speaker: 'Максим',
    sceneId: 'underground_bunker',
    contextNote: 'Спальные места обустроены.',
    accessibilityAnnounce: 'Матрасы разложены. Бункер почти готов.',
    guidanceHint: 'Прими благодарность — убежище готово.',
    guidanceObjectiveType: 'complete_quest',
    guidanceNpcId: 'maxim',
    choices: [
      {
        text: 'Кивнуть — это дом',
        next: 'resistance_safehouse_done',
        effects: [{ type: 'setFlag', flag: 'resistance_safehouse_beds', flagValue: true }],
      },
      { text: 'Отойти — угол уже готов', next: 'resistance_bunker_hub' },
    ],
  },

  resistance_safehouse_done: {
    id: 'resistance_safehouse_done',
    text: 'К утру бункер не узнать: чистый воздух, тихие генераторы, на стене — стихи как маскировочная сетка для сигналов. Максим сжимает плечо: «Теперь это не дыра — это дом. Спасибо.»',
    speaker: 'Максим',
    sceneId: 'underground_bunker',
    accessibilityAnnounce: 'Убежище обустроено. Бункер стал домом.',
    guidanceHint: 'Отдохни — квест закрыт.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Отдохнуть и выйти',
        next: 'resistance_bunker_hub',
        effects: [
          { type: 'setFlag', flag: 'resistance_safehouse_done', flagValue: true },
          { type: 'addKarma', value: 4 },
          { type: 'addStat', stat: 'energy', value: -8 },
        ],
      },
    ],
  },

  resistance_defector_brief: {
    id: 'resistance_defector_brief',
    text: 'Максим разворачивает схему: «Перебежчик из гильдии — инженер серверной. Знает расписание дронов. Его поймали на границе квартала. Через два часа стирание. Нужно вытащить до того, как сотрут не только его — и всё, что он помнит.»',
    speaker: 'Максим',
    sceneId: 'underground_bunker',
    guidanceHint: 'Прими операцию — через два часа стирание.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'maxim',
    choices: [
      {
        text: 'Принять операцию',
        next: 'resistance_defector_rescue_start',
        effects: [{ type: 'triggerQuest', questId: 'resistance_defector_rescue' }],
      },
      { text: 'Отказаться — слишком рискованно', next: 'resistance_bunker_hub' },
    ],
  },

  // ─── Спасти перебежчика: брифинг → тоннель → стих → увод → Олег ───
  resistance_defector_rescue_start: {
    id: 'resistance_defector_rescue_start',
    text: 'Аня проверяет наушник: «GPS молчит — только мой голос. Тоннель под кварталом выведет к офисному входу. Дроны на крыше. Не смотри вверх — слушай меня.»',
    contextNote: 'Брифинг перед спасением перебежчика.',
    accessibilityAnnounce: 'Аня ведёт по тоннелю. Операция началась.',
    speaker: 'Аня',
    sceneId: 'underground_bunker',
    guidanceHint: 'Спустись в тоннель — Аня ведёт к засаде.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'anya',
    choices: [
      {
        text: 'Спуститься в тоннель',
        next: 'resistance_defector_tunnel',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'resistance_defector_rescue_active', flagValue: true },
          { type: 'transitionScene', sceneId: 'street_night' },
        ],
      },
    ],
  },

  resistance_defector_tunnel: {
    id: 'resistance_defector_tunnel',
    text: 'Подземный ход пахнет бетоном и страхом. Аня шепчет координаты. Наверху — засада у офисного входа: перебежчик связан, глаза пустые от нейромоста.',
    contextNote: 'Тоннель под кварталом. Засада на поверхности.',
    accessibilityAnnounce: 'Тоннель пройден. Впереди засада гильдии.',
    speaker: 'narrator',
    sceneId: 'street_night',
    guidanceHint: 'Прочти стих вслух — дроны должны замереть.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Выйти к засаде',
        next: 'resistance_defector_poem_stun',
        effects: [{ type: 'setFlag', flag: 'resistance_defector_tunnel', flagValue: true }],
      },
    ],
  },

  resistance_defector_poem_stun: {
    id: 'resistance_defector_poem_stun',
    text: 'Ты читаешь стих — громко, как заклинание. Дроны замирают на секунду. Этого хватает: Аня рвёт нейроспуты, ты подхватываешь инженера под мышки.',
    contextNote: 'Стих оглушил дроны. Перебежчик свободен от пут.',
    accessibilityAnnounce: 'Дроны замерли. Перебежчик подхвачен.',
    speaker: 'narrator',
    sceneId: 'street_night',
    guidanceHint: 'Уведи его в бункер, пока патруль не очнулся.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Бежать в тоннель с ним',
        next: 'resistance_defector_extract',
        goldenPath: true,
        effects: [{ type: 'setFlag', flag: 'resistance_defector_poem_stun', flagValue: true }],
      },
    ],
  },

  resistance_defector_extract: {
    id: 'resistance_defector_extract',
    text: 'Обратный путь — тяжелее. Инженер бормочет серверные адреса сквозь сон. Аня: «Люк открыт. Максим ждёт.» Дроны снова жужжат где-то над асфальтом — слишком поздно.',
    contextNote: 'Эвакуация через тоннель к бункеру.',
    accessibilityAnnounce: 'Эвакуация через тоннель. Бункер близко.',
    speaker: 'Аня',
    sceneId: 'street_night',
    guidanceHint: 'Поднимись в бункер — Максим примет перебежчика.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'maxim',
    choices: [
      {
        text: 'Подняться в бункер',
        next: 'resistance_defector_rescued',
        effects: [
          { type: 'setFlag', flag: 'resistance_defector_extract', flagValue: true },
          { type: 'transitionScene', sceneId: 'underground_bunker' },
        ],
      },
    ],
  },

  resistance_defector_rescued: {
    id: 'resistance_defector_rescued',
    text: 'В бункере перебежчик приходит в себя. «Меня звали Олег,» — хрипит он. «Теперь — не знаю. Но серверную я помню наизусть.» Максим кивает тебе: «Ты вернул человека. Не данные — человека.»',
    speaker: 'Перебежчик',
    sceneId: 'underground_bunker',
    accessibilityAnnounce: 'Перебежчик спасён. Его зовут Олег.',
    guidanceHint: 'Прими благодарность — операция закрыта.',
    guidanceObjectiveType: 'complete_quest',
    guidanceNpcId: 'maxim',
    choices: [
      {
        text: 'Принять благодарность',
        next: 'resistance_bunker_hub',
        effects: [
          { type: 'setFlag', flag: 'resistance_defector_rescue_done', flagValue: true },
          { type: 'setFlag', flag: 'guild_defector_saved', flagValue: true },
          { type: 'addKarma', value: 8 },
        ],
      },
    ],
  },
};
