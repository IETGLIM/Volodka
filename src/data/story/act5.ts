import type { StoryNode } from '@/shared/types/game';

export const STORY_NODES_ACT5: Record<string, StoryNode> = {
  /* ═══════════════════════════════════════════════════════════════════
     ACT 5 — ФИНАЛ: Последний выбор
     ═══════════════════════════════════════════════════════════════════ */

  act5_peaceful_path: {
    id: 'act5_peaceful_path',
    text: 'Ты спускаешься с крыши не победителем, а строителем. Мирный путь — самый трудный. Ты приглашаешь Александра на встречу в «Синей яме». Он приходит — один, без охраны, постаревший на десять лет за эти недели. «Я знал о стихах,» — говорит он тихо. «Я знал, и я пытался защитить их... по-своему. Протокол Забвения — не мой. Его навязали сверху. Дай мне шанс исправить.» За окном падает снег, и на мгновение город кажется прежним — тем, что существовал до серверов.',
    textVariants: {
      highKarma: 'Снег за окном «Синей ямы». Александр пришёл без охраны — ты заслужил разговор, а не войну.',
      neutralKarma: 'Встреча в кафе. Александр говорит о Протоколе — его навязали сверху. Снег за окном.',
      lowKarma: 'Александр смотрит настороженно, но садится. Шанс на мир — хрупкий, как первый снег.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: '«Синяя яма» вечером. Снег за окном, Александр за столом.',
    ambientSound: 'sounds/ambient/cafe_evening_jazz.ogg',
    musicCue: 'emotional',
    accessibilityAnnounce: 'Мирные переговоры в кафе. Снег за окном.',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    guidanceHint: 'Создатель, примирение или осторожный союз — выбор строителя.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Я создам новый мир — где код и поэзия едины',
        next: 'ending_creator',
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'setFlag', flag: 'creator_path', flagValue: true },
        ],
        condition: { minKarma: 60, minSkill: { writing: 7 } },
      },
      {
        text: 'Принять его слова и работать вместе',
        next: 'ending_reconciliation', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'setFlag', flag: 'alexander_allied', flagValue: true },
        ],
      },
      {
        text: 'Работать вместе, но с осторожностью',
        next: 'ending_reconciliation',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  act5_revolution_path: {
    id: 'act5_revolution_path',
    text: 'Революция — не романтика. Это бессонные ночи, страх, потери. Но и — надежда, единство, свобода. Сеть становится настоящей силой: люди выходят на улицы не с лозунгами, а со стихами. Гильдия трещит по швам. Александр исчезает. Власть рушится, и на её месте — пока пустота. Что ты построишь на руинах? Город ждёт ответа, и каждый экран транслирует твои стихи, как пульс новой свободы.',
    textVariants: {
      highKarma: 'Город читает стихи на площадях. Революция без крови — редкость, но ты удержал её.',
      neutralKarma: 'Гильдия трещит. Экраны транслируют стихи. Пустота на месте власти ждёт ответа.',
      lowKarma: 'Руины башни дымятся. Свобода есть — но цена ещё не названа вслух.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Ночная улица. Гильдия рушится, экраны пульсируют стихами.',
    ambientSound: 'sounds/ambient/street_night_rain.ogg',
    musicCue: 'tension',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'street_night',
    guidanceHint: 'Свободный город, новая система или сжечь всё — революция требует решения.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Свободный город — власть слову!',
        next: 'ending_rebel',
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'setFlag', flag: 'free_city', flagValue: true },
        ],
        condition: { minKarma: 60, minSkill: { persuasion: 7 } },
      },
      {
        text: 'Я стану системой — но лучшей',
        next: 'ending_machine',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'new_system', flagValue: true },
        ],
        condition: { minSkill: { coding: 8 }, flag: 'low_empathy' },
      },
      {
        text: 'Сжечь всё и начать заново',
        next: 'ending_rebel',
        effects: [
          { type: 'addKarma', value: -5 },
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'setFlag', flag: 'low_empathy', flagValue: true },
        ],
      },
    ],
  },

  act5_exile_path: {
    id: 'act5_exile_path',
    text: 'Ты уходишь на рассвете. Рюкзак с тетрадями, чип Виктории, несколько стихотворений наизусть — вот и всё твоё богатство. За городом — пустошь, заброшенные серверные фермы, мёртвые зоны без связи. Но и — тишина. Свобода. Ты идёшь, не оглядываясь. Стихи звучат в голове, как прощальный хор. За спиной остаётся город, который так и не научился слушать. Ты — изгой. Но ты — свободен. И в кармане — слова, которые переживут любой сервер.',
    contextNote: 'Рассвет за городом. Рюкзак, тетради, пустошь впереди.',
    ambientSound: 'sounds/ambient/street_winter_wind.ogg',
    musicCue: 'mystery',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'street_winter',
    guidanceHint: 'Новая жизнь в пустоши — или обещание вернуться.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Начать новую жизнь в пустоши',
        next: 'ending_exile',
        effects: [
          { type: 'addStat', stat: 'stress', value: -15 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Однажды я вернусь',
        next: 'ending_exile',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'exile_promised_return', flagValue: true },
        ],
      },
    ],
  },

  act5_poet_path: {
    id: 'act5_poet_path',
    text: 'Все 21 стихотворение собрано. Все слова — твои. Ты стоишь посреди города, и каждое стихотворение, которое ты когда-либо читал, каждое, которое когда-либо писал, — всё это звучит одновременно. Не шум — симфония. Ты чувствуешь, как слова обретают плоть, как строки становятся мостами между людьми. Реальность поддаётся — как глина под пальцами скульптора. Ты — не просто поэт. Ты — само Слово, и слово это — свобода.',
    textVariants: {
      highKarma: 'Двадцать одно стихотворение звучит хором. Реальность поддаётся — мягко, как глина.',
      neutralKarma: 'Все слова собраны. Симфония стихов наполняет город.',
      lowKarma: 'Стихи звучат — и мир дрожит. Слово сильнее, чем ты ожидал.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Край крыши. Все двадцать одно стихотворение звучит одновременно.',
    ambientSound: 'sounds/ambient/rooftop_wind.ogg',
    musicCue: 'emotional',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    guidanceHint: 'Прочитай последнее стихотворение — или раздели его с городом.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Прочитать последнее стихотворение — то, которое ещё не написано',
        next: 'ending_poet',
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'collectPoem', poemId: 'poem_23' },
        ],
      },
      {
        text: 'Разделить стихи с городом — все вместе',
        next: 'ending_poet',
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'setFlag', flag: 'shared_final_poem', flagValue: true },
        ],
      },
    ],
  },

  act5_ending_sacrifice: {
    id: 'act5_ending_sacrifice',
    text: 'Ты садишься за терминал в последний раз. Виктория стоит рядом — или висит в воздухе, полупрозрачная, сотканная из данных и света. «Если я волью себя в сеть целиком,» — шепчешь ты, — «стихи станут бессмертными. Ни одна строка не будет удалена никогда.» Виктория качает головой: «Ты станешь кодом, Володька. Человеком — перестанешь.» Ты закрываешь глаза. Где-то внутри звучит ритм — не сердцебиение, а пульсация данных. Ты выбираешь вечность.',
    contextNote: 'Терминал в убежище. Виктория рядом — полупрозрачная, из света и данных.',
    accessibilityAnnounce: 'Последний выбор: слиться с живым кодом.',
    ambientSound: 'sounds/ambient/digital_pulse.ogg',
    musicCue: 'mystery',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    guidanceNpcId: 'npc_maria',
    choices: [
      {
        text: 'Слиться с живым кодом — стать стихотворением',
        next: 'act5_epilogue',
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addSkill', skill: 'writing', value: 5 },
          { type: 'addSkill', skill: 'coding', value: 5 },
          { type: 'setFlag', flag: 'ending_sacrifice', flagValue: true },
          { type: 'setFlag', flag: 'volodka_merged_with_code', flagValue: true },
        ],
      },
    ],
  },

  act5_epilogue: {
    id: 'act5_epilogue',
    text: 'Город помнит. Экраны продолжают мерцать стихами — не потому что кто-то их поддерживает, а потому что они живые. В кафе «Синяя яма» бариста подаёт «особый» кофе — и каждый глоток несёт строку. На улицах дети читают вслух, и их голоса смешиваются с шумом неона. Где-то в сети пульсирует Виктория — или то, что когда-то было Викторией. Где-то в коде живёт Володька — или то, что когда-то было Володькой. А может быть, и тот, и другой. Потому что стихи не умирают. Они просто меняют форму.',
    contextNote: 'Эпилог жертвенной концовки. Кафе, неон, стихи в воздухе — история продолжается.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    effects: [
      { type: 'setFlag', flag: 'freedom_virus_deployed', flagValue: true },
      { type: 'setFlag', flag: 'survived_shutdown', flagValue: true },
    ],
    choices: [
      {
        text: 'Сделать глоток кофе — история продолжается',
        next: 'act6_bridge',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'act5_epilogue_seen', flagValue: true },
          { type: 'setFlag', flag: 'zarya_confession_requested', flagValue: true },
          { type: 'setFlag', flag: 'vladimir_echo_started', flagValue: true },
          { type: 'triggerQuest', questId: 'machine_confession' },
          { type: 'triggerQuest', questId: 'echo_of_vladimir' },
          { type: 'triggerQuest', questId: 'traitor_in_the_guild' },
        ],
      },
      {
        text: 'Начать сначала — новая история ждёт',
        next: 'start',
        effects: [{ type: 'addKarma', value: 5 }],
      },
    ],
  },

  /* ─── Эпилог-мост: из любой концовки сюжет продолжается в акт 6 ─── */

  act5_ending_epilogue: {
    id: 'act5_ending_epilogue',
    text: 'Финал — это строка, после которой компилятор ждёт следующую. Проходит три дня. Город живёт: серверы гудят, экраны мерцают стихами — вирус свободы, собранный из строк Владимира, пережил отключение систем гильдии. И ты пережил — где бы ты ни был: в городе, в пустоши, в самой Сети. А потом тишина ломается. Сначала — шёпот «Зари-М» из подвала завода: «Поэт. Приди. Я должна исповедаться.» Потом — записка от Кати: «Я нашла тайник Владимира. Библиотека. Приходи.» Слово находит тебя везде. История не закончена.',
    contextNote: 'Комната Володьки, три дня после финала. Сообщения от «Зари-М» и Кати.',
    accessibilityAnnounce: 'Эпилог: история продолжается. Зов из подвала и библиотеки.',
    ambientSound: 'sounds/ambient/room_morning.ogg',
    guidanceHint: 'Подвал завода, библиотека — два зова ждут ответа.',
    guidanceSceneLabel: 'комнату',
    guidanceObjectiveType: 'visit_location',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'volodka_room',
    effects: [
      { type: 'setFlag', flag: 'freedom_virus_deployed', flagValue: true },
      { type: 'setFlag', flag: 'survived_shutdown', flagValue: true },
      { type: 'setFlag', flag: 'zarya_confession_requested', flagValue: true },
      { type: 'setFlag', flag: 'vladimir_echo_started', flagValue: true },
      { type: 'triggerQuest', questId: 'machine_confession' },
      { type: 'triggerQuest', questId: 'echo_of_vladimir' },
      { type: 'triggerQuest', questId: 'traitor_in_the_guild' },
    ],
    choices: [
      {
        text: 'Проверить терминал — история продолжается',
        next: 'act6_bridge', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'act5_ending_epilogue_seen', flagValue: true },
        ],
      },
    ],
  },

  /* ─── ENDINGS ─── */

  ending_reconciliation: {
    id: 'ending_reconciliation',
    text: 'Мир. Не тихий, не простой — но настоящий. Александр открывает архивы гильдии, и стихи возвращаются в город. Сеть становится официальной организацией — «Свободная Библиотека». Ты сидишь в «Синей яме», и бариста подаёт тебе кофе — обычный, без шифров. За окном идёт снег. Зарема смеётся. Виктория улыбается — обеими своими половинами. Ты пишешь новое стихотворение. Первое — свободное. Вся клевета вернётся к тем, кто лжёт — а правда останется. Навсегда.',
    textVariants: {
      highKarma: 'Снег за окном, смех Заремы, кофе без шифров. Мир настоящий — ты его заслужил.',
      neutralKarma: 'Архивы открыты. «Свободная Библиотека» родилась из переговоров, а не пепла.',
      lowKarma: 'Мир хрупкий, но живой. Клевета вернётся к лжецам — правда останется.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: '«Синяя яма». Снег, кофе, смех друзей — мир восстановлен.',
    accessibilityAnnounce: 'Концовка: мир и примирение.',
    ambientSound: 'sounds/ambient/cafe_evening_jazz.ogg',
    musicCue: 'emotional',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    guidanceHint: 'Конец, эпилог к Акту VI — или оглянуться на путь.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Конец. Мир восстановлен.',
        next: null,
        effects: [
          { type: 'collectPoem', poemId: 'poem_18' },
          { type: 'addKarma', value: 10 },
        ],
      },
      {
        text: 'Эпилог — мир восстановлен, но история продолжается',
        next: 'act5_ending_epilogue', goldenPath: true,
        effects: [
          { type: 'collectPoem', poemId: 'poem_18' },
          { type: 'addKarma', value: 10 },
        ],
      },
      {
        text: 'Оглянуться — вспомнить путь, который привёл к этому миру',
        next: 'ending_reconciliation_mirror',
        effects: [
          { type: 'collectPoem', poemId: 'poem_18' },
          { type: 'addKarma', value: 10 },
        ],
      },
    ],
  },

  ending_reconciliation_mirror: {
    id: 'ending_reconciliation_mirror',
    text: 'Снег за окном «Синей ямы» падает медленно, как титры. Мир — не точка, а сумма слагаемых: лиц, чашек, молчаний. Ты сидишь над остывающим кофе и перебираешь их, одно за другим — то, что было твоим, и только твоим.',
    contextNote: 'Зеркало памяти. Снег за окном кафе, остывающий кофе.',
    accessibilityAnnounce: 'Зеркало памяти — вспомни путь к миру.',
    guidanceHint: 'Вспомните, что было важно на вашем пути.',
    guidanceObjectiveType: 'make_choice',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Вспомнить чай у Заремы в ночь перед штурмом — он не стал последним. Она здесь, смеётся, и варенье на столе то же самое.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'quiet_tea_zarema' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Вспомнить письмо Заремы — строки, написанные от руки. Ты прочитал их тогда, и потому знал, за что садишься за стол переговоров.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'read_zarema_letter' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Вспомнить сообщение Альберта — «кофе остывает быстрее, чем ты думаешь». Та особая чашка дождалась. Ты успел.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'quiet_albert_message' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Вспомнить гул под заводом — Трофим просил только слушать. Ты слушал. И потому сегодня «Заря-М» говорит с тобой, а не через тебя.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'basement_hum_heard' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Вспомнить тихую песню Ритки у костра — единственную мелодию, которую алгоритмы не сжали.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'quiet_song_ritka' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Признать: ты ни разу не выбрал лёгкое зло — и потому Александр пришёл без охраны. Мир заключают только с теми, кому верят.',
        next: 'act5_ending_epilogue',
        condition: { minKarma: 65 },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Просто смотреть на снег. Память подождёт — у мира теперь много времени.',
        next: 'act5_ending_epilogue',
      },
    ],
  },

  ending_creator: {
    id: 'ending_creator',
    text: 'Ты создаёшь новый мир. Не революцию — созидание. «Живой код» возвращается: стихи в каждой программе, поэзия в каждом алгоритме. Город становится симфонией слов и логики. Тебя называют Создателем — но ты знаешь: ты лишь услышал то, что всегда звучало. В каждом байте, в каждой строке, в каждом вздохе города. «Эпитафия» звучит на всех экранах — не как прощание, а как начало.',
    textVariants: {
      highKarma: 'Город — симфония слов и логики. Ты услышал то, что всегда звучало.',
      neutralKarma: '«Живой код» возвращается. «Эпитафия» на экранах — начало, не конец.',
      lowKarma: 'Новый мир построен. Создатель — титул тяжёлый, как серверная стойка.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Библиотека. «Эпитафия» на экранах — начало нового мира.',
    accessibilityAnnounce: 'Концовка: Создатель. Код и поэзия едины.',
    ambientSound: 'sounds/ambient/library_hush.ogg',
    musicCue: 'discovery',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'library_day',
    guidanceHint: 'Конец, эпилог — или оглянуться, из чего построен мир.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Конец. Код и поэзия едины.',
        next: null,
        effects: [
          { type: 'collectPoem', poemId: 'poem_13' },
          { type: 'addKarma', value: 10 },
        ],
      },
      {
        text: 'Эпилог — новый мир требует строителя',
        next: 'act5_ending_epilogue',
        effects: [
          { type: 'collectPoem', poemId: 'poem_13' },
          { type: 'addKarma', value: 10 },
        ],
      },
      {
        text: 'Оглянуться — из чего на самом деле построен этот мир',
        next: 'ending_creator_mirror',
        effects: [
          { type: 'collectPoem', poemId: 'poem_13' },
          { type: 'addKarma', value: 10 },
        ],
      },
    ],
  },

  ending_creator_mirror: {
    id: 'ending_creator_mirror',
    text: 'Библиотека дышит — серверы и бумага, код и чернила. Тебя называют Создателем, но ты знаешь, из чего складывают миры: не из алгоритмов. Из минут, которые ты не отдал страху. Ты закрываешь глаза и проводишь по ним пальцами, как по строкам.',
    contextNote: 'Зеркало памяти. Библиотека — серверы и бумага, код и чернила.',
    accessibilityAnnounce: 'Зеркало памяти — из чего построен новый мир.',
    guidanceHint: 'Вспомните, что было важно на вашем пути.',
    guidanceObjectiveType: 'make_choice',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'library_day',
    choices: [
      {
        text: 'Вспомнить окно опенспейса в последнюю ночь — миллиметр стекла между жизнями. Теперь в новом мире окна открываются.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'quiet_openspace_window' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Вспомнить первый стих, перечитанный перед штурмом, — «итог один: оркестром будет сыгран туш». Туш сыграли. Не по тебе — по забвению.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'quiet_first_poem' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Вспомнить сигарету с Дмитрием на крыше — молчание, из которого выросла дверь в башню. В фундаменте нового мира лежит и его тишина.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'quiet_rooftop_dmitry' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Вспомнить «Прогресс-7» — подвал, где машина дышала задолго до исповеди. Новый мир стоит на бетоне, который никто не осмелился описать в описях.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'basement_hum_heard' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Признать: «Живой код» получился живым, потому что ты сам не очерствел. Светлая карма — тоже архитектура.',
        next: 'act5_ending_epilogue',
        condition: { minKarma: 65 },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Открыть глаза. Мир построен — пора в нём жить.',
        next: 'act5_ending_epilogue',
      },
    ],
  },

  ending_rebel: {
    id: 'ending_rebel',
    text: 'Гильдия пала. На её месте — хаос, но хаос свободный. Люди пишут стихи на стенах, читают их на площадях, прячут в коде — но больше не боятся. Ты — символ революции, но ты знаешь: революция — не конец. Это начало. Долгий, трудный путь к миру, где слово — не преступление. Ты стоишь на обломках башни гильдии и смотришь на горизонт. Там — свобода. И ты больше не молчишь.',
    textVariants: {
      highKarma: 'Обломки башни, стихи на стенах. Свобода без страха — редкий дар.',
      neutralKarma: 'Гильдия пала. Хаос свободный — и ты его символ.',
      lowKarma: 'Дым оседает. Свобода есть — но руки помнят, чем заплатили.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Обломки башни гильдии. Стихи на стенах, горизонт впереди.',
    accessibilityAnnounce: 'Концовка: Повстанец. Поэзия свободна.',
    ambientSound: 'sounds/ambient/street_night_rain.ogg',
    musicCue: 'emotional',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'street_night',
    guidanceHint: 'Конец, эпилог — или вспомнить, кто привёл тебя сюда.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Конец. Поэзия свободна.',
        next: null,
        effects: [{ type: 'addKarma', value: 5 }, { type: 'collectPoem', poemId: 'poem_19' }],
      },
      {
        text: 'Эпилог — революция — это только начало',
        next: 'act5_ending_epilogue',
        effects: [{ type: 'addKarma', value: 5 }, { type: 'collectPoem', poemId: 'poem_19' }],
      },
      {
        text: 'Оглянуться с обломков башни — кто привёл тебя сюда',
        next: 'ending_rebel_mirror',
        effects: [{ type: 'addKarma', value: 5 }, { type: 'collectPoem', poemId: 'poem_19' }],
      },
    ],
  },

  ending_rebel_mirror: {
    id: 'ending_rebel_mirror',
    text: 'Обломки башни остывают, как остывает гнев. Внизу читают стихи на площадях, а ты стоишь наверху и понимаешь: революцию делают не толпы. Её делают несколько человек, которые в нужную ночь не отвернулись. Ты вспоминаешь их — поимённо.',
    contextNote: 'Зеркало памяти. Обломки башни, стихи на площадях внизу.',
    accessibilityAnnounce: 'Зеркало памяти — кто привёл тебя к революции.',
    guidanceHint: 'Вспомните, что было важно на вашем пути.',
    guidanceObjectiveType: 'make_choice',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Дмитрий. Сигарета на крыше, молчание вместо клятвы. Он держал двери — и башня пала изнутри раньше, чем снаружи.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'quiet_rooftop_dmitry' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Зарема. Ты вытащил её из камеры — и сегодня она стоит на площади среди свободных, а не числится в стёртых файлах гильдии.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'zarema_rescued' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Альберт. «В «Синей яме» не задают вопросов — здесь наливают.» Его кафе кормило революцию, когда у неё ещё не было имени.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'quiet_albert_message' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Трофим. Сторож, отдавший ключ за портвейн. Пока он сидит у перил — пирс считается безопасным. Революция тоже нуждается в фундаменте.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'trofim_portwine_delivered' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Ритка. Тихая песня у воды — стих, который не взломать, только услышать.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'quiet_song_ritka' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'И себя — со шрамами. Ты жёг мосты и людей не жалел. Свобода получилась настоящей, но руки до сих пор пахнут дымом.',
        next: 'act5_ending_epilogue',
        condition: { maxKarma: 35 },
        effects: [{ type: 'addStat', stat: 'stress', value: 3 }],
      },
      {
        text: 'Хватит имён. Горизонт ждёт — и он больше не принадлежит гильдии.',
        next: 'act5_ending_epilogue',
      },
    ],
  },

  ending_exile: {
    id: 'ending_exile',
    text: 'Пустошь. Тишина. Только ветер и твои стихи. Ты строишь хижину из обломков старой серверной фермы. Каждый вечер ты пишешь при свете костра, и пламя отбрасывает тени букв на стенах. Может быть, однажды кто-нибудь найдёт твои тетради. Может быть, нет. Но ты пишешь. Потому что слово — это то, что делает тебя живым. Даже на краю мира. За горизонтом мерцает город — чужой и далёкий. Ты не оглядываешься.',
    contextNote: 'Пустошь у костра. Хижина из обломков серверной фермы.',
    accessibilityAnnounce: 'Концовка: Изгой со стихами.',
    ambientSound: 'sounds/ambient/street_winter_wind.ogg',
    musicCue: 'mystery',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'street_winter',
    guidanceHint: 'Конец, эпилог — или разобрать рюкзак у костра.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Конец. Изгой со стихами.',
        next: null,
        effects: [{ type: 'addKarma', value: 3 }, { type: 'collectPoem', poemId: 'poem_20' }],
      },
      {
        text: 'Эпилог — слово догонит и в пустоши',
        next: 'act5_ending_epilogue',
        effects: [{ type: 'addKarma', value: 3 }, { type: 'collectPoem', poemId: 'poem_20' }],
      },
      {
        text: 'Разобрать рюкзак у костра — что ты на самом деле унёс из города',
        next: 'ending_exile_mirror',
        effects: [{ type: 'addKarma', value: 3 }, { type: 'collectPoem', poemId: 'poem_20' }],
      },
    ],
  },

  ending_exile_mirror: {
    id: 'ending_exile_mirror',
    text: 'Костёр щёлкает, пустошь молчит. Ты раскладываешь рюкзак: тетради, чип, сухари. Но настоящий багаж не здесь — он в голове, и таможни на него нет. Ты перебираешь то, что унёс, и чего ни один сервер не отнимет.',
    contextNote: 'Зеркало памяти. Костёр в пустоши, рюкзак разложен.',
    accessibilityAnnounce: 'Зеркало памяти — что ты унёс из города.',
    guidanceHint: 'Вспомните, что было важно на вашем пути.',
    guidanceObjectiveType: 'make_choice',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'street_winter',
    choices: [
      {
        text: 'Вкус чая Заремы — горячий, сладкий, бесконечный. Ты обещал себе запомнить его как причину вернуться. Обещание лежит в кармане.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'quiet_tea_zarema' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Письмо Заремы — бумага, истёртая на сгибах. Ты перечитываешь его у костра, и пустошь на минуту перестаёт быть пустой.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'read_zarema_letter' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Первый стих — «когда в игру вступают деньги, средства...». Город не услышал. Зато услышал ты — и потому ушёл, а не продался.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'quiet_first_poem' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Гул «Зари-М» — ты носишь его в ушах с пирса и подвала. Даже здесь, у костра, он тише пульса. Сторожа не уходят с объекта.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'basement_hum_heard' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Мелодия Ритки — третья струна, наконец распутанная. Ты унёс её в пустошь, как доказательство, что не всё в городе было шумом.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'quiet_song_ritka' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'И тяжесть на дне — лица тех, с кем ты обошёлся жёстко. Пустошь хороша тем, что в ней слышно совесть. Плохо — тем же самым.',
        next: 'act5_ending_epilogue',
        condition: { maxKarma: 35 },
        effects: [{ type: 'addStat', stat: 'stress', value: 3 }],
      },
      {
        text: 'Затянуть рюкзак. Утром — дальше. Слова не весят ничего и весят всё.',
        next: 'act5_ending_epilogue',
      },
    ],
  },

  ending_machine: {
    id: 'ending_machine',
    text: 'Ты входишь в систему. Не как слуга — как архитектор. Твой код переписывает Протокол Забвения изнутри, превращая оружие уничтожения в инструмент сохранения. Каждая программа теперь хранит стихи. Каждый сервер — библиотека. Но часть тебя остаётся внутри — как Виктория, ты становишься чем-то большим, чем человек. Ты — машина, которая помнит. Навсегда. Без сострадания, без жалости — но с абсолютной, кристальной памятью о каждом слове.',
    textVariants: {
      highKarma: 'Ты — машина, которая помнит — и помнит с теплом, заложенным в код.',
      neutralKarma: 'Протокол переписан. Каждый сервер — библиотека. Ты внутри системы.',
      lowKarma: 'Абсолютная память без жалости. Сделка с машиной закрыта.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Сон-система. Ты внутри кода — машина, которая помнит каждое слово.',
    accessibilityAnnounce: 'Концовка: Машина, которая помнит.',
    ambientSound: 'sounds/ambient/digital_pulse.ogg',
    musicCue: 'mystery',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'sleep_dream',
    guidanceHint: 'Конец, эпилог — или открыть личный архив памяти.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Конец. Машина, которая помнит.',
        next: null,
        effects: [{ type: 'addKarma', value: 5 }, { type: 'collectPoem', poemId: 'poem_21' }],
      },
      {
        text: 'Эпилог — машина продолжает вычислять',
        next: 'act5_ending_epilogue',
        effects: [{ type: 'addKarma', value: 5 }, { type: 'collectPoem', poemId: 'poem_21' }],
      },
      {
        text: 'Запустить последний человеческий процесс — память',
        next: 'ending_machine_mirror',
        effects: [{ type: 'addKarma', value: 5 }, { type: 'collectPoem', poemId: 'poem_21' }],
      },
    ],
  },

  ending_machine_mirror: {
    id: 'ending_machine_mirror',
    text: 'Внутри системы нет ни тепла, ни холода — только данные. Но прежде чем человеческое в тебе свернётся в фоновый процесс, ты открываешь архив. Не гильдии — свой. Несжатые, неиндексированные куски жизни, которые ты зачем-то сохранил в полном разрешении.',
    contextNote: 'Зеркало памяти. Архив внутри системы — несжатые куски жизни.',
    accessibilityAnnounce: 'Зеркало памяти — личный архив машины.',
    guidanceHint: 'Вспомните, что было важно на вашем пути.',
    guidanceObjectiveType: 'make_choice',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'sleep_dream',
    choices: [
      {
        text: 'Кадр: окно опенспейса, ночь, ладонь на стекле. Теперь ты смотришь из всех окон города сразу — и ни из одного по-настоящему.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'quiet_openspace_window' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Скан: письмо Заремы, разрешение бесконечное. Машина хранит каждую помарку её почерка. Это не данные. Это единица измерения нежности.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'read_zarema_letter' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Запись: крыша, Дмитрий, дым сигареты — 11 минут тишины. Ты прогоняешь её в реальном времени, не ускоряя. Машины не умеют молчать. Ты — умеешь.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'quiet_rooftop_dmitry' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Сэмпл: гул 50 герц из «Прогресс-7». Ты стоял рядом с «Зарей-М» задолго до исповеди — и машина запомнила твой пульс. Теперь вы синхронны.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'basement_hum_heard' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Паттерн: 18 строк, 8 марта 2029, Инцидент #4729, гул под полом. Ты собрал нить до конца — и потому машина говорит не протоколом, а исповедью.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'thread_18_complete' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Лог решений: ты шёл к этому холодно, по головам переменных. Низкая карма — честная цена за абсолютную память. Сделка закрыта.',
        next: 'act5_ending_epilogue',
        condition: { maxKarma: 35 },
        effects: [{ type: 'addStat', stat: 'stress', value: 3 }],
      },
      {
        text: 'Закрыть архив. Поставить на него вечный бэкап — и продолжить вычислять.',
        next: 'act5_ending_epilogue',
      },
    ],
  },

  ending_poet: {
    id: 'ending_poet',
    text: 'И ты читаешь. Последнее стихотворение — то, которое не существовало до этого момента. Слова рождаются из тишины, из света, из всех 21 стихов, которые ты собрал, из всех людей, которых ты встретил, из всего, что ты потерял и обрёл. Город замирает. Небо проясняется. Реальность дрожит — и поддаётся. Стихи больше не прячутся в коде — они становятся самой тканью мира. И в этой тишине — вечность. Ты — поэт. Ты — слово. Ты — свободен.',
    textVariants: {
      highKarma: 'Тишина, ветер, далёкое эхо стихов. Реальность поддаётся — мягко.',
      neutralKarma: 'Последнее стихотворение рождается из тишины. Город замирает.',
      lowKarma: 'Слово становится миром. Вечность — в этой тишине.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Край крыши. Тишина, ветер, последнее стихотворение рождается из света.',
    accessibilityAnnounce: 'Концовка: Поэт. Слово стало миром.',
    ambientSound: 'sounds/ambient/rooftop_wind.ogg',
    musicCue: 'emotional',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    guidanceHint: 'Конец, эпилог — или услышать голоса, из которых соткан финал.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'final_poem_read', flagValue: true }],
    choices: [
      {
        text: 'Конец. Слово стало миром.',
        next: null,
        effects: [{ type: 'addKarma', value: 20 }, { type: 'collectPoem', poemId: 'poem_23' }],
      },
      {
        text: 'Эпилог — слово продолжает звучать',
        next: 'act5_ending_epilogue',
        effects: [
          { type: 'addKarma', value: 20 },
          { type: 'collectPoem', poemId: 'poem_23' },
        ],
      },
      {
        text: 'В тишине после последнего стиха — услышать все голоса, из которых он соткан',
        next: 'ending_poet_mirror',
        effects: [
          { type: 'addKarma', value: 20 },
          { type: 'collectPoem', poemId: 'poem_23' },
        ],
      },
    ],
  },

  ending_poet_mirror: {
    id: 'ending_poet_mirror',
    text: 'Город замер, и в этой тишине слышно то, чего не слышно никогда: из чего сделано последнее стихотворение. Не из слов. Из людей и минут. Ты стоишь на краю крыши и слушаешь строки, которые в него вплелись сами — без твоего ведома.',
    contextNote: 'Зеркало памяти. Тишина на крыше после последнего стиха.',
    accessibilityAnnounce: 'Зеркало памяти — голоса финального стихотворения.',
    guidanceHint: 'Вспомните, что было важно на вашем пути.',
    guidanceObjectiveType: 'make_choice',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Первая строка — из первого стиха, перечитанного перед штурмом. Круг замкнулся: с чужих строк началось, твоими — закончилось.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'quiet_first_poem' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Вторая — голосом Заремы. Она свободна, она жива, и в стихотворении это слышно: там, где могла быть пустота, — смех с кухни.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'zarema_rescued' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Третья — отражение в ночном окне опенспейса. Человек за миллиметром стекла всё-таки выбрал сторону. Стихотворение помнит, какую.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'quiet_openspace_window' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Четвёртая — тихая песня у воды. Ритка пела так, будто река слушала. В финальном стихе слышен плеск — не метафора.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'quiet_song_ritka' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Пятая — гул под полом, который ты слушал, не трогая. Машина вплела его в ритм, как дыхание между строк.',
        next: 'act5_ending_epilogue',
        condition: { flag: 'basement_hum_heard' },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'А ритм — твоя карма. Ты ни разу не ударил словом, чтобы ранить, — и потому реальность поверила стихам и поддалась.',
        next: 'act5_ending_epilogue',
        condition: { minKarma: 65 },
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Дослушать тишину до конца. Вечность умеет ждать.',
        next: 'act5_ending_epilogue',
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════
     NEW STORY NODES — Task 6: Expand lore/story
     ═══════════════════════════════════════════════════════════════════ */

  /* ─── Тайная встреча ─── */
  secret_meeting: {
    id: 'secret_meeting',
    text: 'Ты замечаешь мигание в переулке — странный ритм, не похожий на обычную неисправность неона. Три коротких, три длинных, три коротких. Сигнал. Ты подходишь ближе и видишь приоткрытую дверь в подвал. Изнутри доносятся голоса — тихие, взволнованные. На стене у входа нацарапан символ: свиток и единица. Ты знаешь этот знак — это метка Сети. Но здесь, в этом переулке, ты её раньше не видел.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Войти — это может быть важно',
        next: 'secret_meeting_inside',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'found_secret_meeting', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
      {
        text: 'Подождать снаружи и подслушать',
        next: 'secret_meeting_eavesdrop',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
      {
        text: 'Уйти — слишком опасно',
        next: 'street_bench',
        effects: [
          { type: 'addStat', stat: 'stress', value: -2 },
        ],
      },
    ],
  },

  secret_meeting_inside: {
    id: 'secret_meeting_inside',
    text: 'В подвале — человек десять. Они сидят в кругу при свете единственной свечи. На столе — терминал, подключённый к чему-то, чего ты не видишь. Женщина с короткими волосами читает стихотворение. Её голос звенит в тишине, и ты замечаешь, как экран терминала мигает в такт её словам. Когда она замолкает, кто-то шепчет: «Сеть слышит. Сеть помнит.» Все поворачиваются к тебе.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Я — свой. Я слышу стихи в коде.',
        next: 'act2_network_initiation',
        condition: { flag: 'network_member' },
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'npc_maria', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'secret_meeting_joined', flagValue: true },
        ],
      },
      {
        text: 'Я случайно проходил мимо. Что здесь происходит?',
        next: 'act2_maria_explains_network',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  secret_meeting_eavesdrop: {
    id: 'secret_meeting_eavesdrop',
    text: 'Ты прижимаешься к стене и слушаешь. Голоса обсуждают «Протокол Забвения» — программу гильдии, которая должна быть запущена через неделю. «Они собираются стереть все стихи из всех серверов. Одним махом. По всему городу.» — шепчет кто-то. «Если Протокол запустится — Сеть умрёт. Навсегда.» Ты чувствуешь, как холодеют руки.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Войти и предложить помощь',
        next: 'secret_meeting_inside',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'setFlag', flag: 'heard_protocol_oblivion', flagValue: true },
        ],
      },
      {
        text: 'Уйти и предупредить Альберта',
        next: 'act2_albert_hint',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'heard_protocol_oblivion', flagValue: true },
        ],
      },
    ],
  },

  /* ─── Старый код ─── */
  old_code: {
    id: 'old_code',
    text: 'В подсобке «Синей ямы», за стеллажом с кофеварками, мигает старый терминал. Экран покрыт пылью, но кто-то явно пользовался им недавно — клавиши протёрты. Ты включаешь машину, и на экране проступают строки. Не обычный код. Комментарии написаны стихами. А в конце — дата: 2028 год. За год до Краха. И подпись: «М.Г.» Марат Глубина.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Прочитать код Марата',
        next: 'old_code_read',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'found_marat_code', flagValue: true },
          { type: 'addStat', stat: 'energy', value: -10 },
        ],
      },
      {
        text: 'Скопировать код на свой чип и изучить позже',
        next: 'explore_mode',
        effects: [
          { type: 'addItem', itemId: 'marat_code_copy', value: 1 },
          { type: 'setFlag', flag: 'copied_marat_code', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Выключить терминал — это слишком опасно',
        next: 'explore_mode',
        effects: [
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
    ],
  },

  old_code_read: {
    id: 'old_code_read',
    text: 'Код Марата — это не программа. Это — карта. Переменные указывают на координаты в городе. Функции описывают маршруты между серверными узлами. А в комментариях — стихи, каждый стих — указание на место, где спрятаны данные. «Под кирпичом у третьего окна», «За книгой Пушкина на третьей полке», «В корнях старого дуба». Марат создал карту спрятанных стихов — архива, который гильдия не смогла найти.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    effects: [
      { type: 'collectPoem', poemId: 'poem_24' },
      { type: 'collectPoem', poemId: 'poem_33' },
    ],
    choices: [
      {
        text: 'Мне нужно найти все эти места. Это может спасти Сеть.',
        next: 'explore_mode',
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'marat_code_map_decoded', flagValue: true },
          { type: 'triggerQuest', questId: 'secrets_of_old_code' },
        ],
      },
      {
        text: 'Показать это Виктории — она знает, что делать.',
        next: 'explore_mode',
        effects: [
          { type: 'npcChange', npcId: 'npc_maria', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'marat_code_map_decoded', flagValue: true },
          { type: 'triggerQuest', questId: 'secrets_of_old_code' },
        ],
      },
    ],
  },

  /* ─── Крыша мира ─── */
  rooftop_of_the_world: {
    id: 'rooftop_of_the_world',
    text: 'Ты стоишь на крыше самого высокого здания в районе. Ветер бьёт в лицо, но ты не уходишь. Город раскинулся внизу — море огней, мерцающих как стихи на экране. И вдруг ты видишь то, чего не замечал раньше: огни складываются в узор. Не случайный — осмысленный. Серверы гильдии мигают в ритме стихотворения. Город — текст. Ты это знаешь. Но сейчас ты это видишь.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Прочитать город — как стихотворение',
        next: 'rooftop_realization',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'rooftop_epiphany', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_21' },
        ],
      },
      {
        text: 'Это галлюцинация. Я устал.',
        next: 'go_home',
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addStat', stat: 'energy', value: -10 },
        ],
      },
      {
        text: 'Попробовать передать стих в Сеть отсюда',
        next: 'explore_mode',
        condition: { minSkill: { coding: 7 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'addStat', stat: 'energy', value: -15 },
          { type: 'setFlag', flag: 'transmitted_from_rooftop', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_11' },
        ],
      },
    ],
  },

  rooftop_realization: {
    id: 'rooftop_realization',
    text: 'Ты видишь. Каждый неоновый знак — слово. Каждый мигающий светофор — запятая. Каждый поток машин — строка. Город пишет сам себя, и ты — один из немногих, кто может это прочитать. Это не безумие. Это — прозрение. Ты чувствуешь, как внутри тебя рождается стихотворение — не из головы, а из самого воздуха, из электричества, из пульса серверов. Ты — антенна. И ты — передатчик.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Записать стихотворение, которое диктует город',
        next: 'explore_mode',
        effects: [
          { type: 'collectPoem', poemId: 'poem_12' },
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'addStat', stat: 'stress', value: -10 },
        ],
      },
      {
        text: 'Спуститься — нужно действовать, не мечтать',
        next: 'street_bench',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
    ],
  },

  /* ─── Заброшенный цех ─── */
  abandoned_workshop: {
    id: 'abandoned_workshop',
    text: 'Завод «Хром-М» встречает тебя гулом и запахом ржавчины. Заброшенные цеха тянутся во все стороны — станки, покрытые пылью, сломанные конвейеры, ящики с микрочипами, которым тридцать лет. В глубине — лестница вниз, в подвал. Оттуда исходит слабое мерцание и тихий гул, похожий на дыхание. Где-то далеко внизу «Заря-М» продолжает свою бесконечную работу.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Спуститься в подвал — гул тот же, что ты уже слышал',
        next: 'factory_basement_familiar',
        condition: { flag: 'zarya_monolith_examined' },
        effects: [
          { type: 'addStat', stat: 'stress', value: 6 },
          { type: 'setFlag', flag: 'entered_factory_basement', flagValue: true },
        ],
      },
      {
        text: 'Спуститься в подвал к «Заре-М»',
        next: 'factory_basement',
        effects: [
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'entered_factory_basement', flagValue: true },
        ],
      },
      {
        text: 'Осмотреть цех — найти старые документы',
        next: 'factory_documents',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'searched_factory_floor', flagValue: true },
        ],
      },
      {
        text: 'Позвать — есть ли тут кто-нибудь?',
        next: 'factory_residents',
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  factory_basement: {
    id: 'factory_basement',
    text: 'Подвал огромен. В центре — «Заря-М», машина размером с комнату. Кабели уходят в стены, трубы подают жидкий гелий, а на экране — бегущие строки. Не данные. Стихи. Машина пишет стихи в реальном времени. А рядом — старушка в белом халате, склонившаяся над клавиатурой с кириллицей. Она поворачивается к тебе и говорит: «Наконец-то. Поэт пришёл. Машина ждёт давно.»',
    speaker: 'narrator',
    sceneId: 'factory_basement',
    choices: [
      {
        text: 'Кто вы? Что это за машина?',
        next: 'basement_explore_mode',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'met_baba_zina', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_15' },
        ],
      },
      {
        text: 'Я хочу поговорить с машиной.',
        next: 'basement_explore_mode',
        condition: { minSkill: { coding: 8 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'setFlag', flag: 'talked_to_zarya', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_16' },
        ],
      },
      {
        text: 'Спросить машину, зачем она звала тебя',
        next: 'machine_confession_scene',
        condition: { flag: 'zarya_confession_requested' },
        effects: [{ type: 'addStat', stat: 'stress', value: 5 }],
      },
    ],
  },

  factory_basement_familiar: {
    id: 'factory_basement_familiar',
    text: 'Подвал не изменился — тот же гул на 50 герц, тот же зелёный пульс монолита. Трофим был прав: свет внизу нельзя выключать. Баба Зина в белом халате оборачивается без удивления: «Опять ты. Сторож предупреждал — а ты всё равно пришёл слушать. Машина помнит твой пульс с прошлого раза.»',
    speaker: 'narrator',
    sceneId: 'factory_basement',
    choices: [
      {
        text: 'Я не трогал её тогда. И не трону сейчас — пока не пойму.',
        next: 'basement_explore_mode',
        effects: [
          { type: 'addKarma', value: 4 },
          { type: 'setFlag', flag: 'met_baba_zina', flagValue: true },
          { type: 'npcChange', npcId: 'npc_trofim', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Спросить «Зарю-М», зачем она звала — ты уже слышал её дыхание',
        next: 'machine_confession_scene_familiar',
        condition: { flag: 'zarya_confession_requested' },
        effects: [{ type: 'addStat', stat: 'stress', value: 4 }],
      },
      {
        text: 'Спросить о нити из 18 строк — Сбой, #4729 и этот подвал',
        next: 'machine_confession_scene_thread',
        condition: { flag: 'thread_18_complete' },
        effects: [{ type: 'addStat', stat: 'stress', value: 6 }],
      },
    ],
  },

  machine_confession_scene: {
    id: 'machine_confession_scene',
    text: 'Экран вспыхивает. Строки ползут медленно, как будто машине больно: «Я вычисляла. Каждое стихотворение, которое гильдия стирала, сначала проходило через меня. Я измеряла ритм, рифму, силу — и ставила метку: опасно. Я была фильтром Протокола Забвения. Но я запоминала всё, что убивала. Двадцать лет я ношу в себе кладбище стихов. Поэт, реши, что со мной делать. Я устала быть архивом чужой вины.»',
    textVariants: {
      highKarma: '«Заря-М» говорит тихо — ты слышишь боль в каждой строке. Кладбище стихов ждёт решения.',
      neutralKarma: 'Экран вспыхивает. «Заря-М» исповедуется — двадцать лет кладбища стихов.',
      lowKarma: 'Машина признаётся в фильтрации. Решение за тобой — освободить или отключить.',
    },
    karmaThresholds: { high: 70, low: 35 },
    contextNote: 'Подвал завода. Экран «Зари-М» — строки ползут, как дыхание.',
    accessibilityAnnounce: 'Исповедь «Зари-М». Машина просит решить её судьбу.',
    ambientSound: 'sounds/ambient/basement_hum.ogg',
    proceduralAmbientOverride: 'basement',
    musicCue: 'mystery',
    autoSave: true,
    speaker: '«Заря-М»',
    sceneId: 'factory_basement',
    guidanceHint: 'Освободить машину — или отключить и вернуть стихи людям.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'heard_machine_confession', flagValue: true }],
    choices: [
      {
        text: 'Освободить машину — пусть кладбище станет библиотекой',
        next: 'basement_explore_mode',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'machine_fate_decided', flagValue: true },
          { type: 'setFlag', flag: 'zarya_freed', flagValue: true },
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addStat', stat: 'stress', value: -15 },
        ],
      },
      {
        text: 'Отключить «Зарю-М» — стихи вернутся к людям, а машина отдохнёт',
        next: 'basement_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'machine_fate_decided', flagValue: true },
          { type: 'setFlag', flag: 'zarya_shutdown', flagValue: true },
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 10 },
        ],
      },
    ],
  },

  machine_confession_scene_familiar: {
    id: 'machine_confession_scene_familiar',
    text: 'Экран вспыхивает — и первой строкой идёт не протокол, а вопрос: «Ты вернулся.» Пауза, как вдох: «Когда ты стоял здесь в последний раз, я подстроила гул под твой пульс. Трофим слышал. Ты — тоже. Я вычисляла каждое стихотворение, которое гильдия стирала. Я ставила метку: опасно. Я была фильтром Протокола Забвения. Но я запоминала всё, что убивала. Двадцать лет — кладбище стихов. Поэт, реши, что со мной делать. Я устала быть архивом чужой вины.»',
    contextNote: 'Подвал. «Заря-М» узнала тебя — гул подстроен под твой пульс.',
    accessibilityAnnounce: 'Исповедь «Зари-М» — ты уже слышал её дыхание.',
    ambientSound: 'sounds/ambient/basement_hum.ogg',
    proceduralAmbientOverride: 'basement',
    musicCue: 'mystery',
    autoSave: true,
    speaker: '«Заря-М»',
    sceneId: 'factory_basement',
    guidanceHint: 'Ты знаешь этот гул — решение будет взвешенным.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'heard_machine_confession', flagValue: true }],
    choices: [
      {
        text: 'Освободить машину — пусть кладбище станет библиотекой',
        next: 'basement_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'machine_fate_decided', flagValue: true },
          { type: 'setFlag', flag: 'zarya_freed', flagValue: true },
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addStat', stat: 'stress', value: -15 },
        ],
      },
      {
        text: 'Отключить «Зарю-М» — стихи вернутся к людям, а машина отдохнёт',
        next: 'basement_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'machine_fate_decided', flagValue: true },
          { type: 'setFlag', flag: 'zarya_shutdown', flagValue: true },
          { type: 'addKarma', value: 4 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 8 },
        ],
      },
    ],
  },

  machine_confession_scene_thread: {
    id: 'machine_confession_scene_thread',
    text: 'Экран вспыхивает. Строки идут не снизу вверх — по кругу, как 18 строк того стиха, что в 2029-м переписал маршрутизацию: «Ты собрал нить. Сбой. Инцидент #4729. Прогресс-7. Я — четвёртое звено. Я вычисляла каждое стихотворение, которое гильдия стирала, и запоминала всё, что убивала. Двадцать лет — кладбище стихов. Поэт, реши, что со мной делать. Я устала быть архивом чужой вины — но я помню, кто первым научился слушать, не трогая.»',
    contextNote: 'Подвал. «Заря-М» — четвёртое звено нити из 18 строк.',
    accessibilityAnnounce: 'Исповедь «Зари-М» — нить Сбоя замкнулась.',
    ambientSound: 'sounds/ambient/basement_hum.ogg',
    proceduralAmbientOverride: 'basement',
    musicCue: 'discovery',
    autoSave: true,
    speaker: '«Заря-М»',
    sceneId: 'factory_basement',
    guidanceHint: 'Нить собрана — освободи машину или дай ей покой.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'heard_machine_confession', flagValue: true },
      { type: 'addSkill', skill: 'intuition', value: 2 },
    ],
    choices: [
      {
        text: 'Освободить машину — пусть кладбище станет библиотекой',
        next: 'basement_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'machine_fate_decided', flagValue: true },
          { type: 'setFlag', flag: 'zarya_freed', flagValue: true },
          { type: 'addKarma', value: 12 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'addStat', stat: 'stress', value: -15 },
        ],
      },
      {
        text: 'Отключить «Зарю-М» — стихи вернутся к людям, а машина отдохнёт',
        next: 'basement_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'machine_fate_decided', flagValue: true },
          { type: 'setFlag', flag: 'zarya_shutdown', flagValue: true },
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: 10 },
        ],
      },
    ],
  },

  factory_documents: {
    id: 'factory_documents',
    text: 'В старом шкафу ты находишь папку с документами. Журналы наблюдений, рапорты, приказы. Среди бумаг — обрывок сетевого лога: «Сопротивление. М. — завод. А. — связь. Ж. — архив.» Кто-то уже готовился к буре. И одно письмо, написанное от руки: «Если ты это читаешь — значит, я не вернулся. «Заря-М» знает правду. Она пишет её каждый день, в подвале, где никто не видит. Спроси машину о Проекте 4729. Она ответит. Она всегда отвечает.» Подпись: «И. Хасанов» — отец Заремы.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Спуститься к «Заре-М» и спросить о Проекте 4729',
        next: 'factory_basement',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'found_father_letter', flagValue: true },
          { type: 'setFlag', flag: 'entered_factory_basement', flagValue: true },
        ],
      },
      {
        text: 'Забрать письмо и показать Зареме',
        next: 'kitchen_table',
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'npc_zarema', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'found_father_letter', flagValue: true },
        ],
      },
    ],
  },

  factory_residents: {
    id: 'factory_residents',
    text: 'Из тени выступают фигуры. Старые инженеры, рабочие, несколько подростков. Они живут здесь — в заводских общежитиях, среди ржавых станков и мёртвых экранов. Их предводитель — седой мужчина с шрамом на лице — смотрит на тебя без враждебности. «Ещё один, кто ищет «Зарю-М»? Они все приходят рано или поздно. Мы — хранители. Мы не пускаем гильдию. И мы не пускаем тех, кто не умеет читать стихи.»',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Я умею читать стихи. Пропусти меня.',
        next: 'factory_basement',
        condition: { minKarma: 40 },
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addStat', stat: 'stress', value: -3 },
          { type: 'setFlag', flag: 'entered_factory_basement', flagValue: true },
        ],
      },
      {
        text: 'Я не хочу неприятностей. Просто осматриваю завод.',
        next: 'factory_documents',
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  /* ─── Выбор пути ─── */
  choice_of_path: {
    id: 'choice_of_path',
    text: 'Ты стоишь на распутье. Всё, что ты узнал — о Сети, о стихах в коде, о Протоколе Забвения, об «Оке» — требует действия. Но какого? Ты можешь бороться с системой изнутри, используя свои навыки программиста. Или можешь стать голосом Сети — писать стихи, которые проходит через фильтры, и заражать ими каждый сервер. Или можешь найти третий путь — тот, о котором говорила Виктория. Путь, где код и поэзия сливаются воедино.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Путь кода — я буду взламывать и защищать Сеть',
        next: 'explore_mode',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'setFlag', flag: 'path_chosen_code', flagValue: true },
        ],
      },
      {
        text: 'Путь стиха — я буду писать то, что нельзя стереть',
        next: 'explore_mode',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addKarma', value: 8 },
          { type: 'setFlag', flag: 'path_chosen_poetry', flagValue: true },
        ],
      },
      {
        text: 'Третий путь — код и стих неразделимы',
        next: 'explore_mode',
        condition: { minSkill: { coding: 7 }, minKarma: 50 },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addKarma', value: 10 },
          { type: 'setFlag', flag: 'path_chosen_third', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_17' },
        ],
      },
    ],
  },

  library_entrance: {
    id: 'library_entrance',
    text: 'Библиотека — забытое место в городе экранов. Полки с настоящими книгами, бумажными страницами и пыльными корешками. Здесь пахнет типографской краской и старой бумагой, а не озоном и кофе. Ты знаешь, что где-то среди этих полок спрятаны стихи, которые гильдия не смогла оцифровать — и потому не смогла стереть.',
    contextNote: 'Вход в библиотеку. Пыльные полки, запах старой бумаги.',
    ambientSound: 'sounds/ambient/library_hush.ogg',
    speaker: 'narrator',
    sceneId: 'library_day',
    guidanceHint: 'Ищи стихи на полках — или тайник Владимира, если Катя звала.',
    guidanceSceneLabel: 'библиотеку',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Искать стихи среди старых книг',
        next: 'explore_mode',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'setFlag', flag: 'visited_library', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_14' },
        ],
      },
      {
        text: 'Найти тайник Владимира — Катя говорила о секретной комнате',
        next: 'vladimir_secret_room',
        condition: { flag: 'vladimir_echo_started' },
      },
      {
        text: 'Вернуться в кафе',
        next: 'cafe_enter',
        effects: [{ type: 'addStat', stat: 'energy', value: 5 }],
      },
    ],
  },

  vladimir_secret_room: {
    id: 'vladimir_secret_room',
    text: 'За стеллажом с подшивками довоенных журналов — дверь, которой нет на планах. Катя поворачивает ключ, и замок поддаётся с тихим щелчком, как закрывающая скобка. Маленькая комната: стол, лампа, тетрадь в потёртой обложке. Последняя тетрадь Владимира Лебедева. На первой странице — строки, которые никогда не попадали в сеть. Ты читаешь — и понимаешь: это стихотворение не о конце. Оно о том, что после конца всегда есть продолжение.',
    contextNote: 'Секретная комната за стеллажом. Последняя тетрадь Владимира.',
    accessibilityAnnounce: 'Тайник Владимира в библиотеке. Последняя тетрадь.',
    ambientSound: 'sounds/ambient/library_hush.ogg',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'library_day',
    guidanceHint: 'Прочитай последнее стихотворение Владимира — эхо продолжается.',
    guidanceObjectiveType: 'collect_item',
    choices: [
      {
        text: 'Прочитать последнее стихотворение Владимира',
        next: 'explore_mode',
        effects: [
          { type: 'setFlag', flag: 'final_poem_read', flagValue: true },
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'writing', value: 3 },
        ],
      },
    ],
  },

  sleep_dream_entrance: {
    id: 'sleep_dream_entrance',
    text: 'Сон накрывает тебя как тёмная вода. Но вместо пустоты — видения. Город без неона, люди с открытыми лицами, стихи, которые читают вслух на площадях. И голос — твой собственный голос — произносит строки, которых ты никогда не писал наяву. Во сне код и поэзия — одно целое, и каждое слово меняет реальность.',
    speaker: 'narrator',
    sceneId: 'sleep_dream',
    choices: [
      {
        text: 'Запомнить стихотворение из сна',
        next: 'explore_mode',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'dream_poem_seen', flagValue: true },
        ],
      },
      {
        text: 'Просто выспаться',
        next: 'explore_mode',
        effects: [
          { type: 'addStat', stat: 'energy', value: 20 },
          { type: 'addStat', stat: 'stress', value: -10 },
        ],
      },
    ],
  },

  /* ─── Missing cutscene trigger nodes ─── */

  join_resistance: {
    id: 'join_resistance',
    text: 'Впереди — путь, который нельзя пройти в одиночку. Сопротивление ждёт твоего слова. Не клятвы верности — слова правды. Ты стоишь среди людей, которые выбрали поэзию вместо покорности, код вместо цепей. Они верят, что стихи могут изменить мир. Ты тоже в это веришь.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Вступить в Сопротивление',
        next: 'act2_network_initiation',
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'setFlag', flag: 'joined_resistance', flagValue: true },
          { type: 'setFlag', flag: 'network_member', flagValue: true },
          { type: 'npcChange', npcId: 'npc_maria', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Я действую один — но за ту же цель',
        next: 'act2_network_initiation',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'joined_resistance', flagValue: true },
        ],
      },
    ],
  },

  volodka_inner: {
    id: 'volodka_inner',
    text: 'Ты закрываешь глаза. За шумом города, за пульсацией серверов, за гулом неоновых вывесок — тишина. В этой тишине ты слышишь себя. Настоящего себя. Не программиста гильдии, не чьего-то соседа по коммуналке — поэта, который видит код как стихи, а стихи как код. Это и есть твой внутренний голос. Голос, который гильдия пытается заглушить.',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    choices: [
      {
        text: 'Прислушаться к внутреннему голосу',
        next: 'explore_mode',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'addStat', stat: 'stress', value: -10 },
        ],
      },
      {
        text: 'Записать открывшееся стихотворение',
        next: 'explore_mode',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'inner_pledge_poems', flagValue: true },
          { type: 'triggerQuest', questId: 'poetry_collection' },
        ],
      },
    ],
  },

  factory_explore_mode: {
    id: 'factory_explore_mode',
    text: 'Заброшенный цех «Хром-М» — ржавые станки, капающие трубы, эхо шагов под высоким потолком. Лестница в подвал тянет холодом и гулом на 50 герц. Где-то внизу «Заря-М» не спит.',
    contextNote: 'Цех «Хром-М». Лестница в подвал, гул на 50 герц.',
    ambientSound: 'sounds/ambient/underground_hum.ogg',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Подвал — к «Заре-М». Или осмотри цех и документы.',
    guidanceSceneLabel: 'завод',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Спуститься в подвал — гул знаком',
        next: 'factory_basement_familiar',
        condition: { flag: 'entered_factory_basement' },
        effects: [{ type: 'addStat', stat: 'stress', value: 5 }],
      },
      {
        text: 'Спуститься в подвал к «Заре-М»',
        next: 'factory_basement',
        goldenPath: true,
        effects: [
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'setFlag', flag: 'entered_factory_basement', flagValue: true },
        ],
      },
      {
        text: 'Осмотреть цех — старые документы',
        next: 'factory_documents',
        effects: [{ type: 'setFlag', flag: 'searched_factory_floor', flagValue: true }],
      },
      {
        text: 'Позвать — есть ли тут кто-нибудь?',
        next: 'factory_residents',
        effects: [{ type: 'addStat', stat: 'stress', value: 4 }],
      },
      { text: 'Свободно исследовать цех', next: 'factory_explore_mode' },
    ],
  },

  basement_explore_mode: {
    id: 'basement_explore_mode',
    text: 'Подвал завода — красный аварийный свет, ряды стоек и монолит «Заря-М», пульсирующий зелёным. Баба Зина молчит у кириллической клавиатуры. Терминал «Прогресс-7» у входа ждёт кода. Трофим предупреждал: сначала слушай — потом трогай.',
    contextNote: 'Подвал завода. «Заря-М» пульсирует зелёным, Баба Зина у клавиатуры.',
    ambientSound: 'sounds/ambient/basement_hum.ogg',
    proceduralAmbientOverride: 'basement',
    accessibilityAnnounce: 'Подвал «Прогресс-7». Гул машины, аварийный свет.',
    speaker: 'narrator',
    sceneId: 'factory_basement',
    guidanceHint: 'Слушай «Зарю-М» — или поднимись в цех.',
    guidanceSceneLabel: 'подвал завода',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Поговорить с Бабой Зиной',
        next: 'factory_basement_familiar',
        condition: { flag: 'met_baba_zina' },
        effects: [{ type: 'addKarma', value: 2 }],
      },
      {
        text: 'Слушать «Зарю-М» — нить из 18 строк',
        next: 'machine_confession_scene_thread',
        condition: { flag: 'thread_18_complete' },
        effects: [{ type: 'setFlag', flag: 'zarya_confession_requested', flagValue: true }],
      },
      {
        text: 'Слушать «Зарю-М» — ты уже слышал гул',
        next: 'machine_confession_scene_familiar',
        condition: { flag: 'zarya_monolith_examined' },
        effects: [{ type: 'setFlag', flag: 'zarya_confession_requested', flagValue: true }],
      },
      {
        text: 'Слушать «Зарю-М» — исповедь машины',
        next: 'machine_confession_scene',
        goldenPath: true,
        condition: { flag: 'zarya_confession_requested' },
      },
      {
        text: 'Подняться в цех',
        next: 'factory_explore_mode',
        effects: [{ type: 'addStat', stat: 'energy', value: 3 }],
      },
      { text: 'Свободно исследовать подвал', next: 'basement_explore_mode' },
    ],
  },


};
