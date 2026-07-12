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
        effects: [{ type: 'triggerQuest', questId: 'resistance_safehouse' }],
      },
      {
        text: 'Спросить про перебежчика',
        next: 'resistance_defector_brief',
        condition: { flag: 'traitor_discovered' },
      },
      { text: 'Вернуться на улицу', next: 'bunker_explore_mode' },
    ],
  },

  resistance_safehouse_start: {
    id: 'resistance_safehouse_start',
    text: 'Аня кидает список: матрасы, фильтры для воздуха, радиомолчание на частоте 433. «Гильдия сканирует стандартные диапазоны. Нам нужен угол, где серверы не слышат. Ты умеешь прятать смысл в шуме — помоги спрятать нас.»',
    speaker: 'Аня',
    sceneId: 'underground_bunker',
    choices: [
      {
        text: 'Работать всю ночь',
        next: 'resistance_safehouse_done',
        effects: [{ type: 'addStat', stat: 'energy', value: -12 }],
      },
    ],
  },

  resistance_safehouse_done: {
    id: 'resistance_safehouse_done',
    text: 'К утру бункер не узнать: чистый воздух, тихие генераторы, на стене — стихи как маскировочная сетка для сигналов. Максим сжимает плечо: «Теперь это не дыра — это дом. Спасибо.»',
    speaker: 'Максим',
    sceneId: 'underground_bunker',
    choices: [
      {
        text: 'Отдохнуть и выйти',
        next: 'resistance_bunker_hub',
        effects: [
          { type: 'setFlag', flag: 'resistance_safehouse_done', flagValue: true },
          { type: 'addKarma', value: 4 },
        ],
      },
    ],
  },

  resistance_defector_brief: {
    id: 'resistance_defector_brief',
    text: 'Максим разворачивает схему: «Перебежчик из гильдии — инженер серверной. Знает расписание дронов. Его поймали на границе квартала. Через два часа стирание. Нужно вытащить до того, как сотрут не только его — и всё, что он помнит.»',
    speaker: 'Максим',
    sceneId: 'underground_bunker',
    choices: [
      {
        text: 'Принять операцию',
        next: 'resistance_defector_rescue_start',
        effects: [{ type: 'triggerQuest', questId: 'resistance_defector_rescue' }],
      },
      { text: 'Отказаться — слишком рискованно', next: 'resistance_bunker_hub' },
    ],
  },

  resistance_defector_rescue_start: {
    id: 'resistance_defector_rescue_start',
    text: 'Аня ведёт машину по подземным тоннелям — GPS молчит, только её голос в наушнике. На поверхности — засада гильдии у офисного входа. Перебежчик связан, глаза пустые от нейромоста. Ты читаешь стих — громко, как заклинание. Дроны замирают на секунду. Этого хватает.',
    contextNote: 'Спасение перебежчика у офиса гильдии.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Увести его в бункер',
        next: 'resistance_defector_rescued',
        goldenPath: true,
      },
    ],
  },

  resistance_defector_rescued: {
    id: 'resistance_defector_rescued',
    text: 'В бункере перебежчик приходит в себя. «Меня звали Олег,» — хрипит он. «Теперь — не знаю. Но серверную я помню наизусть.» Максим кивает тебе: «Ты вернул человека. Не данные — человека.»',
    speaker: 'Перебежчик',
    sceneId: 'underground_bunker',
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
