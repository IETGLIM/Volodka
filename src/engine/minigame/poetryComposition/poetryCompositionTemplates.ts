export type WordOption = { word: string; quality: number };
export type BlankDef = { correctCategory: string; options: WordOption[] };
export type PoemLine = { text: string; blanks: BlankDef[] };
export type PoemTemplate = { id: string; title: string; theme: string; lines: PoemLine[] };

export const POETRY_COMPOSITION_TEMPLATES: PoemTemplate[] = [
  {
    id: 'city_lights',
    title: 'Городские огни',
    theme: 'город',
    lines: [
      {
        text: 'И в ___ ночи горит ___ свет',
        blanks: [
          {
            correctCategory: 'adjective_dark',
            options: [
              { word: 'холодной', quality: 1 },
              { word: 'бессонной', quality: 2 },
              { word: 'неоновой', quality: 3 },
            ],
          },
          {
            correctCategory: 'noun_light',
            options: [
              { word: 'тусклый', quality: 1 },
              { word: 'мерцающий', quality: 2 },
              { word: 'пульсирующий', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'Провода ___ как вены города',
        blanks: [
          {
            correctCategory: 'verb_pulsing',
            options: [
              { word: 'гудят', quality: 1 },
              { word: 'дрожат', quality: 2 },
              { word: 'пульсируют', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'А я иду сквозь ___ туман',
        blanks: [
          {
            correctCategory: 'adjective_urban',
            options: [
              { word: 'серый', quality: 1 },
              { word: 'цифровой', quality: 2 },
              { word: 'электрический', quality: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'lonely_coder',
    title: 'Одинокий кодер',
    theme: 'одиночество',
    lines: [
      {
        text: 'Монитор — мой ___ спутник',
        blanks: [
          {
            correctCategory: 'adjective_companion',
            options: [
              { word: 'верный', quality: 1 },
              { word: 'молчаливый', quality: 2 },
              { word: 'единственный', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'Строки кода — как ___ мысли',
        blanks: [
          {
            correctCategory: 'adjective_thoughts',
            options: [
              { word: 'чужие', quality: 1 },
              { word: 'потерянные', quality: 2 },
              { word: 'ошмётки', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'А в ___ комнате лишь шум кулера',
        blanks: [
          {
            correctCategory: 'adjective_room',
            options: [
              { word: 'пустой', quality: 1 },
              { word: 'тёмной', quality: 2 },
              { word: 'безжизненной', quality: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'between_lines',
    title: 'Между строк',
    theme: 'надежда',
    lines: [
      {
        text: 'Между строк ___ текста',
        blanks: [
          {
            correctCategory: 'adjective_text',
            options: [
              { word: 'чужого', quality: 1 },
              { word: 'исходного', quality: 2 },
              { word: 'машинного', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'Я нахожу ___ смысл',
        blanks: [
          {
            correctCategory: 'adjective_meaning',
            options: [
              { word: 'новый', quality: 1 },
              { word: 'скрытый', quality: 2 },
              { word: 'запретный', quality: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'electric_verse',
    title: 'Электрический стих',
    theme: 'поэзия',
    lines: [
      {
        text: '___ ток бежит по проводам',
        blanks: [
          {
            correctCategory: 'adjective_current',
            options: [
              { word: 'Быстрый', quality: 1 },
              { word: 'Скрытый', quality: 2 },
              { word: 'Поэтический', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'И каждый бит — ___ слово',
        blanks: [
          {
            correctCategory: 'adjective_word',
            options: [
              { word: 'новое', quality: 1 },
              { word: 'живое', quality: 2 },
              { word: 'незаменимое', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'В ___ сети рождаются стихи',
        blanks: [
          {
            correctCategory: 'adjective_network',
            options: [
              { word: 'глобальной', quality: 1 },
              { word: 'нейронной', quality: 2 },
              { word: 'бесконечной', quality: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'light_in_wires',
    title: 'Свет в проводах',
    theme: 'свет',
    lines: [
      {
        text: 'В ___ проводах горит надежда',
        blanks: [
          {
            correctCategory: 'adjective_wires',
            options: [
              { word: 'старых', quality: 1 },
              { word: 'оптоволоконных', quality: 2 },
              { word: 'оборванных', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'Как ___ искра среди тьмы',
        blanks: [
          {
            correctCategory: 'noun_spark',
            options: [
              { word: 'маленькая', quality: 1 },
              { word: 'последняя', quality: 2 },
              { word: 'незримая', quality: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'digital_soul',
    title: 'Цифровая душа',
    theme: 'душа',
    lines: [
      {
        text: 'Моя душа — ___ файл',
        blanks: [
          {
            correctCategory: 'adjective_file',
            options: [
              { word: 'скрытый', quality: 1 },
              { word: 'зашифрованный', quality: 2 },
              { word: 'повреждённый', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'В ___ папке мироздания',
        blanks: [
          {
            correctCategory: 'adjective_folder',
            options: [
              { word: 'большой', quality: 1 },
              { word: 'корневой', quality: 2 },
              { word: 'заброшенной', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'Ищу ___ среди нулей',
        blanks: [
          {
            correctCategory: 'noun_meaning',
            options: [
              { word: 'смысл', quality: 1 },
              { word: 'ответ', quality: 2 },
              { word: 'себя', quality: 3 },
            ],
          },
        ],
      },
    ],
  },
];
