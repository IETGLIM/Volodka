import type { StoryNode } from '@/shared/types/game';

/**
 * Act 2 — Expanded exploration / ambient story nodes.
 *
 * Volodka leaves his room at night, enters the city, discovers the Network (Сеть).
 * Key locations: cafe (Albert, barista), neon-lit streets, office corridors,
 * the pier with Trofim, ЧК (underground commune), Victoria (Мария — Network contact).
 *
 * These 20 nodes fill the ambient space between golden-path beats — the city
 * breathes, the code whispers, and every corner hides a fragment of a poem.
 *
 * IDs prefixed `act2_exp_`. All text in literary Russian, cyberpunk-noir, melancholic.
 * Exported as ACT2_STORY_EXPANDED_NODES for merge into the master story-node registry.
 */
export const ACT2_STORY_EXPANDED_NODES: Record<string, StoryNode> = {

  /* ══════════════════════════════════════════════════════════════════════════
     1.  CAFE JUKEBOX — a broken jukebox plays a fragment of a poem,
         the display flickers with embedded code
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_cafe_jukebox": {
    id: "act2_exp_cafe_jukebox",
    speaker: "narrator",
    sceneId: "cafe_evening",
    contextNote: "Сломанный музыкальный автомат у стены кафе. Экран мерцает зелёным.",
    accessibilityAnnounce: "Кафе: сломанный музыкальный автомат. На экране — строки кода.",
    ambientSound: "sounds/ambient/cafe_jazz_quiet.ogg",
    text: [
      'Музыкальный автомат стоит у стены, как забытый сервер — корпус помят, кнопки залипы кофе, а дисплей вместо обложек альбомов показывает что-то другое. Зелёные символы ползут по чёрному экрану, и Володька сначала думает — баг. Потом видит ритм.',
      '',
      'Строки складываются не в код, а в стихотворение. Фрагмент — четыре строчки, обрубленные на полуслове, — но ритм безошибочный, как пульс. Автомат хрипит, выплёвывает застрявший диск, и в хрипе слышится продолжение: те же строки, только sung, не spoken.',
      '',
      'Кто-то спрятал стихи в прошивке автомата. Кто-то — или что-то. Володька касается экрана, и строки сбиваются, как будто от смущения. Потом выстраиваются снова. Ждут.',
    ].join('\n'),
    guidanceObjectiveType: "collect_item",
    choices: [
      {
        text: "Пойти за бариста — кто настроил этот автомат?",
        next: "act2_exp_cafe_kitchen_back",
        goldenPath: true,
        effects: [
          { type: "addSkill", skill: "intuition", value: 1 },
          { type: "setFlag", flag: "jukebox_poem_seen", flagValue: true },
          { type: "discoverLore", loreId: "lore_poem_in_code" },
        ],
      },
      {
        text: "Разобрать код на дисплее — технический взгляд",
        next: "act2_exp_albert_code_philosophy",
        effects: [
          { type: "addSkill", skill: "coding", value: 1 },
          { type: "addStat", stat: "stress", value: -2 },
          { type: "setFlag", flag: "jukebox_code_parsed", flagValue: true },
        ],
      },
      {
        text: "Выйти на улицу — слишком много вопросов в одном кафе",
        next: "act2_exp_cafe_window_reflection",
        effects: [
          { type: "addStat", stat: "stress", value: 2 },
          { type: "addXp", value: 5 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     2.  STREET NEON SIGNS — graffiti on neon-lit walls that responds to Volodka
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_street_neon_signs": {
    id: "act2_exp_street_neon_signs",
    speaker: "narrator",
    sceneId: "street_night",
    contextNote: "Неоновые вывески на стене дома. Граффити мерцает в свете витрин.",
    accessibilityAnnounce: "Улица: неоновые вывески, на стене — граффити со стихами.",
    ambientSound: "sounds/ambient/street_night_rain.ogg",
    text: [
      'Неон пишет слова на мокром кирпиче — ПРОДУКТЫ, АПТЕКА, СЕРВИС — но между вывесками, в тени, где свет не добивает, кто-то намалевал другое. Краска дешёвая, уже подтекает, но строки стоят, как стропы на крыше: короткие, хлёсткие, точные.',
      '',
      'Володька проходит мимо — и строка меняется. Не физически, не на стене, а в голове: он читает «и свет не добивает», а понимает «и слово не добивает, но стоит». Граффити подмигивает. Или это неон мигает. Или это город начинает говорить.',
      '',
      'Улица всегда была текстом — вывески, адреса, маршруты. Но теперь Володька читает её иначе. Каждый дом — строчка. Каждый перекрёсток — перенос. Город — стихотворение, которое пишут сами стены.',
    ].join('\n'),
    guidanceObjectiveType: "visit_location",
    choices: [
      {
        text: "Пройти дальше — пусть дождь допишет эти строки",
        next: "act2_exp_street_rain",
        goldenPath: true,
        effects: [
          { type: "addSkill", skill: "rhythm", value: 1 },
          { type: "addKarma", value: 1 },
          { type: "setFlag", flag: "street_graffiti_read", flagValue: true },
        ],
      },
      {
        text: "Сфотографировать граффити — сохранить фрагмент",
        next: "act2_exp_street_vendor",
        effects: [
          { type: "addSkill", skill: "writing", value: 1 },
          { type: "collectPoem", poemId: "poem_street_fragment" },
          { type: "showThought", thought: "Фрагмент — не целое. Но иногда фрагмент точнее целого." },
        ],
      },
      {
        text: "Пойти к коту в переулке — что-то мелькнуло зелёным",
        next: "act2_exp_street_cat",
        effects: [
          { type: "addSkill", skill: "intuition", value: 1 },
          { type: "addXp", value: 5 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     3.  PIER DAWN — before dawn, Trofim speaks about the river's memory
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_pier_dawn": {
    id: "act2_exp_pier_dawn",
    speaker: "fisherman_trofim",
    sceneId: "river_pier",
    contextNote: "Пирс перед рассветом. Трофим сидит на ящике, река серая и тихая.",
    accessibilityAnnounce: "Пирс: перед рассветом. Трофим — сторож — говорит о памяти реки.",
    ambientSound: "sounds/ambient/pier_water.ogg",
    text: [
      'Река перед рассветом — серая, как старый терминал без питания. Трофим сидит на перевернутом ящике, спина к воде, лицо к Володьке. В руке — кружка с чем-то горячим и, судя по запаху, не только чайным.',
      '',
      '«Река помнит», — говорит он, не оборачиваясь. «Не так, как мы — кто помнит и забывает. Река помнит всё. Каждый завод, каждую трубу, каждую сточную шахту. И каждый стих, который кто-нибудь прочитал на этом пирсе.» Он кивает на воду. «Заводы слили в неё тяжёлые слова. А люди — легкие. Река держит оба.»',
      '',
      'Володька смотрит на воду. Она не движется — или движется так медленно, что кажется стоячей. Но под поверхностью, Трофим уверяет, течёт память. Вода — архив. Пирс — терминал доступа.',
    ].join('\n'),
    guidanceObjectiveType: "talk_to_npc",
    guidanceNpcId: "fisherman_trofim",
    choices: [
      {
        text: "Спросить про завод под пирсом — что внизу?",
        next: "act2_exp_pier_fishing_night",
        goldenPath: true,
        effects: [
          { type: "addSkill", skill: "logic", value: 1 },
          { type: "npcChange", npcId: "fisherman_trofim", npcChange: { relation: 3 } },
          { type: "setFlag", flag: "trofim_river_memory", flagValue: true },
        ],
      },
      {
        text: "Слушать рассвет — пусть река говорит сама",
        next: "act2_exp_pier_sunrise_poem",
        effects: [
          { type: "addSkill", skill: "rhythm", value: 1 },
          { type: "addStat", stat: "stress", value: -3 },
          { type: "showThought", thought: "Река не молчит. Она говорит на частоте, которую нужно просто настроиться слышать." },
        ],
      },
      {
        text: "Вернуться к городу — рассвет подождёт",
        next: "pier_explore_mode",
        effects: [
          { type: "addXp", value: 5 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     4.  CHK CAMPFIRE — Based tells stories about the Guild's old poets
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_chk_campfire": {
    id: "act2_exp_chk_campfire",
    speaker: "chk_based",
    sceneId: "chk_campfire_night",
    contextNote: "Костёр в ЧК. Бэйсид рассказывает, искры поднимаются к деревьям.",
    accessibilityAnnounce: "ЧК: костёр. Бэйсид рассказывает о старых поэтах Гильдии.",
    ambientSound: "sounds/ambient/chk_campfire.ogg",
    text: [
      'Костёр в ЧК — не для тепла. Для слов. Искры летят вверх, как строчки, которые не удержались на странице. Бэйсид сидит ближе к огню, лицо оранжевое и чёрное — полтора лица, как у каждого, кто живёт между светом и тенью.',
      '',
      '«Гильдия не всегда давила стихи», — говорит он, помешивая угли. «Было время — они их писали. Свои. На зарплату. По заказу.» Он сплёвывает. «Поэты на окладе — как серверы на гарантии: работают, пока не сгорят. А когда сгорели — Гильдия не чинила. Заменяла. Новые поэты, новые строки, новая прошивка.»',
      '',
      '«Некоторые из старых — не сгорели. Ушли. Вниз. К нам.» Он кивает на подземные стены. «И они принесли с собой то, что Гильдия считала багом — живое слово. Не прошивка. Не патч. Не обновление. — Слово.»',
    ].join('\n'),
    guidanceObjectiveType: "talk_to_npc",
    guidanceNpcId: "chk_based",
    choices: [
      {
        text: "Спросить про архив в подвале — где старые записи?",
        next: "act2_exp_chk_basement_archive",
        goldenPath: true,
        effects: [
          { type: "addSkill", skill: "logic", value: 1 },
          { type: "npcChange", npcId: "chk_based", npcChange: { relation: 2 } },
          { type: "setFlag", flag: "chk_based_old_poets", flagValue: true },
        ],
      },
      {
        text: "Слушать Элис — она перебирает струны у костра",
        next: "act2_exp_chk_elis_song",
        effects: [
          { type: "addSkill", skill: "rhythm", value: 1 },
          { type: "addStat", stat: "stress", value: -2 },
        ],
      },
      {
        text: "Вступить в Сеть — я хочу быть частью этого",
        next: "act2_network_oath",
        condition: { flag: "chk_based_old_poets" },
        effects: [
          { type: "addKarma", value: 3 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     5.  OFFICE SERVER ROOM — sneaking in, Volodka finds poems in code comments
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_office_server_room": {
    id: "act2_exp_office_server_room",
    speaker: "volodka",
    sceneId: "office_day",
    contextNote: "Серверная комната в офисе. Синие светодиоды, гул вентиляторов, жара.",
    accessibilityAnnounce: "Офис: серверная. Гул машин, синие диоды. Володька нашёл стихи в комментариях.",
    ambientSound: "sounds/ambient/server_room.ogg",
    text: [
      'Серверная — единственное место в офисе, где Володька чувствует себя дома. Гул вентиляторов — пятьдесят герц, как в хрущёвке детства. Синие диоды пульсируют, как строчки в мониторе, который никто не выключает. Жара — сухая, серверная, не живая.',
      '',
      'Он садится за терминал мониторинга — не свой, не законный, но тот, на котором дежурный забыл закрыть сеанс. Логи. Журналы ошибок. Стандартный вывод. И между строк — комментарии. Не технические. Не // TODO: fix memory leak. А — стихи. Четыре строчки в логе segfault. Три — в dropped connection. Целая строфа — в kernel panic.',
      '',
      'Кто-то пишет стихи в ошибках сервера. Не в коде — в крушениях кода. Каждый баг — страница. Каждый крах — глава. Володька читает, и серверная перестает быть机房. Она становится библиотекой.',
    ].join('\n'),
    guidanceObjectiveType: "collect_item",
    choices: [
      {
        text: "Разобрать терминал — есть ли ещё стихи в старых логах?",
        next: "act2_exp_office_old_terminal",
        goldenPath: true,
        effects: [
          { type: "addSkill", skill: "coding", value: 1 },
          { type: "collectPoem", poemId: "poem_server_comment" },
          { type: "setFlag", flag: "office_poem_in_errors", flagValue: true },
        ],
      },
      {
        text: "Пойти к Дмитрию — он должен знать, кто пишет в логах",
        next: "act2_exp_colleague_warning",
        effects: [
          { type: "addSkill", skill: "intuition", value: 1 },
          { type: "showThought", thought: "Каждый крах — глава. А я думал, крах — это просто крах." },
        ],
      },
      {
        text: "Выйти — если кто-то следит за терминалом, лучше исчезнуть",
        next: "act2_dmitry_office_meeting",
        effects: [
          { type: "addStat", stat: "stress", value: 2 },
          { type: "addXp", value: 5 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     6.  CAFE KITCHEN BACK — behind the counter, the barista reveals a newsletter
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_cafe_kitchen_back": {
    id: "act2_exp_cafe_kitchen_back",
    speaker: "npc_barista",
    sceneId: "cafe_evening",
    contextNote: "За стойкой кафе, в подсобке. Бариста вытаскивает из-под кассы листок.",
    accessibilityAnnounce: "Кафе: подсобка. Бариста показывает скрытую рассылку со стихами.",
    ambientSound: "sounds/ambient/cafe_jazz_quiet.ogg",
    text: [
      'Бариста — не тот, кем кажется. Это Володька понимает, когда она закрывает дверь подсобки и вытаскивает из-под кассы тонкий листок. Термобумага, как чек — но вместо суммы, вместо налога, вместо штрихкода — стихи. Шесть строчек, мелкий шрифт, и на обороте — адрес: не физический, не в городе — в Сети.',
      '',
      '«Это рассылка», — говорит она, и голос другой — не бариста-голос, не «что будете заказывать», а — «я тоже читала, я тоже нашла». Она прячет листок обратно. «Каждую неделю — новый. Кто-то пишет. Кто-то распространяет. Мы — распространяем. Кофе и стихи — один и тот же наркотик.»',
      '',
      'Володька смотрит на чек, на кассу, на её лицо. Всё — маска. Кофе — маска. Стойка — маска. А под маской — канал. Под каналом — Сеть. Под Сетью — слова, которые Гильдия считает багом.',
    ].join('\n'),
    guidanceObjectiveType: "talk_to_npc",
    guidanceNpcId: "npc_barista",
    choices: [
      {
        text: "Спросить про стихи на стене — кто пишет в кафе?",
        next: "act2_exp_cafe_poetry_wall",
        goldenPath: true,
        effects: [
          { type: "addSkill", skill: "persuasion", value: 1 },
          { type: "npcChange", npcId: "cafe_barista", npcChange: { relation: 3 } },
          { type: "setFlag", flag: "barista_newsletter_seen", flagValue: true },
        ],
      },
      {
        text: "Пойти к Альберту — он знает про код, про Сеть, про всё это",
        next: "act2_exp_albert_code_philosophy",
        effects: [
          { type: "addSkill", skill: "logic", value: 1 },
          { type: "addXp", value: 8 },
        ],
      },
      {
        text: "Вернуться к бариста — продолжить разговор о Сети",
        next: "act2_barista_followup",
        effects: [
          { type: "addKarma", value: 2 },
          { type: "npcChange", npcId: "cafe_barista", npcChange: { relation: 2 } },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     7.  STREET RAIN — neon reflected in rain; internal monologue on IT & poetry
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_street_rain": {
    id: "act2_exp_street_rain",
    speaker: "narrator",
    sceneId: "street_night",
    contextNote: "Дождь на неоновых вывесках. Мокрый асфальт отражает свет витрин.",
    accessibilityAnnounce: "Улица: дождь. Неон в мокром асфальте. Володька думает о коде и стихах.",
    ambientSound: "sounds/ambient/street_night_rain.ogg",
    text: [
      'Дождь превращает улицу в зеркало. Неон — красный, синий, белый — плавает в мокром асфальте, как строки в мониторе: каждая вывеска — переменная, каждый пешеход — итерация, каждый блик — эхо удалённого файла. Город — программа. Дождь — дебаггер. Он показывает, что под поверхностью.',
      '',
      'Володька думает: что, если IT и поэзия — не разные вещи? Что, если код — это стихотворение, которое машина исполняет вместо человека? Что, если каждый `if` — это выбор, каждый `return` — возвращение, каждый `catch` — попытка удержать ошибку, как строку, которая не вошла в размер?',
      '',
      'Он идёт под дождём, и дождь не стирает мысли — наоборот, пишет их крупнее. Код на экране и стихи в голове — один и тот же текст. Разница только в том, кто читает: машина или человек. А если — оба?',
    ].join('\n'),
    guidanceObjectiveType: "visit_location",
    choices: [
      {
        text: "Искать продавца на улице — кто торгует стихами в этом дождливом городе?",
        next: "act2_exp_street_vendor",
        goldenPath: true,
        effects: [
          { type: "addSkill", skill: "intuition", value: 1 },
          { type: "setFlag", flag: "rain_internal_monologue", flagValue: true },
          { type: "showThought", thought: "Код — это стихотворение для машин. А стихотворение — это код для людей. Один язык. Два компилятора." },
        ],
      },
      {
        text: "Заметить зелёные глаза в переулке — кот?",
        next: "act2_exp_street_cat",
        effects: [
          { type: "addSkill", skill: "empathy", value: 1 },
          { type: "addXp", value: 5 },
        ],
      },
      {
        text: "Вернуться к неоновым вывескам — там был ответ",
        next: "act2_exp_street_neon_signs",
        effects: [
          { type: "addSkill", skill: "writing", value: 1 },
          { type: "addStat", stat: "stress", value: -1 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     8.  VICTORIA NOTEBOOK — Мария's notebook contains network maps
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_victoria_notebook": {
    id: "act2_exp_victoria_notebook",
    speaker: "npc_maria",
    sceneId: "street_night",
    contextNote: "Мария (Victoria) показывает свой блокнот. Страницы с сетевой картой.",
    accessibilityAnnounce: "Улица: Мария показывает блокнот с картой Сети.",
    text: [
      'Блокнот Марии — не бумажный. Термопласт, как старый инженерный журнал, но страницы — не чертежи, не формулы. Страницы — карта. Точки, линии, подписи. Каждая точка — человек. Каждая линия — канал. Каждая подпись — не имя, а код: короткий, как радиочастота, точный, как MAC-адрес.',
      '',
      '«Это Сеть», — говорит она, и голос — не тот, что в офисе. В офисе — тихий, как вентилятор. Здесь — точный, как терминал. «Не интернет. Не корпоративная сеть. — Другая. Люди, которые нашли стихи в коде и решили, что стихи — не баг, а функция.» Она открывает другую страницу. «Вот ты. Вот Альберт. Вот бариста. Вот — я.»',
      '',
      'Володька видит свою точку. Она не в центре — на краю, как новая переменная, которую только объявили, но ещё не инициализировали. Мария закрывает блокнот. «Когда ты инициализируешься — Сеть станет шире. На одну переменную.»',
    ].join('\n'),
    guidanceObjectiveType: "talk_to_npc",
    guidanceNpcId: "npc_maria",
    choices: [
      {
        text: "Попросить показать больше — как Сеть связана с кодом?",
        next: "act2_exp_albert_code_philosophy",
        goldenPath: true,
        effects: [
          { type: "addSkill", skill: "logic", value: 1 },
          { type: "npcChange", npcId: "maria", npcChange: { relation: 4 } },
          { type: "setFlag", flag: "victoria_network_map_seen", flagValue: true },
          { type: "showThought", thought: "Я — неинициализированная переменная. Сеть ждёт, пока я получу значение." },
        ],
      },
      {
        text: "Мария объясняет — узнать о Сети подробнее",
        next: "act2_maria_explains_network",
        effects: [
          { type: "addKarma", value: 2 },
          { type: "npcChange", npcId: "maria", npcChange: { relation: 3 } },
        ],
      },
      {
        text: "Не смотреть — слишком много неизвестных в одной карте",
        next: "act2_network_hesitation",
        effects: [
          { type: "addStat", stat: "stress", value: 3 },
          { type: "addSkill", skill: "intuition", value: 1 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     9.  CHK ELIS SONG — Elis plays guitar; lyrics are a disguised poem
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_chk_elis_song": {
    id: "act2_exp_chk_elis_song",
    speaker: "chk_elis",
    sceneId: "chk_campfire_night",
    contextNote: "Элис играет на гитаре у костра. Песня — замаскированное стихотворение.",
    accessibilityAnnounce: "ЧК: Элис играет на гитаре. Лирика — скрытое стихотворение.",
    ambientSound: "sounds/ambient/chk_campfire.ogg",
    text: [
      'Гитара у Элис — не дорогая. Корпус помят, как старый терминал, гриф — в трещинах, как экран после kernel panic. Но струны — живые. И голос — живой. Она не играет песню — она исполняет код. Строки — такты. Такты — байты. Байты — смысл.',
      '',
      'Володька слушает и понимает: это стихотворение. Не открытое, не прочитанное — спрятанное в мелодии, как комментарий в скомпилированном файле. Если не знаешь, что слушать — слышишь песню. Если знаешь — слышите стихи. Элис смотрит на него через пламя костра и улыбается — не улыбка, а проверка: ты понимаешь? Ты в Сети?',
      '',
      'Последняя строчка обрывается. Гитара замолкает. Костёр трещит. Элис не говорит — ждёт. Володька не отвечает — тоже ждёт. Между ними — частота, которую никто не назвал, но оба услышали.',
    ].join('\n'),
    guidanceObjectiveType: "talk_to_npc",
    guidanceNpcId: "chk_elis",
    choices: [
      {
        text: "Сказать ей — я слышу стихи, не только песню",
        next: "act2_exp_chk_campfire",
        goldenPath: true,
        effects: [
          { type: "addSkill", skill: "rhythm", value: 1 },
          { type: "npcChange", npcId: "chk_elis", npcChange: { relation: 4 } },
          { type: "setFlag", flag: "elis_poem_recognized", flagValue: true },
          { type: "collectPoem", poemId: "poem_elis_song" },
        ],
      },
      {
        text: "Пойти в подвал — там должны быть старые записи этих песен",
        next: "act2_exp_chk_basement_archive",
        effects: [
          { type: "addSkill", skill: "intuition", value: 1 },
          { type: "npcChange", npcId: "chk_elis", npcChange: { relation: 2 } },
        ],
      },
      {
        text: "Просто слушать — иногда понимание приходит позже",
        next: "act2_exp_chk_campfire",
        effects: [
          { type: "addStat", stat: "stress", value: -3 },
          { type: "addXp", value: 8 },
          { type: "showThought", thought: "Песня — это стихотворение, которое решило стать звуком. А звук — это слово, которое решило стать свободным." },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     10. ALBERT CODE PHILOSOPHY — Albert explains how the Network hides poems in error logs
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_albert_code_philosophy": {
    id: "act2_exp_albert_code_philosophy",
    speaker: "npc_albert",
    sceneId: "cafe_evening",
    contextNote: "Альберт в кафе, объясняет философию кода и Сети. Кофе остывает.",
    accessibilityAnnounce: "Кафе: Альберт рассказывает, как Сеть прячет стихи в логах ошибок.",
    ambientSound: "sounds/ambient/cafe_jazz_quiet.ogg",
    text: [
      'Альберт отодвигает кофе — он остыл, как терминал после shutdown. Он говорит не быстро, не медленно — как машинный код, без пауз, но с ритмом. «Ошибка — это не баг. Ошибка — это сообщение. Сервер не падает случайно — он падает, когда не может сказать иначе. segfault — это крик. timeout — это молчание. exception — это исключение, которое кого-то исключило.»',
      '',
      '«Сеть прячется в ошибках», — продолжает он. «Не в коде — в крахах кода. Потому что Гильдия мониторирует код. Читает каждую строчку, каждый коммит, каждый push. Но крахи — никто не читает. Ошибки — nobody reads error logs. — Пока ты не начал.» Он кивает на Володьку. «Ты — первый, кто прочитал. И ты — первый, кого Сеть нашла.»',
      '',
      'Володька смотрит на остывший кофе, на экран автомата, на лицо Альберта. Сеть — не в интернете, не в протоколах, не в DNS. Сеть — в крахах. В криках машин, которые никто не слышит. И он — тот, кто услышал.',
    ].join('\n'),
    guidanceObjectiveType: "talk_to_npc",
    guidanceNpcId: "npc_albert",
    choices: [
      {
        text: "Спросить про Викторию — она показала карту Сети",
        next: "act2_exp_victoria_notebook",
        goldenPath: true,
        effects: [
          { type: "addSkill", skill: "logic", value: 1 },
          { type: "npcChange", npcId: "npc_albert", npcChange: { relation: 3 } },
          { type: "setFlag", flag: "albert_code_philosophy", flagValue: true },
        ],
      },
      {
        text: "Альберт подсказывает — идти по золотому пути",
        next: "act2_albert_network_hint",
        effects: [
          { type: "addKarma", value: 2 },
          { type: "addSkill", skill: "persuasion", value: 1 },
        ],
      },
      {
        text: "Выйти — слишком много философии на одну чашку",
        next: "act2_cafe_reflection",
        effects: [
          { type: "addStat", stat: "stress", value: 1 },
          { type: "addXp", value: 5 },
          { type: "showThought", thought: "Ошибка — это крик. Я всегда думал, это просто ошибка. Но машины тоже кричат." },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     11. PIER FISHING NIGHT — night fishing with Trofim; the factory under the pier
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_pier_fishing_night": {
    id: "act2_exp_pier_fishing_night",
    speaker: "fisherman_trofim",
    sceneId: "pier_evening",
    contextNote: "Ночная рыбалка на пирсе. Трофим говорит о заводе под водой.",
    accessibilityAnnounce: "Пирс: ночная рыбалка. Трофим рассказывает про завод.",
    ambientSound: "sounds/ambient/pier_water.ogg",
    text: [
      'Ночь на пирсе — не чёрная, а серая, как экран без подсветки. Трофим сидит на краю, ноги в воде, удочка — не леска, а провод, не крючок, а датчик. Он не ловит рыбу — он слушает глубину. «Завод — внизу», — говорит он, глядя на воду, как на терминал. «Не под водой — в воде. Трубы, шахты,机房. Всё стоит. Всё гудит. Пятьдесят герц, как сердце города.»',
      '',
      '«Гильдия закрыла его, когда поэты начали писать на стенах机房. Не на экранах — на стенах. Краской. Буквами. Живыми.» Он поднимает удочку — пустую, но не失望. «Они залили завод. Вода — лучший архив. Не горит. Не удаляется. — Просто стоит, как резервная копия, и ждёт, когда кто-нибудь подключится.»',
      '',
      'Володька смотрит вниз. Под водой — город. Под городом — стихи. Под стихами — завод, который гудит, как сервер, который никто не обслуживает, но никто не отключает. Река — архив. Пирс — терминал. Трофим — администратор.',
    ].join('\n'),
    guidanceObjectiveType: "talk_to_npc",
    guidanceNpcId: "fisherman_trofim",
    choices: [
      {
        text: "Ждать рассвет — может, река скажет что-то утром",
        next: "act2_exp_pier_sunrise_poem",
        goldenPath: true,
        effects: [
          { type: "addSkill", skill: "rhythm", value: 1 },
          { type: "npcChange", npcId: "fisherman_trofim", npcChange: { relation: 4 } },
          { type: "setFlag", flag: "trofim_factory_underwater", flagValue: true },
          { type: "discoverLore", loreId: "lore_factory_underwater" },
        ],
      },
      {
        text: "Пойти в ЧК — Трофим говорил о людях под землёй",
        next: "act2_exp_chk_campfire",
        effects: [
          { type: "addSkill", skill: "intuition", value: 1 },
          { type: "addKarma", value: 2 },
        ],
      },
      {
        text: "Вернуться на пирс — осмотреть всё самому",
        next: "pier_explore_mode",
        effects: [
          { type: "addXp", value: 8 },
          { type: "showThought", thought: "Завод под водой — резервная копия стихов. И я — терминал доступа." },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     12. OFFICE OLD TERMINAL — an old terminal displays a poem in ASCII art
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_office_old_terminal": {
    id: "act2_exp_office_old_terminal",
    speaker: "narrator",
    sceneId: "office_day",
    contextNote: "Старый терминал в углу офиса. На экране — ASCII-арт, стихотворение.",
    accessibilityAnnounce: "Офис: старый терминал. ASCII-арт — стихотворение на экране.",
    text: [
      'Старый терминал стоит в углу, как памятник эпохе, которую офис хотел забыть. CRT-монитор, зелёный текст, клавиатура без половины клавиш — но живая. Экран мерцает, и на мерцании — не лог, не дашборд, не отчёт. ASCII-арт.',
      '',
      'Буквы складываются в рисунок — дом, река, человек у воды. А внутри рисунка — стихи. Не отдельно, не рядом — в самой форме: строки изгибаются по контуру дома, слова текут по линии реки, а человек — это одно слово, длинное, как путь от офиса до пирса. Слово — «возвращение».',
      '',
      'Володька читает ASCII-арт, и понимает: это не украшение. Это — инструкция. Карта. Маршрут от серверной к реке, от ошибки к стиху, от кода к — возвращению. Кто-то нарисовал путь на терминале, который никто не проверяет. Кто-то оставил карту в архиве, который никто не чистит.',
    ].join('\n'),
    guidanceObjectiveType: "collect_item",
    choices: [
      {
        text: "Сохранить карту — сфотографировать экран терминала",
        next: "act2_exp_office_server_room",
        goldenPath: true,
        effects: [
          { type: "addSkill", skill: "coding", value: 1 },
          { type: "collectPoem", poemId: "poem_ascii_art" },
          { type: "setFlag", flag: "office_ascii_map_found", flagValue: true },
          { type: "addXp", value: 12 },
        ],
      },
      {
        text: "Пойти к Дмитрию — терминал может быть частью Сети",
        next: "act2_dmitry_office_meeting",
        effects: [
          { type: "addSkill", skill: "logic", value: 1 },
          { type: "showThought", thought: "ASCII-арт — это стихотворение, которое выбрало стать рисунком. А рисунок — это карта, которая выбрала стать маршрутом." },
        ],
      },
      {
        text: "Оставить терминал — не трогать чужую карту",
        next: "act2_exp_colleague_warning",
        effects: [
          { type: "addKarma", value: 1 },
          { type: "addStat", stat: "stress", value: -1 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     13. STREET VENDOR — sells printed poems on thermal paper — illegal but beautiful
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_street_vendor": {
    id: "act2_exp_street_vendor",
    speaker: "narrator",
    sceneId: "street_night",
    contextNote: "Уличный продавец на углу. Термотаксовая бумага со стихами.",
    accessibilityAnnounce: "Улица: продавец стихов на термобумаге. Нелегально, но красиво.",
    ambientSound: "sounds/ambient/street_night_rain.ogg",
    text: [
      'На углу, где неон не добивает, стоит человек — не продавец, не торговец, не мигрант с лотка. Он — распространитель. Лоток — не фрукты, не сигареты, не сим-карты. Лоток — термобумага. Чеки. Но вместо суммы — стихи. Мелкий шрифт, дешёвая краска, уже подтекает — но строки стоят, как стропы, как код, как частота.',
      '',
      '«Двадцать кредитов», — говорит он, не глядя на Володьку. «Или три — если ты из Сети.» Он знает. Не по лицу — по частоте. По тому, как Володька смотрит на строки, не на цену. По тому, как он читает — не глазами, а чем-то другим. Чем-то, что Гильдия не мониторирует.',
      '',
      'Гильдия запрещает стихи на бумаге. Бумага — физический носитель, его можно отследить, конфисковать, сжечь. Но термобумага — как чек: живёт сутки, потом выцветает. Стихи — суточные. Как ошибки в логе — появляются, живут, исчезают. Но кто-то — успевает прочитать.',
    ].join('\n'),
    guidanceObjectiveType: "collect_item",
    choices: [
      {
        text: "Купить стихи — три кредита, я из Сети",
        next: "act2_exp_cafe_jukebox",
        goldenPath: true,
        condition: { flag: "victoria_network_map_seen" },
        effects: [
          { type: "addSkill", skill: "writing", value: 1 },
          { type: "collectPoem", poemId: "poem_vendor_thermal" },
          { type: "addKarma", value: 2 },
          { type: "setFlag", flag: "street_poem_bought", flagValue: true },
        ],
      },
      {
        text: "Купить стихи — двадцать кредитов, я просто прохожий",
        next: "act2_exp_street_rain",
        effects: [
          { type: "addSkill", skill: "empathy", value: 1 },
          { type: "addStat", stat: "stress", value: -2 },
          { type: "collectPoem", poemId: "poem_vendor_thermal" },
          { type: "showThought", thought: "Стихи на термобумаге — живут сутки. Как ошибки в логе. Но кто-то успевает прочитать." },
        ],
      },
      {
        text: "Уйти — покупать нелегальное на улице слишком опасно",
        next: "act2_exp_street_neon_signs",
        effects: [
          { type: "addStat", stat: "stress", value: 2 },
          { type: "addXp", value: 5 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     14. CAFE WINDOW REFLECTION — the city as code and verse, seen from inside
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_cafe_window_reflection": {
    id: "act2_exp_cafe_window_reflection",
    speaker: "volodka",
    sceneId: "cafe_evening",
    contextNote: "Окно кафе. Володька смотрит на город, видит код и стихи одновременно.",
    accessibilityAnnounce: "Кафе: окно. Володька видит город как код и стихи.",
    ambientSound: "sounds/ambient/cafe_jazz_quiet.ogg",
    text: [
      'Окно кафе — не стекло, а интерфейс. С одной стороны — кофе, тепло, бариста. С другой — город: неон, дождь, маршруты. Володька смотрит и видит два слоя одновременно. Первый — физический: здания, вывески, пешеходы. Второй — текстовый: каждый дом — переменная, каждый перекрёсток — оператор, каждый человек — итерация цикла, который никто не прерывает.',
      '',
      'И между слоями — стихи. Не сверху, не снизу — между. Как комментарий в коде: не исполняется, но — объясняет. Город — программа, стихи — комментарии, и без комментариев программа — мёртвая. Машина исполнит, но не поймёт. Люди — прочитают, но не исполнят. А если — оба? Если город — стихотворение, которое машина и человек читают вместе?',
      '',
      'Володька отходит от окна. Кофе остыл. Но мысль — горячая. Город — текст. Текст — город. А он — читатель, который вдруг стал — автором.',
    ].join('\n'),
    guidanceObjectiveType: "visit_location",
    choices: [
      {
        text: "Искать стихи на стене кафе — если город — текст, стены — страницы",
        next: "act2_exp_cafe_poetry_wall",
        goldenPath: true,
        effects: [
          { type: "addSkill", skill: "writing", value: 1 },
          { type: "addKarma", value: 2 },
          { type: "setFlag", flag: "cafe_window_code_vision", flagValue: true },
          { type: "showThought", thought: "Я — читатель, который стал автором. Или автор, который забыл, что он пишет." },
        ],
      },
      {
        text: "Выйти на улицу — проверить неоновый текст на стене",
        next: "act2_exp_street_neon_signs",
        effects: [
          { type: "addSkill", skill: "rhythm", value: 1 },
          { type: "addXp", value: 8 },
        ],
      },
      {
        text: "Остаться в кафе — подумать ещё",
        next: "act2_cafe_reflection",
        effects: [
          { type: "addStat", stat: "stress", value: -3 },
          { type: "addSkill", skill: "empathy", value: 1 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     15. CHK BASEMENT ARCHIVE — banned poetry tapes in the basement beneath ЧК
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_chk_basement_archive": {
    id: "act2_exp_chk_basement_archive",
    speaker: "chk_based",
    sceneId: "chk_forest_zorge",
    contextNote: "Подвал под ЧК. Кассеты со стихами, старые записи, запретная память.",
    accessibilityAnnounce: "ЧК: подвал. Архив запретных кассет со стихами.",
    text: [
      'Подвал под ЧК — не подвал. Архив. Стены — не бетон, а полки. Полки — не пустые, а полные: кассеты, диски, флешки, бумага. Каждый носитель — запретный. Гильдия запрещает стихи на любом носителе — физическом, цифровом, даже голосовом. Но здесь — всё. Всё, что Гильдия сожгла, удалила, перезаписала. — Здесь.',
      '',
      'Бэйсид снимает кассету с полки — маркировка не номер, а имя: «Лебедев. 1987. Неизданное.» Он вставляет в старый плеер, и из динамика — голос. Не студийный, не обработанный — живой. Человек читает стихи в комнате, где гудит холодильник и кто-то кашляет за стеной. Голос — хриплый, как сервер после перегрузки. Но строки — чистые, как код без багов.',
      '',
      '«Гильдия думает, что можно уничтожить слово», — говорит Бэйсид, выключая плеер. «Но слово — не файл. Не можно удалить. — Можно скрыть. А скрытое — ждёт. Как резервная копия. Как архив. Как — мы.»',
    ].join('\n'),
    guidanceObjectiveType: "collect_item",
    choices: [
      {
        text: "Слушать кассету — записать строки в память",
        next: "act2_exp_chk_campfire",
        goldenPath: true,
        effects: [
          { type: "addSkill", skill: "rhythm", value: 2 },
          { type: "collectPoem", poemId: "poem_lebedev_archive" },
          { type: "setFlag", flag: "chk_archive_discovered", flagValue: true },
          { type: "discoverLore", loreId: "lore_banned_poetry_tapes" },
        ],
      },
      {
        text: "Спросить Дмитрия — он тоже здесь? Зачем?",
        next: "act2_exp_dmitry_guilt",
        effects: [
          { type: "addSkill", skill: "empathy", value: 1 },
          { type: "npcChange", npcId: "chk_based", npcChange: { relation: 2 } },
        ],
      },
      {
        text: "Вернуться к костру — слишком много в этом архиве",
        next: "act2_exp_chk_campfire",
        effects: [
          { type: "addStat", stat: "stress", value: 3 },
          { type: "addXp", value: 10 },
          { type: "showThought", thought: "Слово — не файл. Его нельзя удалить. Можно только скрыть. А скрытое ждёт." },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     16. DMITRY GUILT — Dmitry confesses why he deserted the Guild
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_dmitry_guilt": {
    id: "act2_exp_dmitry_guilt",
    speaker: "office_dmitry",
    sceneId: "chk_forest_zorge",
    contextNote: "Дмитрий в ЧК. Он рассказывает, почему ушёл из Гильдии.",
    accessibilityAnnounce: "ЧК: Дмитрий confesses. Гильдия наказала поэта, которого он любил.",
    text: [
      'Дмитрий — не в офисе. Он — здесь, под землёй, среди людей, которых Гильдия считает багами. Его лицо — не то, что Володька видел на работе: там — маска, тут — открытый терминал. Без пароля, без шифрования, без защиты. Он говорит — и каждая фраза — не офисная, не «как дела», не «отправил ли ты отчёт».',
      '',
      '«Я ушёл, потому что Гильдия наказала поэта», — говорит он, и голос — не ровный, как в офисе, а — неровный, как крах. «Не меня. — Её. Женщину, которая писала стихи в комментариях к моему коду. Я не знал — сначала. Потом узнал. Потом — Гильдия узнала. Они не удалили стихи — они удалили её. Не физически — digitally. Удалили аккаунт, историю,アクセス. Как будто её не было.»',
      '',
      'Он замолкает. Костёр мерцает. Володька видит: Дмитрий — не дезертир. Он — администратор, который отказался выполнять команду `rm -rf` на живом человеке. Он — кодер, который не стал — убийцем кода.',
    ].join('\n'),
    guidanceObjectiveType: "talk_to_npc",
    guidanceNpcId: "office_dmitry",
    choices: [
      {
        text: "Обнять его — иногда код не нужен, нужен контакт",
        next: "act2_exp_chk_campfire",
        goldenPath: true,
        condition: { minSkillCheck: { skill: "empathy", difficulty: 12 } },
        effects: [
          { type: "addSkill", skill: "empathy", value: 2 },
          { type: "npcChange", npcId: "office_dmitry", npcChange: { relation: 5 } },
          { type: "addKarma", value: 4 },
          { type: "setFlag", flag: "dmitry_guilt_confessed", flagValue: true },
          { type: "showThought", thought: "rm -rf на живом человеке. Гильдия не удаляет стихи — она удаляет авторов." },
        ],
      },
      {
        text: "Сказать — я понимаю. Я тоже нашёл стихи в коде.",
        next: "act2_dmitry_contact",
        effects: [
          { type: "addSkill", skill: "persuasion", value: 1 },
          { type: "npcChange", npcId: "office_dmitry", npcChange: { relation: 3 } },
          { type: "addKarma", value: 2 },
        ],
      },
      {
        text: "Не говорить — его боль — не мой терминал",
        next: "act2_exp_chk_basement_archive",
        effects: [
          { type: "addStat", stat: "stress", value: 2 },
          { type: "addSkill", skill: "logic", value: 1 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     17. COLLEAGUE WARNING — the colleague warns about the Network — or is it a trap?
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_colleague_warning": {
    id: "act2_exp_colleague_warning",
    speaker: "office_colleague",
    sceneId: "office_day",
    contextNote: "Коллега в офисе, возле серверной. Предупреждение — или провокация?",
    accessibilityAnnounce: "Офис: коллега предупреждает о Сети. Или это ловушка Гильдии?",
    text: [
      'Коллега — не тот, кем кажется. Володька знал это всегда: каждый в офисе — два человека, один — для Гильдии, другой — для себя. Но сейчас коллега — третий. Он стоит у двери серверной, лицо — не офисное, не домашнее, а — чужое. Как монитор с другим IP.',
      '',
      '«Ты нашёл стихи в логах», — говорит он, и Володька понимает: это не вопрос, это — факт. Коллега знает. Как —? Откуда —? «Сеть — не то, чем кажется», — продолжает он. «Не спасение. Не underground. — Может быть — ловушка. Гильдия создаёт ловушки. Подбрасывает стихи в логи — и ждёт, кто прочитает. Кто прочитает — тот подключается. Кто подключается — тот — найден.»',
      '',
      'Володька смотрит на него. Лицо — не читается. Как зашифрованный файл: видно, что есть данные, но — какие? Коллега — предупреждение? Или — провокация? Или — и то, и другое, как строка, которая и комментарий, и код?',
    ].join('\n'),
    guidanceObjectiveType: "talk_to_npc",
    guidanceNpcId: "office_colleague",
    choices: [
      {
        text: "Доверять — он предупреждает, не threatens",
        next: "act2_exp_office_server_room",
        goldenPath: true,
        condition: { minSkillCheck: { skill: "intuition", difficulty: 12 } },
        effects: [
          { type: "addSkill", skill: "intuition", value: 1 },
          { type: "npcChange", npcId: "office_colleague", npcChange: { relation: 3 } },
          { type: "setFlag", flag: "colleague_warning_trusted", flagValue: true },
          { type: "addKarma", value: 2 },
        ],
      },
      {
        text: "Не доверять — это может быть провокация Гильдии",
        next: "act2_dmitry_office_meeting",
        effects: [
          { type: "addSkill", skill: "logic", value: 1 },
          { type: "addStat", stat: "stress", value: 3 },
          { type: "setFlag", flag: "colleague_warning_suspected", flagValue: true },
          { type: "showThought", thought: "Предупреждение или провокация? Строка, которая и комментарий, и код." },
        ],
      },
      {
        text: "Уйти — не решать сейчас, не выбирать сейчас",
        next: "act2_exp_office_old_terminal",
        effects: [
          { type: "addStat", stat: "stress", value: 1 },
          { type: "addXp", value: 8 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     18. STREET CAT — a cybernetic cat with glowing eyes carries a message tag
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_street_cat": {
    id: "act2_exp_street_cat",
    speaker: "narrator",
    sceneId: "street_night",
    contextNote: "Кибернетический кот в переулке. Глаза — зелёные диоды, на ошейнике — бирка.",
    accessibilityAnnounce: "Улица: кибернетический кот. Зелёные глаза, бирка на ошейнике — сообщение.",
    ambientSound: "sounds/ambient/street_night_rain.ogg",
    text: [
      'Кот — не кот. Или — кот, но не только. Глаза — зелёные, как терминал, как светодиод, как строка в мониторе. Они пульсируют — не мигают, а пульсируют, как пульс, как бит, как heartbeat процесса, который не завершён и не прерван. Кот сидит в переулке, мокрый, равнодушный — как сервер, который работает, но не отвечает на ping.',
      '',
      'На ошейнике — бирка. Не имя, не адрес — код. Шесть символов, как MAC-адрес, как радиочастота, как — ключ. Володька читает код, и код — не случайный. Он — указатель. Pointer. На что —? Кот смотрит на него зелёными глазами и — не двигается. Ждёт, пока Володька решит: follow the pointer или — не follow.',
      '',
      'Кибернетический кот — не животное. Он — терминал. Мобильный, маленький, равнодушный. Он — доставка. Он — канал. Он — node в Сети, который выглядит — как кот. Потому что котов — никто не мониторирует. Котов — никто не отслеживает. Котов — можно выпускать в любой переулок, и они — приходят к тем, кто читает код.',
    ].join('\n'),
    guidanceObjectiveType: "collect_item",
    choices: [
      {
        text: "Следовать за котом — pointer ведёт куда-то",
        next: "act2_exp_cafe_jukebox",
        goldenPath: true,
        effects: [
          { type: "addSkill", skill: "intuition", value: 1 },
          { type: "setFlag", flag: "cyber_cat_followed", flagValue: true },
          { type: "addXp", value: 10 },
          { type: "showThought", thought: "Кот — терминал. Кот — node. Кот — доставка. Сеть — не только люди. Сеть — даже коты." },
        ],
      },
      {
        text: "Пойти к продавцу — он знает про коды и частоты",
        next: "act2_exp_street_vendor",
        effects: [
          { type: "addSkill", skill: "logic", value: 1 },
          { type: "addStat", stat: "stress", value: -1 },
        ],
      },
      {
        text: "Не следовать — pointer может вести в trap",
        next: "act2_exp_albert_code_philosophy",
        condition: { minSkillCheck: { skill: "logic", difficulty: 14 } },
        effects: [
          { type: "addSkill", skill: "logic", value: 1 },
          { type: "addStat", stat: "stress", value: 1 },
          { type: "setFlag", flag: "cyber_cat_pointer_not_followed", flagValue: true },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     19. CAFE POETRY WALL — handwritten verse behind a poster on the cafe wall
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_cafe_poetry_wall": {
    id: "act2_exp_cafe_poetry_wall",
    speaker: "narrator",
    sceneId: "cafe_evening",
    contextNote: "Стена кафе, за плакатом — рукописные строки. Чернила флюоресцируют.",
    accessibilityAnnounce: "Кафе: за плакатом на стене — рукописное стихотворение.",
    ambientSound: "sounds/ambient/cafe_jazz_quiet.ogg",
    text: [
      'Плакат на стене кафе — реклама кофе, как всё в этом городе: реклама, вывеска, предложение, которое никто не принимает. Но Володька — принимает. Он отгибает край плаката — и за ним, на кирпиче, — строки. Рукописные. Чернила — не обычные: флюоресцируют в свете неона, как строчки на экране, как баг, который светится только в debug-mode.',
      '',
      'Четыре строчки. Короткие, хлёсткие, точные — как код без багов, как стих без размера, как слово без шифрования. Кто-то написал их от руки — риск, опасность, живой носитель, который Гильдия может отследить по отпечаткам, по почерку, по чернилам. Но кто-то — написал. Кто-то — рискнул. Кто-то — решил, что слово важнее безопасности.',
      '',
      'Володька читает. Строки — не автора, не подписи — чистые. Как функция без имени. Как lambda, которая живёт только пока её вызывают. Он вызывает — и строка оживает. А когда он отходит — плакат закрывает их снова. Функция завершена. Lambda — deleted. Но — прочитана.',
    ].join('\n'),
    guidanceObjectiveType: "collect_item",
    choices: [
      {
        text: "Запомнить строки — записать в голову, не на бумагу",
        next: "act2_exp_cafe_kitchen_back",
        goldenPath: true,
        effects: [
          { type: "addSkill", skill: "writing", value: 2 },
          { type: "collectPoem", poemId: "poem_wall_handwritten" },
          { type: "setFlag", flag: "cafe_wall_poem_found", flagValue: true },
          { type: "addKarma", value: 3 },
        ],
      },
      {
        text: "Спросить бариста — кто пишет на стенах?",
        next: "act2_exp_cafe_kitchen_back",
        effects: [
          { type: "addSkill", skill: "persuasion", value: 1 },
          { type: "npcChange", npcId: "cafe_barista", npcChange: { relation: 2 } },
          { type: "showThought", thought: "Lambda-строка: живёт только пока её вызывают. Я вызвал — она ожила." },
        ],
      },
      {
        text: "Посмотреть в окно — город тоже пишет",
        next: "act2_exp_cafe_window_reflection",
        effects: [
          { type: "addSkill", skill: "rhythm", value: 1 },
          { type: "addStat", stat: "stress", value: -2 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     20. PIER SUNRISE POEM — sunrise on the pier; the river recites lines — or is it his mind?
     ══════════════════════════════════════════════════════════════════════════ */
  "act2_exp_pier_sunrise_poem": {
    id: "act2_exp_pier_sunrise_poem",
    speaker: "narrator",
    sceneId: "pier_evening",
    contextNote: "Рассвет на пирсе. Река — или разум — читает стихи.",
    accessibilityAnnounce: "Пирс: рассвет. Володька слышит стихи — от реки или от разума.",
    ambientSound: "sounds/ambient/pier_water.ogg",
    text: [
      'Рассвет на пирсе — не красный, не золотой, а серый с зелёным, как экран терминала при загрузке. Река — серая, но не мёртвая: под поверхностью — движение, как процесс, который ещё не вывел результат, но уже — работает. И в этом движении — звук. Не плеск, не ветер — слова. Строки. Ритм.',
      '',
      'Володька слышит. Или — думает, что слышит. Или — слышит, потому что думает. Река не говорит — вода не имеет голоса. Но вода имеет — частоту. И частота — совпадает. С тем стихотворением, которое он прочитал в серверной. С тем ритмом, который он услышал в автомате. С тем кодом, который он нашёл в крахах. Всё — одна частота. Река — один канал.',
      '',
      'Он стоит на пирсе, рассвет поднимается, и город — включается. Неон зажигается, как монитор после reboot. И Володька понимает: стихи — не в реке, не в городе, не в сервере. Стихи — в частоте. А частота — в нём. Он — терминал. Он — node. Он — переменная, которая наконец — инициализировалась.',
    ].join('\n'),
    guidanceObjectiveType: "visit_location",
    choices: [
      {
        text: "Инициализироваться — подключиться к Сети",
        next: "act2_network_hesitation",
        goldenPath: true,
        effects: [
          { type: "addSkill", skill: "rhythm", value: 2 },
          { type: "addKarma", value: 4 },
          { type: "setFlag", flag: "pier_sunrise_init", flagValue: true },
          { type: "discoverLore", loreId: "lore_frequency_poem" },
          { type: "showThought", thought: "Я — переменная, которая наконец инициализировалась. Значение — слово." },
        ],
      },
      {
        text: "Пойти в ЧК — к людям, которые слышат ту же частоту",
        next: "act2_exp_chk_campfire",
        effects: [
          { type: "addSkill", skill: "empathy", value: 1 },
          { type: "addStat", stat: "stress", value: -3 },
          { type: "addXp", value: 12 },
        ],
      },
      {
        text: "Остаться на пирсе — рассвет ещё не закончил говорить",
        next: "pier_explore_mode",
        effects: [
          { type: "addSkill", skill: "rhythm", value: 1 },
          { type: "addStat", stat: "stress", value: -4 },
          { type: "collectPoem", poemId: "poem_river_frequency" },
        ],
      },
    ],
  },
};
