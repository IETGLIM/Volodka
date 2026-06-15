import type { StoryNode } from '@/shared/types/game';

export const STORY_NODES_ACT7: Record<string, StoryNode> = {
  /* ═══════════════════════════════════════════════════════════════════
     ACT 7 — РАЗРЕШЕНИЕ
     ═══════════════════════════════════════════════════════════════════ */

  act7_bridge: {
    id: 'act7_bridge',
    text: 'Рассвет. Первый за долгое время, когда над городом не висит тень «Надзора». Ты стоишь на крыше и смотришь, как солнце поднимается над серыми башнями. Но работа не закончена. Гильдия разрушена. Сеть дезорганизована. Город нуждается в восстановлении. И кажется, эта задача — самая сложная из всех.',
    textVariants: {
      highKarma: 'Рассвет без «Надзора». Ты выбрал путь памяти — город ждёт восстановления.',
      neutralKarma: 'Рассвет над городом. Гильдия разрушена — восстановление впереди.',
      lowKarma: 'Тень ушла, но шрамы остались. Восстановление — самая трудная битва.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Крыша на рассвете. Тень «Надзора» рассеяна — город ждёт восстановления.',
    accessibilityAnnounce: 'Акт VII. Рассвет после выбора на крыше.',
    ambientSound: 'sounds/ambient/rooftop_wind.ogg',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    guidanceHint: 'Спустись в город — начни восстановление гильдии.',
    guidanceSceneLabel: 'крышу',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Спуститься в город. Начать восстановление.',
        next: 'act7_guild_rebuilding', goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'rebuild_the_guild' },
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
    ],
  },

  act7_guild_rebuilding: {
    id: 'act7_guild_rebuilding',
    text: 'Кафе «Синяя яма» превратилось в штаб восстановления. Альберт разливает кофе. Зарема принесла домашние пироги. Сергей настраивает серверы. Алина составляет списки уцелевших архивов. Катя принесла книги из библиотеки. Аня координирует связь. Впервые за долгое время здесь чувствуется... надежда.',
    contextNote: '«Синяя яма» — штаб восстановления. Кофе, пироги, серверы, надежда.',
    ambientSound: 'sounds/ambient/cafe_evening_jazz.ogg',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    guidanceHint: 'Устав гильдии — или голос каждого участника.',
    guidanceSceneLabel: 'кафе «Синяя яма»',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Предложить новый устав гильдии — открытость и свобода.',
        next: 'act7_charter_drafting', goldenPath: true,
        effects: [{ type: 'addKarma', value: 5 }],
      },
      {
        text: 'Спросить каждого — какой они видят новую гильдию?',
        next: 'act7_community_voice',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'npcChange', npcId: 'npc_alina', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  act7_charter_drafting: {
    id: 'act7_charter_drafting',
    text: 'Сергей открывает новый документ на проекторе: «Устав Свободной Гильдии». Первая строка: «Код и стих равны перед истиной». Ты диктуешь, остальные дополняют. Право на анонимность. Запрет цензуры. Открытые архивы. Защита персональных данных. Каждое слово — кирпичик в фундаменте нового мира.',
    contextNote: 'Проектор в кафе. «Устав Свободной Гильдии» — первая строка о коде и стихе.',
    speaker: 'Сергей',
    sceneId: 'cafe_evening',
    guidanceNpcId: 'npc_sergey',
    guidanceHint: 'Примите устав — затем откройте архив в библиотеке.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Принять устав единогласно.',
        next: 'act7_library_archive', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'new_council_elected', flagValue: true },
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'npc_sergey', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  act7_community_voice: {
    id: 'act7_community_voice',
    text: '«Нам нужен не просто устав. Нам нужен символ. Место, куда каждый может прийти и прочитать то, что чуть не исчезло навсегда. Публичный архив. В библиотеке. Открытый для всех.» Катя кивает: «Я знаю подходящее помещение. Подвал. Там сухо и нет окон — идеально для серверов.»',
    contextNote: 'Алина предлагает публичный архив. Катя знает подвал библиотеки.',
    speaker: 'Алина',
    sceneId: 'cafe_evening',
    guidanceNpcId: 'npc_katya',
    guidanceHint: 'Идите в библиотеку — создайте открытый архив.',
    guidanceSceneLabel: 'библиотеку',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Идём в библиотеку — создадим архив.',
        next: 'act7_library_archive',
        effects: [
          { type: 'setFlag', flag: 'new_council_elected', flagValue: true },
          { type: 'npcChange', npcId: 'npc_alina', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  act7_library_archive: {
    id: 'act7_library_archive',
    text: 'Библиотека преобразилась. Там, где раньше были запертые шкафы, теперь стоят открытые серверные стойки. Катя и Алина раскладывают книги. Сергей подключает терминалы. Ты подходишь к центральной консоли и загружаешь последний архив — стихи, спасённые от «Надзора». Экран мигает: «Архив открыт. Добро пожаловать.»',
    contextNote: 'Библиотека. Открытые стойки, книги, консоль — «Архив открыт».',
    accessibilityAnnounce: 'Публичный архив открыт в библиотеке.',
    ambientSound: 'sounds/ambient/library_hush.ogg',
    musicCue: 'discovery',
    autoSave: true,
    speaker: 'Катя',
    sceneId: 'library_day',
    guidanceNpcId: 'npc_katya',
    guidanceHint: 'Открой архив для всего города.',
    guidanceSceneLabel: 'библиотеку',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Открыть архив для всего города.',
        next: 'act7_guild_restored', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'guild_restored', flagValue: true },
          { type: 'addKarma', value: 10 },
          { type: 'triggerQuest', questId: 'system_takedown' },
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
    ],
  },

  act7_guild_restored: {
    id: 'act7_guild_restored',
    text: 'Гильдия восстановлена. Но «Надзор» всё ещё там — ослабленный, но живой. Максим подходит к тебе, положив руку на плечо: «Мы с тобой до конца, Володька. Я собрал отряд. Бывшие рабочие завода, хакеры, все, кто хочет видеть этот город свободным. Ядро «Надзора» всё ещё в бункере под фабрикой. Один удар — и всё кончится.»',
    contextNote: 'Кафе после восстановления. Максим кладёт руку на плечо — последний удар по «Надзору».',
    speaker: 'Максим',
    sceneId: 'cafe_evening',
    guidanceNpcId: 'npc_maxim',
    guidanceHint: 'Собери отряд — штурм бункера под фабрикой.',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Собираем отряд. Выступаем немедленно.',
        next: 'act7_system_shutdown', goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'system_takedown' },
          { type: 'npcChange', npcId: 'npc_maxim', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  act7_system_shutdown: {
    id: 'act7_system_shutdown',
    text: 'Бункер под фабрикой. Последнее логово «Надзора». Максим и его бойцы прикрывают периметр. Жека ведёт тебя через лабиринт серверных стоек. Ядро системы пульсирует — медленнее, чем раньше, но всё ещё опасно. «Она знает, что мы здесь,» — шепчет Жека. — «Готовься — будет жарко.»',
    contextNote: 'Бункер под фабрикой. Лабиринт стоек, пульсирующее ядро.',
    ambientSound: 'sounds/ambient/bunker_hum.ogg',
    musicCue: 'tension',
    speaker: 'Жека',
    sceneId: 'abandoned_factory',
    guidanceNpcId: 'npc_zheka',
    guidanceHint: 'Пробейся к ядру — бой неизбежен.',
    guidanceSceneLabel: 'бункер под заводом',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Пробиться к ядру с боем.',
        next: 'act7_core_battle', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'path_to_core_cleared', flagValue: true },
          { type: 'combat', enemyType: 'nexus_guardian' },
          { type: 'addStat', stat: 'stress', value: 12 },
          { type: 'addStat', stat: 'energy', value: -15 },
        ],
      },
    ],
  },

  act7_core_battle: {
    id: 'act7_core_battle',
    text: 'После жестокой битвы путь к ядру открыт. Перед тобой — главная консоль. На экране — одно слово: «SHUTDOWN? Y/N». Жека подключает свой терминал. «Я написал протокол отключения. Но он сработает только если ты введёшь... стихотворение. Настоящее. То, которое идёт изнутри.»',
    contextNote: 'Консоль ядра. На экране: SHUTDOWN? Y/N. Жека ждёт стихотворение.',
    accessibilityAnnounce: 'Путь к ядру открыт. Нужно стихотворение для отключения.',
    ambientSound: 'sounds/ambient/server_room_hum.ogg',
    autoSave: true,
    speaker: 'Жека',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Введи стихотворение — последнее, что услышит «Надзор».',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Ввести стихотворение — последнее, что услышит «Надзор».',
        next: 'act7_nadzor_dies', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'nadzor_shutdown_complete', flagValue: true },
          { type: 'setFlag', flag: 'core_defenses_disabled', flagValue: true },
          { type: 'addKarma', value: 15 },
          { type: 'triggerQuest', questId: 'final_poem' },
        ],
      },
    ],
  },

  act7_nadzor_dies: {
    id: 'act7_nadzor_dies',
    text: 'Ты набираешь строки. Каждое слово — как гвоздь в крышку гроба системы, которая держала город в страхе десятилетиями. Экран мигает. Серверы гудят — и замолкают один за другим. Тишина. Глубокая, звенящая тишина. «Надзор» мёртв. По-настоящему мёртв. Жека вытирает пот со лба: «Мы сделали это, Володька. Мы... сделали.»',
    contextNote: 'Серверы замолкают один за другим. Глубокая звенящая тишина.',
    accessibilityAnnounce: '«Надзор» отключён. Серверы замолкли.',
    ambientSound: 'sounds/ambient/digital_pulse.ogg',
    musicCue: 'mystery',
    autoSave: true,
    speaker: 'Жека',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Выйди на поверхность — напиши финальное стихотворение.',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Выйти на поверхность. Вдохнуть свободный воздух.',
        next: 'act7_final_poem_creation', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'nadzor_destroyed', flagValue: true },
          { type: 'triggerQuest', questId: 'final_poem' },
          { type: 'addStat', stat: 'stress', value: -15 },
          { type: 'addStat', stat: 'energy', value: 10 },
        ],
      },
    ],
  },

  act7_final_poem_creation: {
    id: 'act7_final_poem_creation',
    text: 'Парк. Весна. Деревья, которые ты не замечал раньше, теперь кажутся живыми. Ты сидишь на скамейке с блокнотом. Все стихи, которые ты собрал, все строки, которые ты написал, все чувства, которые ты пережил — они просятся наружу. Пора создать то, что останется после тебя.',
    contextNote: 'Весенний парк. Блокнот на скамейке — финальное стихотворение ждёт.',
    ambientSound: 'sounds/ambient/park_morning.ogg',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'park_day',
    guidanceHint: 'Напиши финальное стихотворение — итог всего пути.',
    guidanceSceneLabel: 'парк',
    guidanceObjectiveType: 'collect_item',
    choices: [
      {
        text: 'Взять ручку. Написать финальное стихотворение.',
        next: 'act7_poem_written', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'journey_reflected', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_29' },
          { type: 'addStat', stat: 'stress', value: -10 },
        ],
      },
    ],
  },

  act7_poem_written: {
    id: 'act7_poem_written',
    text: 'Стихотворение готово. Ты перечитываешь его — и понимаешь: это не просто слова. Это итог. Всего, через что ты прошёл. Всех, кого ты встретил. Всех, кого потерял. И всех, кого спас. Теперь его нужно прочитать там, где всё началось — на крыше.',
    contextNote: 'Стихотворение готово. Пора прочитать его на крыше.',
    speaker: 'narrator',
    sceneId: 'park_day',
    guidanceHint: 'Поднимись на крышу — прочитай стих городом.',
    guidanceSceneLabel: 'крышу',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Подняться на крышу. Прочитать стихотворение городу.',
        next: 'act7_rooftop_recital', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'final_poem_written', flagValue: true },
        ],
      },
    ],
  },

  act7_rooftop_recital: {
    id: 'act7_rooftop_recital',
    text: 'Крыша. Закат. Весь город перед тобой — мигающий огнями, живой. Ты стоишь на том же месте, где сражался с тенью «Надзора». Но теперь здесь нет врагов. Только ветер. И слова, которые ждут, чтобы их услышали. Ты открываешь рот — и строки льются, как будто их кто-то диктует.',
    textVariants: {
      highKarma: 'Ветер несёт строки над городом. Эхо стихов — благодарность, не прощание.',
      neutralKarma: 'Закат на крыше. Строки льются — город слушает.',
      lowKarma: 'Ветер холодный, но слова тёплые. Город слышит.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Крыша на закате. Ветер, город внизу, финальное чтение стиха.',
    accessibilityAnnounce: 'Финальное чтение стихотворения на крыше. Ветер, эхо над городом.',
    ambientSound: 'sounds/ambient/rooftop_wind.ogg',
    musicCue: 'emotional',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    guidanceHint: 'Прочитай стих — и отпусти прошлое.',
    guidanceSceneLabel: 'крышу',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Прочитать стихотворение — и отпустить прошлое.',
        next: 'act7_poem_published', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'final_poem_published', flagValue: true },
          { type: 'addKarma', value: 10 },
          { type: 'triggerQuest', questId: 'volodka_legacy' },
        ],
      },
    ],
  },

  act7_poem_published: {
    id: 'act7_poem_published',
    text: 'Стихотворение расходится по городской сети. Терминалы на улицах показывают твои строки. Люди останавливаются. Читают. Кто-то плачет. Кто-то улыбается. Кто-то записывает слова на бумагу — впервые за много лет. Поэзия вернулась в город. И она останется здесь навсегда.',
    contextNote: 'Стих на экранах по всему городу. Люди останавливаются и читают.',
    accessibilityAnnounce: 'Финальный стих расходится по городской сети.',
    ambientSound: 'sounds/ambient/city_broadcast.ogg',
    musicCue: 'emotional',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    guidanceHint: 'Спустись в город — попрощайся с близкими.',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Спуститься в город — попрощаться с теми, кто был рядом.',
        next: 'act7_legacy_walk', goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'volodka_legacy' },
          { type: 'collectPoem', poemId: 'poem_27' },
          { type: 'addStat', stat: 'stress', value: -8 },
        ],
      },
    ],
  },

  act7_legacy_walk: {
    id: 'act7_legacy_walk',
    text: 'Ты возвращаешься в свою комнату. Всё на своих местах: кружка с кофейным осадком, три монитора, книжная полка. Но что-то изменилось. Свет стал теплее. Или это ты изменился. Ты садишься за стол, открываешь терминал — и видишь сообщения от всех, кого ты знаешь. Каждый хочет сказать спасибо.',
    contextNote: 'Комната Володьки. Сообщения благодарности на терминале.',
    ambientSound: 'sounds/ambient/room_morning.ogg',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    guidanceHint: 'Прочитай сообщения — затем навести Зарему.',
    guidanceSceneLabel: 'комнату',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Прочитать сообщения.',
        next: 'act7_goodbye_zarema', goldenPath: true,
        effects: [{ type: 'addKarma', value: 3 }],
      },
    ],
  },

  act7_goodbye_zarema: {
    id: 'act7_goodbye_zarema',
    text: 'Ты идёшь к Зареме. Она на кухне, как всегда, готовит что-то невероятно вкусное. Увидев тебя, она улыбается — но в глазах слёзы. «Я знаю, Володька. Ты уходишь. Я всегда знала, что этот день настанет. Ты не просто сосед по коммуналке. Ты... изменил всё. Для всех нас.»',
    contextNote: 'Кухня Заремы. Прощание — слёзы и улыбка.',
    accessibilityAnnounce: 'Прощание с Заремой на кухне.',
    ambientSound: 'sounds/ambient/kitchen_evening.ogg',
    speaker: 'Зарема',
    sceneId: 'home_evening',
    guidanceNpcId: 'npc_zarema',
    guidanceHint: 'Поблагодари Зарему — затем встреть Викторию.',
    guidanceObjectiveType: 'talk_to_npc',
    choices: [
      {
        text: 'Спасибо тебе. За всё.',
        next: 'act7_final_walk', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'npc_zarema', npcChange: { relation: 10 } },
          { type: 'addStat', stat: 'stress', value: -10 },
        ],
      },
    ],
  },

  act7_final_walk: {
    id: 'act7_final_walk',
    text: 'Ночная улица. Та самая, где ты впервые встретил Викторию. Она появляется из тени — как и тогда. Но теперь она другая. Свободная. Как и город. «Ты сделал то, что не удалось никому, Володька. Ты доказал, что стихи сильнее кода. Спасибо.»',
    contextNote: 'Ночная улица. Виктория выходит из тени — как в первую встречу.',
    accessibilityAnnounce: 'Встреча с Викторией перед финальным выбором.',
    ambientSound: 'sounds/ambient/street_night_rain.ogg',
    speaker: 'Виктория',
    sceneId: 'street_night',
    guidanceNpcId: 'npc_viktoria',
    guidanceHint: 'Поговори с Викторией — выбери, кто ты теперь.',
    guidanceObjectiveType: 'talk_to_npc',
    choices: [
      {
        text: 'Что теперь будет с тобой, Виктория?',
        next: 'act7_maria_future',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'npc_viktoria', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Ты была со мной с самого начала. Спасибо.',
        next: 'act7_maria_future', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'npc_viktoria', npcChange: { relation: 8 } },
        ],
      },
    ],
  },

  act7_maria_future: {
    id: 'act7_maria_future',
    text: 'Я останусь в Сети. Но теперь это другая Сеть — свободная, открытая. Может быть, когда-нибудь мы снова встретимся. А пока... Ты стоишь на пороге. Решай: кто ты теперь? Поэт, который продолжит писать? Хранитель, который сохранит память? Или... путник, который пойдёт дальше?',
    textVariants: {
      highKarma: 'Виктория улыбается: «Ты прошёл путь с открытым сердцем. Выбор ясен — как строка, которую не стыдно прочитать вслух.»',
      neutralKarma: '«Сеть свободна. Кто ты теперь — поэт, хранитель или путник?»',
      lowKarma: '«Город помнит шрамы. Но и тебя — тоже. Решай, кем остаться.»',
    },
    karmaThresholds: { high: 70, low: 35 },
    contextNote: 'Ночная улица. Виктория — финальный выбор пути.',
    accessibilityAnnounce: 'Финальный выбор: поэт, хранитель или путник.',
    autoSave: true,
    speaker: 'Виктория',
    sceneId: 'street_night',
    guidanceNpcId: 'npc_viktoria',
    guidanceHint: 'Поэт, хранитель или путник — путь из Акта V отражается в выборе.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Я — поэт. Двадцать одна строка ведут меня дальше.',
        next: 'act7_ending_poet_legacy',
        condition: { flag: 'poet_chosen' },
        effects: [
          { type: 'setFlag', flag: 'volodka_future_chosen', flagValue: true },
          { type: 'addKarma', value: 12 },
        ],
      },
      {
        text: 'Я — создатель. Код и стих — одно целое. Я сохраню память.',
        next: 'act7_ending_guardian',
        condition: { flag: 'creator_chosen' },
        effects: [
          { type: 'setFlag', flag: 'volodka_future_chosen', flagValue: true },
          { type: 'addKarma', value: 12 },
        ],
      },
      {
        text: 'Я — повстанец. Город свободен — но мне пора идти дальше.',
        next: 'act7_ending_wanderer',
        condition: { flag: 'revolution_chosen' },
        effects: [
          { type: 'setFlag', flag: 'volodka_future_chosen', flagValue: true },
          { type: 'addKarma', value: 8 },
        ],
      },
      {
        text: 'Я — изгой. Этот город отпустил меня — я отпускаю его.',
        next: 'act7_ending_wanderer',
        condition: { flag: 'exile_chosen' },
        effects: [
          { type: 'setFlag', flag: 'volodka_future_chosen', flagValue: true },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Я — машина, ставшая памятью. Архив — мой дом.',
        next: 'act7_ending_guardian',
        condition: { flag: 'machine_chosen' },
        effects: [
          { type: 'setFlag', flag: 'volodka_future_chosen', flagValue: true },
          { type: 'addKarma', value: 8 },
        ],
      },
      {
        text: 'Я — поэт. Я продолжу писать.',
        next: 'act7_ending_poet_legacy', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'volodka_future_chosen', flagValue: true },
          { type: 'addKarma', value: 10 },
        ],
      },
      {
        text: 'Я — хранитель. Я сохраню память для будущих поколений.',
        next: 'act7_ending_guardian',
        condition: { flag: 'chose_guardian_path' },
        effects: [
          { type: 'setFlag', flag: 'volodka_future_chosen', flagValue: true },
          { type: 'addKarma', value: 12 },
        ],
      },
      {
        text: 'Я — хранитель. Я сохраню память для будущих поколений.',
        next: 'act7_ending_guardian',
        effects: [
          { type: 'setFlag', flag: 'volodka_future_chosen', flagValue: true },
          { type: 'addKarma', value: 10 },
        ],
      },
      {
        text: 'Я — путник. Моя история здесь закончена.',
        next: 'act7_ending_wanderer',
        condition: { flag: 'chose_liberator_path' },
        effects: [
          { type: 'setFlag', flag: 'volodka_future_chosen', flagValue: true },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Я — путник. Моя история здесь закончена.',
        next: 'act7_ending_wanderer',
        effects: [
          { type: 'setFlag', flag: 'volodka_future_chosen', flagValue: true },
        ],
      },
    ],
  },

  act7_ending_poet_legacy: {
    id: 'act7_ending_poet_legacy',
    text: 'Ты выбираешь поэзию. Не как профессию — как путь. Ты останешься в этом городе и будешь писать. Учить других. Вдохновлять. Каждый твой стих будет напоминанием: свобода — это не отсутствие цепей. Свобода — это способность сказать правду. И ты будешь говорить её до последнего вздоха.',
    textVariants: {
      highKarma: 'Поэзия — не профессия, а обещание городу. Ты будешь говорить правду.',
      neutralKarma: 'Ты остаёшься писать. Свобода — способность сказать правду.',
      lowKarma: 'Стихи останутся — даже если город помнит шрамы.',
    },
    karmaThresholds: { high: 70, low: 35 },
    contextNote: '«Синяя яма». Ты выбираешь путь поэта.',
    accessibilityAnnounce: 'Концовка: наследие поэта.',
    ambientSound: 'sounds/ambient/cafe_evening_jazz.ogg',
    musicCue: 'discovery',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    guidanceHint: 'Начни новое стихотворение — или перелистай книгу памяти.',
    guidanceSceneLabel: 'кафе «Синяя яма»',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'ФИНАЛ: Начать новое стихотворение.',
        next: 'act7_true_end', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'volodka_legacy_complete', flagValue: true },
          { type: 'setFlag', flag: 'ending_true_poet', flagValue: true },
          { type: 'addKarma', value: 15 },
          { type: 'addStat', stat: 'stress', value: -15 },
        ],
      },
      {
        text: 'Прежде чем писать новое — перелистать всё, что вписано в тебя',
        next: 'act7_poet_legacy_mirror',
        effects: [
          { type: 'setFlag', flag: 'volodka_legacy_complete', flagValue: true },
          { type: 'setFlag', flag: 'ending_true_poet', flagValue: true },
          { type: 'addKarma', value: 15 },
        ],
      },
    ],
  },

  act7_poet_legacy_mirror: {
    id: 'act7_poet_legacy_mirror',
    text: 'Вечер в «Синей яме». Чистый лист лежит перед тобой, но ты не торопишься: каждый поэт знает — прежде чем написать первую строку, нужно дочитать предыдущую книгу. Свою. Ты листаешь её под гул кофемашины, страница за страницей.',
    contextNote: 'Зеркало памяти поэта. Книга пути под гул кофемашины.',
    accessibilityAnnounce: 'Зеркало памяти — вспомни весь путь.',
    guidanceHint: 'Вспомните, что было важно на вашем пути.',
    guidanceObjectiveType: 'make_choice',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Страница «Создатель»: код и стих слились в новый мир — ты выбрал созидание, не революцию.',
        next: 'act7_true_end',
        condition: { flag: 'creator_chosen' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Повстанец»: башня рухнула, стихи на стенах — ты выбрал огонь, и город выжил.',
        next: 'act7_true_end',
        condition: { flag: 'revolution_chosen' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Изгой»: костёр в пустоши, тетрадь в рюкзаке — ты ушёл, но слова остались.',
        next: 'act7_true_end',
        condition: { flag: 'exile_chosen' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Машина»: абсолютная память без жалости — ты переписал систему изнутри.',
        next: 'act7_true_end',
        condition: { flag: 'machine_chosen' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Примирение»: снег в «Синей яме», Александр без охраны — мир стоил дороже победы.',
        next: 'act7_true_end',
        condition: { flag: 'peace_chosen' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Поэт»: все двадцать одна строка вели сюда — ты выбрал истину слова, не власти.',
        next: 'act7_true_end',
        condition: { flag: 'poet_chosen' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Жертва»: ты отдал себя системе, чтобы другие дышали — эта строка ещё не дописана.',
        next: 'act7_true_end',
        condition: { flag: 'sacrifice_chosen' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Исповедь машины»: «Заря-М» шептала в подвале — ты слышал и не отвернулся.',
        next: 'act7_true_end',
        condition: { flag: 'heard_machine_confession' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Зорге»: костёр в лесу, Басед наливает, Ритка поёт. Чекисты — гильдия без устава, кроме одного: не предавать.',
        next: 'act7_true_end',
        condition: { flag: 'tolpa_honorary_chekist' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Зари-М»: ты выслушал исповедь машины и освободил её. Кладбище стихов стало библиотекой, и где-то под заводом она пишет — уже не по приказу.',
        next: 'act7_true_end',
        condition: { flag: 'zarya_freed' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Зари-М»: ты выслушал исповедь машины и дал ей отдых. Экран погас тихо, как закрытая книга. Стихи вернулись к людям — носить их теперь ваша работа.',
        next: 'act7_true_end',
        condition: { flag: 'zarya_shutdown' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница тайника: последняя тетрадь Владимира, комната за стеллажом. Ты прочитал стихотворение, которого не было в сети, — и теперь пишешь его продолжение.',
        next: 'act7_true_end',
        condition: { flag: 'final_poem_read' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница с пятном от варенья: чай у Заремы перед штурмом. Она и сегодня ставит чайник, не спрашивая. Некоторые строки не нуждаются в правке.',
        next: 'act7_true_end',
        condition: { flag: 'quiet_tea_zarema' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Пирс №3»: тихая песня у воды. Ритка поёт так, будто река — единственный слушатель, которому можно доверять.',
        next: 'act7_true_end',
        condition: { flag: 'quiet_song_ritka' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Прогресс-7»: гул под полом, который ты слушал, не трогая. Сторожа не уходят с объекта — они отходят на безопасное расстояние.',
        next: 'act7_true_end',
        condition: { flag: 'basement_hum_heard' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «18 строк»: Сбой, #4729, подвал. Ты собрал нить — и потому пишешь не с нуля, а в продолжение.',
        next: 'act7_true_end',
        condition: { flag: 'thread_18_complete' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Закрыть книгу. Взять ручку. Чистый лист ждал достаточно.',
        next: 'act7_true_end',
      },
    ],
  },

  act7_ending_guardian: {
    id: 'act7_ending_guardian',
    text: 'Ты выбираешь служение. Ты возглавишь архив в библиотеке — место, где каждый сможет найти утраченное. Ты станешь хранителем не только данных, но и смыслов. Дети, которые придут сюда через двадцать лет, прочитают твои стихи — и узнают, что когда-то жил человек, который верил в силу слова.',
    textVariants: {
      highKarma: 'Архив открыт. Ты — хранитель памяти, которую нельзя стереть.',
      neutralKarma: 'Библиотека ждёт. Ты сохранишь смыслы для тех, кто придёт после.',
      lowKarma: 'Память — долг. Ты примешь его.',
    },
    karmaThresholds: { high: 70, low: 35 },
    contextNote: 'Библиотека. Ты выбираешь путь хранителя архива.',
    accessibilityAnnounce: 'Концовка: хранитель памяти.',
    ambientSound: 'sounds/ambient/library_hush.ogg',
    musicCue: 'discovery',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'library_day',
    guidanceHint: 'Открой архив — или перелистай страницы служения.',
    guidanceSceneLabel: 'библиотеку',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'ФИНАЛ: Открыть двери архива для первых посетителей.',
        next: 'act7_true_end', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'volodka_legacy_complete', flagValue: true },
          { type: 'setFlag', flag: 'ending_true_guardian', flagValue: true },
          { type: 'addKarma', value: 15 },
          { type: 'addStat', stat: 'stress', value: -15 },
        ],
      },
      {
        text: 'Перед открытием — вспомнить, ради чего ты стал хранителем',
        next: 'act7_guardian_legacy_mirror',
        effects: [
          { type: 'setFlag', flag: 'volodka_legacy_complete', flagValue: true },
          { type: 'setFlag', flag: 'ending_true_guardian', flagValue: true },
          { type: 'addKarma', value: 15 },
        ],
      },
    ],
  },

  act7_guardian_legacy_mirror: {
    id: 'act7_guardian_legacy_mirror',
    text: 'Ты стоишь у входа в архив — ключ в руке, дверь ещё закрыта. Хранитель не спешит: прежде чем открыть память города другим, он перечитывает свою. Страница за страницей — кто привёл тебя сюда.',
    contextNote: 'Зеркало памяти хранителя. Ключ у закрытой двери архива.',
    accessibilityAnnounce: 'Зеркало памяти хранителя.',
    guidanceHint: 'Вспомните, что было важно на вашем пути.',
    guidanceObjectiveType: 'make_choice',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'library_day',
    choices: [
      {
        text: 'Страница «Создатель»: «Живой код» и библиотека — ты строил мир, где стих и алгоритм равны.',
        next: 'act7_true_end',
        condition: { flag: 'creator_chosen' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Машина»: ты выбрал абсолютную память — теперь архив станет твоим сердцем, не тюрьмой.',
        next: 'act7_true_end',
        condition: { flag: 'machine_chosen' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Хранитель»: на крыше ты переписал Тень — память сильнее разрушения.',
        next: 'act7_true_end',
        condition: { flag: 'chose_guardian_path' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Архив»: стихи, спасённые от «Надзора», мерцают на консоли — «Добро пожаловать».',
        next: 'act7_true_end',
        condition: { flag: 'guild_restored' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Дмитрий»: предательство и прощение — ты выбрал союз, и башня пала изнутри.',
        next: 'act7_true_end',
        condition: { flag: 'dmitry_forgiven' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Дмитрий»: ты изгнал предателя с чипом — память города чище, но шрам остался.',
        next: 'act7_true_end',
        condition: { flag: 'dmitry_exiled' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Зорге»: лес принял беглецов — хранитель помнит и тех, кто не вошёл в архив.',
        next: 'act7_true_end',
        condition: { flag: 'tolpa_honorary_chekist' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Повернуть ключ. Двери откроются — память ждёт.',
        next: 'act7_true_end',
      },
    ],
  },

  act7_ending_wanderer: {
    id: 'act7_ending_wanderer',
    text: 'Ты уходишь. Не потому что город плох — а потому что твоя работа здесь закончена. Ты оставляешь после себя гильдию, архив, стихи и память. Этого достаточно. В другом месте, в другом городе, кто-то другой ждёт своего поэта. И может быть, твои стихи найдут его раньше, чем ты.',
    textVariants: {
      highKarma: 'Ты уходишь с лёгким сердцем — город в добрых руках.',
      neutralKarma: 'Дорога зовёт. Архив, гильдия и стихи останутся.',
      lowKarma: 'Пустошь впереди — но слова в кармане теплее костра.',
    },
    karmaThresholds: { high: 70, low: 35 },
    contextNote: 'Зимняя дорога. Ты уходишь — работа здесь закончена.',
    accessibilityAnnounce: 'Концовка: путник уходит с дорогой.',
    ambientSound: 'sounds/ambient/street_winter_wind.ogg',
    musicCue: 'mystery',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'street_winter',
    guidanceHint: 'Иди по дороге — или вспомни, что унёс с собой.',
    guidanceSceneLabel: 'зимнюю дорогу',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'ФИНАЛ: Идти по ночной дороге — навстречу новому рассвету.',
        next: 'act7_true_end', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'volodka_legacy_complete', flagValue: true },
          { type: 'setFlag', flag: 'ending_true_wanderer', flagValue: true },
          { type: 'addKarma', value: 10 },
          { type: 'addStat', stat: 'stress', value: -20 },
        ],
      },
      {
        text: 'Перед уходом — разложить рюкзак и вспомнить, что унёс из города',
        next: 'act7_wanderer_legacy_mirror',
        effects: [
          { type: 'setFlag', flag: 'volodka_legacy_complete', flagValue: true },
          { type: 'setFlag', flag: 'ending_true_wanderer', flagValue: true },
          { type: 'addKarma', value: 10 },
        ],
      },
    ],
  },

  act7_wanderer_legacy_mirror: {
    id: 'act7_wanderer_legacy_mirror',
    text: 'Рюкзак на обочине. Ты раскладываешь его не для проверки веса — для проверки души. Что ты унёс? Что оставил? Ночной ветер ждёт ответа.',
    contextNote: 'Зеркало памяти путника. Рюкзак на обочине ночной дороги.',
    accessibilityAnnounce: 'Зеркало памяти путника.',
    guidanceHint: 'Вспомните, что было важно на вашем пути.',
    guidanceObjectiveType: 'make_choice',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'street_winter',
    choices: [
      {
        text: 'Страница «Изгой»: пустошь, костёр, тетрадь — ты уже уходил однажды и знаешь цену тишине.',
        next: 'act7_true_end',
        condition: { flag: 'exile_chosen' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Освободитель»: ты отпустил и систему, и сознания — город свободен без тебя.',
        next: 'act7_true_end',
        condition: { flag: 'chose_liberator_path' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Повстанец»: обломки башни в зеркале заднего вида — революция не нуждается в памятнике.',
        next: 'act7_true_end',
        condition: { flag: 'revolution_chosen' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Первый стих»: тетрадь у сердца — с чужих строк началось, своими закончишь в другом городе.',
        next: 'act7_true_end',
        condition: { flag: 'quiet_first_poem' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Страница «Зорге»: мелодия Ритки в ушах — путник несёт песню, которую не сжать.',
        next: 'act7_true_end',
        condition: { flag: 'tolpa_honorary_chekist' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Затянуть рюкзак. Дорога ждёт.',
        next: 'act7_true_end',
      },
    ],
  },

  act7_true_end: {
    id: 'act7_true_end',
    text: 'История Володьки завершена. Каждый собранный стих, каждый выбор в пользу правды и каждая спасённая душа привели сюда — к твоему финалу. Но знаешь что? Город продолжает жить. Серверы гудят. Стихи пишутся. Код компилируется. Где-то в кафе «Синяя яма» Альберт читает новому посетителю твои строки. Зарема печёт пирог. Виктория улыбается из сети. А ты... Ты теперь часть города. Навсегда. Спасибо, Володька. За всё.',
    textVariants: {
      highKarma: 'Город живёт. Ты — часть его навсегда. Спасибо, Володька.',
      neutralKarma: 'История завершена. Серверы гудят, стихи пишутся. Спасибо.',
      lowKarma: 'Финал. Шрамы остались — но и свет. Спасибо за путь.',
    },
    karmaThresholds: { high: 70, low: 35 },
    contextNote: 'Комната Володьки. Финал — благодарность городу и всем, кого ты встретил.',
    accessibilityAnnounce: 'Конец игры. История Володьки завершена.',
    ambientSound: 'sounds/ambient/room_sunset.ogg',
    musicCue: 'emotional',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'volodka_room',
    guidanceHint: 'Начать новую игру — все достижения сохранены.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'КОНЕЦ ИГРЫ — Начать новую игру? (Все достижения сохранены)',
        next: 'start',
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'setFlag', flag: 'game_completed', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -20 },
        ],
      },
    ],
  },
};
