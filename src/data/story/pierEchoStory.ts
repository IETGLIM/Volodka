import type { StoryNode } from '@/shared/types/game';

/**
 * «Эхо пирса» — story nodes для квеста ep_pier_echo (pierEchoQuest.ts),
 * v4.25.0, этап 111.
 *
 * Создан отдельным файлом, чтобы не трогать существующие паки. Каждый id,
 * на который ссылается linkedStoryNodeId квеста, резолвится здесь; пак
 * сливается в buildStoryNodes() и регистрируется сателлитом 'pierEcho'
 * в narrativePackRegistry.ts (статика + ленивый загрузчик — урок v4.8.9).
 *
 * Тон — пост-советский киберпанк, речной нуар, тёплый. Русский язык.
 * Стихи священны (src/data/poems.ts) и здесь не пересочиняются.
 *
 * Рекуррентные образы пака: тихий маршрут парком, пузырёк воздуха в
 * стекле, три секунды задержки, рассвет над опорами.
 */
export const PIER_ECHO_STORY_NODES: Record<string, StoryNode> = {
  /* ═══════════════════════════════════════════════════════════════
     Старт — легенда Трофима
     ═══════════════════════════════════════════════════════════════ */
  ep_pier_echo_start: {
    id: 'ep_pier_echo_start',
    text: [
      'Трофим стучит костяшками по периле — три коротких, одна длинная — и ждёт. Через три секунды перила отвечают: тот же стук, только тише и чуть грустнее, будто кто-то далеко повторяет за ним, стесняясь.',
      '«Пирс №3. Тридцать лет сюда хожу — и двадцать из них слушаю. Он повторяет то, о чём молчат. Не что говорят — что МОЛЧАТ. Стоишь над водой, думаешь своё, а опоры через три секунды возвращают. Гильдия скажет — физика. Физика скажет — гильдия. А я скажу: иди и послушай сам. Только маршрут бери тихий — парком. Эхо стесняется трамвая.»',
    ].join('\n'),
    speaker: 'Трофим',
    sceneId: 'river_pier',
    contextNote: 'Трофим стучит по перилам пирса и слушает задержанное эхо.',
    accessibilityAnnounce: 'Трофим рассказывает легенду об эхе пирса №3.',
    guidanceHint: 'Выслушать легенду до конца.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'discoverLore', loreId: 'lore_trofim_watchman' }],
    choices: [
      {
        text: 'Иду. Тихий маршрут, парком — понял',
        next: 'ep_pier_echo_route',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'ep_pier_echo' },
          { type: 'setFlag', flag: 'ep_pier_echo_accepted', flagValue: true },
          { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Трофим, а зачем тебе это? Тридцать лет — слушать.',
        next: 'ep_pier_echo_why',
        effects: [
          { type: 'triggerQuest', questId: 'ep_pier_echo' },
          { type: 'setFlag', flag: 'ep_pier_echo_accepted', flagValue: true },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  ep_pier_echo_why: {
    id: 'ep_pier_echo_why',
    text: [
      '«Затем, что эхо — единственный свидетель, который не врёт. Завод помнил бумагу. Гильдия помнит выгоду. А пирс помнит ЧЕЛОВЕКА: как стояла тут женщина в девяносто третьем и молчала про то, кого ждёт. Как ты сейчас стоишь и молчишь про то, о чём думать боишься. Он вернёт — тише. Слушать эхо, Володька, — это уметь слышать себя в расстоянии. Иди. Парком.»',
    ].join('\n'),
    speaker: 'Трофим',
    sceneId: 'river_pier',
    contextNote: 'Трофим объясняет, почему тридцать лет слушает пирс.',
    accessibilityAnnounce: 'Трофим объясняет, зачем слушать эхо.',
    guidanceHint: 'Тихий маршрут — через парк к пирсу.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Значит, пойду слушать себя в расстоянии',
        next: 'ep_pier_echo_route',
        goldenPath: true,
        effects: [{ type: 'addKarma', value: 2 }],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     Тихий маршрут — парк → пирс
     ═══════════════════════════════════════════════════════════════ */
  ep_pier_echo_route: {
    id: 'ep_pier_echo_route',
    text: [
      'Парк до первого трамвая — отдельный мир. Фонари ещё горят с ночи, но уже не работают: просто светятся по инерции. Дорожка к пирсу пустая, ровно настолько, чтобы слышать шаги — свои и, с задержкой в три секунды, чужие.',
      'Ты идёшь и замечаешь: чем ближе пирс, тем тише становишься ты сам. Не потому что нельзя. Потому что хочется.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'park_day',
    contextNote: 'Тихий маршрут к пирсу: пустой парк, инерционный свет фонарей.',
    accessibilityAnnounce: 'Тихий маршрут через парк к пирсу.',
    guidanceHint: 'Дойди до причала и не потревожь утро.',
    guidanceObjectiveType: 'visit_location',
    effects: [{ type: 'addKarma', value: 1 }],
    choices: [
      {
        text: 'Спуститься к опорам и слушать',
        next: 'ep_pier_echo_listen',
        goldenPath: true,
        effects: [],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     Прослушивание — ключевой узел исследования
     ═══════════════════════════════════════════════════════════════ */
  ep_pier_echo_listen: {
    id: 'ep_pier_echo_listen',
    text: [
      'Рассвет приходит снизу — сначала в воду, потом в опоры. Ты стоишь над чёрной водой, и пирс начинает работать: он возвращает утро. Скрип. Чайку. Как где-то на том берегу кто-то закашлялся и не стал этого объяснять.',
      'А потом — твоё. Не слова: движение мысли, которую ты не успел подумать. Пирс делает это ровно, аккуратно — как музыкант, которому не важно, чья тема. Лента «Маяк-203» идёт катушками. Трофим был прав: одно такое утро стоит всего отчёта гильдии за год.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'river_pier',
    contextNote: 'Рассвет над опорами. Пирс возвращает твою непродуманную мысль.',
    accessibilityAnnounce: 'Эхо пирса записано на ленту.',
    guidanceHint: 'Лента с эхом записана. Ритка на пирсе — она слышит больше всех.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'ep_echo_listened', flagValue: true },
      { type: 'addItem', itemId: 'ep_tape_echo' },
      { type: 'discoverLore', loreId: 'lore_pier_echo' },
      { type: 'addSkill', skill: 'intuition', value: 1 },
    ],
    choices: [
      {
        text: 'Вернуть ленту Трофиму — это его река, его двадцать лет',
        next: 'ep_pier_echo_final_trofim',
        goldenPath: true,
        effects: [{ type: 'addKarma', value: 2 }],
      },
      {
        text: 'Оставить ленту себе — кое-что моё эхо вернуло лично мне',
        next: 'ep_pier_echo_final_keep',
        effects: [{ type: 'addSkill', skill: 'logic', value: 1 }],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     Развязки — два финала исследования
     ═══════════════════════════════════════════════════════════════ */
  ep_pier_echo_final_trofim: {
    id: 'ep_pier_echo_final_trofim',
    text: [
      'Трофим берёт ленту двумя руками, как берут не вещь, а разрешение. Слушает недолго. Молчит дольше.',
      '«Ну вот. Значит, ты теперь тоже знаешь, как это — быть возвращённым.» Он шарит в ящике сторожки и кладёт тебе в ладонь стеклянный шар с пузырьком воздуха ровно посередине. «С «Хром-М», побочная линия, семидесятые. Такой не тонет даже в шторм. Пустота в нём — сознательно оставленная. Дальше сам.»',
    ].join('\n'),
    speaker: 'Трофим',
    sceneId: 'river_pier',
    contextNote: 'Трофим принимает ленту и отдаёт стеклянный поплавок.',
    accessibilityAnnounce: 'Трофим подарил поплавок из речного стекла.',
    guidanceHint: 'Расскажи Ритке про четвёртый голос — она на пирсе.',
    guidanceObjectiveType: 'talk_to_npc',
    effects: [
      { type: 'addItem', itemId: 'ep_glass_float' },
      { type: 'discoverLore', loreId: 'lore_glass_floats' },
      { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 3 } },
    ],
    choices: [
      {
        text: 'Поблагодарить и отправиться к Ритке',
        next: null,
        effects: [],
      },
    ],
  },

  ep_pier_echo_final_keep: {
    id: 'ep_pier_echo_final_keep',
    text: [
      'Ты оставляешь ленту себе — Трофим только кивает, будто ожидал. Взамен достаёт из-под лежанки смятую открытку: деревянный пирс, штормовое небо, «Пирс №3, 1987». На обороте чужим почерком: «Здесь тихо, даже когда громко. Приезжай».',
      '«Отправителя так и не нашлось. Может, она твоя. Может, чья-то. Эхо, Володька, умеет и почту возвращать — просто на это ему надо больше трёх секунд.»',
    ].join('\n'),
    speaker: 'Трофим',
    sceneId: 'river_pier',
    contextNote: 'Трофим отдаёт неотправленную открытку с пирса 1987 года.',
    accessibilityAnnounce: 'Получена открытка «Пирс №3, 1987».',
    guidanceHint: 'Расскажи Ритке про четвёртый голос — она на пирсе.',
    guidanceObjectiveType: 'talk_to_npc',
    effects: [
      { type: 'addItem', itemId: 'ep_pier_postcard' },
      { type: 'discoverLore', loreId: 'lore_pier_nineteenth' },
      { type: 'addKarma', value: 1 },
    ],
    choices: [
      {
        text: 'Спрятать открытку и отправиться к Ритке',
        next: null,
        effects: [],
      },
    ],
  },
};
