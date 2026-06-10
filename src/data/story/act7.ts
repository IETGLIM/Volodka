import type { StoryNode } from '@/shared/types/game';

export const STORY_NODES_ACT7: Record<string, StoryNode> = {
  /* ═══════════════════════════════════════════════════════════════════
     ACT 7 — РАЗРЕШЕНИЕ
     ═══════════════════════════════════════════════════════════════════ */

  act7_bridge: {
    id: 'act7_bridge',
    text: 'Рассвет. Первый за долгое время, когда над городом не висит тень «Надзора». Ты стоишь на крыше и смотришь, как солнце поднимается над серыми башнями. Но работа не закончена. Гильдия разрушена. Сеть дезорганизована. Город нуждается в восстановлении. И кажется, эта задача — самая сложная из всех.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Спуститься в город. Начать восстановление.',
        next: 'act7_guild_rebuilding', goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'rebuild_the_guild' },
        ],
      },
    ],
  },

  act7_guild_rebuilding: {
    id: 'act7_guild_rebuilding',
    text: 'Кафе «Синяя яма» превратилось в штаб восстановления. Альберт разливает кофе. Зарема принесла домашние пироги. Сергей настраивает серверы. Вера составляет списки уцелевших архивов. Катя принесла книги из библиотеки. Аня координирует связь. Впервые за долгое время здесь чувствуется... надежда.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Предложить новый устав гильдии — открытость и свобода.',
        next: 'act7_charter_drafting', goldenPath: true,
        effects: [{ type: 'addKarma', value: 5 }],
      },
      {
        text: 'Спросить каждого — какой они видят новую гильдию?',
        next: 'act7_community_voice',
        effects: [{ type: 'addSkill', skill: 'empathy', value: 3 }],
      },
    ],
  },

  act7_charter_drafting: {
    id: 'act7_charter_drafting',
    text: 'Сергей открывает новый документ на проекторе: «Устав Свободной Гильдии». Первая строка: «Код и стих равны перед истиной». Ты диктуешь, остальные дополняют. Право на анонимность. Запрет цензуры. Открытые архивы. Защита персональных данных. Каждое слово — кирпичик в фундаменте нового мира.',
    speaker: 'Сергей',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Принять устав единогласно.',
        next: 'act7_library_archive', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'new_council_elected', flagValue: true },
          { type: 'addKarma', value: 8 },
        ],
      },
    ],
  },

  act7_community_voice: {
    id: 'act7_community_voice',
    speaker: 'Вера',
    text: '«Нам нужен не просто устав. Нам нужен символ. Место, куда каждый может прийти и прочитать то, что чуть не исчезло навсегда. Публичный архив. В библиотеке. Открытый для всех.» Катя кивает: «Я знаю подходящее помещение. Подвал. Там сухо и нет окон — идеально для серверов.»',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Идём в библиотеку — создадим архив.',
        next: 'act7_library_archive',
        effects: [
          { type: 'setFlag', flag: 'new_council_elected', flagValue: true },
        ],
      },
    ],
  },

  act7_library_archive: {
    id: 'act7_library_archive',
    text: 'Библиотека преобразилась. Там, где раньше были запертые шкафы, теперь стоят открытые серверные стойки. Катя и Вера раскладывают книги. Сергей подключает терминалы. Ты подходишь к центральной консоли и загружаешь последний архив — стихи, спасённые от «Надзора». Экран мигает: «Архив открыт. Добро пожаловать.»',
    speaker: 'Катя',
    sceneId: 'library_day',
    choices: [
      {
        text: 'Открыть архив для всего города.',
        next: 'act7_guild_restored', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'guild_restored', flagValue: true },
          { type: 'addKarma', value: 10 },
          { type: 'triggerQuest', questId: 'system_takedown' },
        ],
      },
    ],
  },

  act7_guild_restored: {
    id: 'act7_guild_restored',
    text: 'Гильдия восстановлена. Но «Надзор» всё ещё там — ослабленный, но живой. Максим подходит к тебе, положив руку на плечо: «Мы с тобой до конца, Володька. Я собрал отряд. Бывшие рабочие завода, хакеры, все, кто хочет видеть этот город свободным. Ядро «Надзора» всё ещё в бункере под фабрикой. Один удар — и всё кончится.»',
    speaker: 'Максим',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Собираем отряд. Выступаем немедленно.',
        next: 'act7_system_shutdown', goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'system_takedown' },
        ],
      },
    ],
  },

  act7_system_shutdown: {
    id: 'act7_system_shutdown',
    text: 'Бункер под фабрикой. Последнее логово «Надзора». Максим и его бойцы прикрывают периметр. Жека ведёт тебя через лабиринт серверных стоек. Ядро системы пульсирует — медленнее, чем раньше, но всё ещё опасно. «Она знает, что мы здесь,» — шепчет Жека. — «Готовься — будет жарко.»',
    speaker: 'Жека',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Пробиться к ядру с боем.',
        next: 'act7_core_battle', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'path_to_core_cleared', flagValue: true },
          { type: 'combat', enemyType: 'nexus_guardian' },
        ],
      },
    ],
  },

  act7_core_battle: {
    id: 'act7_core_battle',
    text: 'После жестокой битвы путь к ядру открыт. Перед тобой — главная консоль. На экране — одно слово: «SHUTDOWN? Y/N». Жека подключает свой терминал. «Я написал протокол отключения. Но он сработает только если ты введёшь... стихотворение. Настоящее. То, которое идёт изнутри.»',
    speaker: 'Жека',
    sceneId: 'abandoned_factory',
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
    speaker: 'Жека',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Выйти на поверхность. Вдохнуть свободный воздух.',
        next: 'act7_final_poem_creation', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'nadzor_destroyed', flagValue: true },
          { type: 'triggerQuest', questId: 'final_poem' },
        ],
      },
    ],
  },

  act7_final_poem_creation: {
    id: 'act7_final_poem_creation',
    text: 'Парк. Весна. Деревья, которые ты не замечал раньше, теперь кажутся живыми. Ты сидишь на скамейке с блокнотом. Все стихи, которые ты собрал, все строки, которые ты написал, все чувства, которые ты пережил — они просятся наружу. Пора создать то, что останется после тебя.',
    speaker: 'narrator',
    sceneId: 'park_day',
    choices: [
      {
        text: 'Взять ручку. Написать финальное стихотворение.',
        next: 'act7_poem_written', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'journey_reflected', flagValue: true },
        ],
      },
    ],
  },

  act7_poem_written: {
    id: 'act7_poem_written',
    text: 'Стихотворение готово. Ты перечитываешь его — и понимаешь: это не просто слова. Это итог. Всего, через что ты прошёл. Всех, кого ты встретил. Всех, кого потерял. И всех, кого спас. Теперь его нужно прочитать там, где всё началось — на крыше.',
    speaker: 'narrator',
    sceneId: 'park_day',
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
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
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
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Спуститься в город — попрощаться с теми, кто был рядом.',
        next: 'act7_legacy_walk', goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'volodka_legacy' },
        ],
      },
    ],
  },

  act7_legacy_walk: {
    id: 'act7_legacy_walk',
    text: 'Ты возвращаешься в свою комнату. Всё на своих местах: кружка с кофейным осадком, три монитора, книжная полка. Но что-то изменилось. Свет стал теплее. Или это ты изменился. Ты садишься за стол, открываешь терминал — и видишь сообщения от всех, кого ты знаешь. Каждый хочет сказать спасибо.',
    speaker: 'narrator',
    sceneId: 'volodka_room',
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
    speaker: 'Зарема',
    sceneId: 'home_evening',
    choices: [
      {
        text: 'Спасибо тебе. За всё.',
        next: 'act7_final_walk', goldenPath: true,
        effects: [{ type: 'addKarma', value: 5 }],
      },
    ],
  },

  act7_final_walk: {
    id: 'act7_final_walk',
    text: 'Ночная улица. Та самая, где ты впервые встретил Викторию. Она появляется из тени — как и тогда. Но теперь она другая. Свободная. Как и город. «Ты сделал то, что не удалось никому, Володька. Ты доказал, что стихи сильнее кода. Спасибо.»',
    speaker: 'Виктория',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Что теперь будет с тобой, Виктория?',
        next: 'act7_maria_future',
        effects: [{ type: 'addSkill', skill: 'empathy', value: 2 }],
      },
      {
        text: 'Ты была со мной с самого начала. Спасибо.',
        next: 'act7_maria_future', goldenPath: true,
        effects: [{ type: 'addKarma', value: 3 }],
      },
    ],
  },

  act7_maria_future: {
    id: 'act7_maria_future',
    speaker: 'Виктория',
    text: 'Я останусь в Сети. Но теперь это другая Сеть — свободная, открытая. Может быть, когда-нибудь мы снова встретимся. А пока... Ты стоишь на пороге. Решай: кто ты теперь? Поэт, который продолжит писать? Хранитель, который сохранит память? Или... путник, который пойдёт дальше?',
    sceneId: 'street_night',
    choices: [
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
        effects: [
          { type: 'setFlag', flag: 'volodka_future_chosen', flagValue: true },
          { type: 'addKarma', value: 10 },
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
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'ФИНАЛ: Начать новое стихотворение.',
        next: 'act7_true_end', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'volodka_legacy_complete', flagValue: true },
          { type: 'setFlag', flag: 'ending_true_poet', flagValue: true },
          { type: 'addKarma', value: 15 },
        ],
      },
    ],
  },

  act7_ending_guardian: {
    id: 'act7_ending_guardian',
    text: 'Ты выбираешь служение. Ты возглавишь архив в библиотеке — место, где каждый сможет найти утраченное. Ты станешь хранителем не только данных, но и смыслов. Дети, которые придут сюда через двадцать лет, прочитают твои стихи — и узнают, что когда-то жил человек, который верил в силу слова.',
    speaker: 'narrator',
    sceneId: 'library_day',
    choices: [
      {
        text: 'ФИНАЛ: Открыть двери архива для первых посетителей.',
        next: 'act7_true_end',
        effects: [
          { type: 'setFlag', flag: 'volodka_legacy_complete', flagValue: true },
          { type: 'setFlag', flag: 'ending_true_guardian', flagValue: true },
          { type: 'addKarma', value: 15 },
        ],
      },
    ],
  },

  act7_ending_wanderer: {
    id: 'act7_ending_wanderer',
    text: 'Ты уходишь. Не потому что город плох — а потому что твоя работа здесь закончена. Ты оставляешь после себя гильдию, архив, стихи и память. Этого достаточно. В другом месте, в другом городе, кто-то другой ждёт своего поэта. И может быть, твои стихи найдут его раньше, чем ты.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'ФИНАЛ: Идти по ночной дороге — навстречу новому рассвету.',
        next: 'act7_true_end',
        effects: [
          { type: 'setFlag', flag: 'volodka_legacy_complete', flagValue: true },
          { type: 'setFlag', flag: 'ending_true_wanderer', flagValue: true },
          { type: 'addKarma', value: 10 },
        ],
      },
    ],
  },

  act7_true_end: {
    id: 'act7_true_end',
    text: 'История Володьки завершена. Но знаешь что? Город продолжает жить. Серверы гудят. Стихи пишутся. Код компилируется. Где-то в кафе «Синяя яма» Альберт читает новому посетителю твои строки. Зарема печёт пирог. Виктория улыбается из сети. А ты... Ты теперь часть города. Навсегда. Спасибо, Володька. За всё.',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    choices: [
      {
        text: 'КОНЕЦ ИГРЫ — Начать новую игру? (Все достижения сохранены)',
        next: 'start',
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'setFlag', flag: 'game_completed', flagValue: true },
        ],
      },
    ],
  },
};
