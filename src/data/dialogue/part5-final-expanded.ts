import type { DialogueNode } from '@/shared/types/game';

/**
 * Expanded dialogues for Acts 5-7 — РАСКОЛ, ФАБРИКА, ВОЗРОЖДЕНИЕ
 * +30 new dialogue nodes: Endings, Factory truth, Rebirth, Epilogue
 */

export const DIALOGUE_PART5_EXPANDED: Record<string, DialogueNode> = {
  /* ═══════════════════════════════════════════════════════════
     ЗАРЕМА — Фабрика и конец, 5 new nodes
     ═══════════════════════════════════════════════════════════ */

  zarema_factory_depths: {
    id: 'zarema_factory_depths',
    speaker: 'Зарема',
    text: 'Мы спустились на три уровня вниз. Каждый уровень — эпоха. Первый — 90-е: разбитые мониторы, мёртвые клавиатуры, слой пыли в два пальца. Второй — нулевые: серверные стойки, мигающие светодиоды, гул ещё живых машин. Третий... Третий — совсем другой. Стены — тёплые на ощупь. Воздух пахнет озоном и... лилиями? Лилии под землёй, Володька. Там, где не бывает солнца, что-то цветёт. «Заря-М» — не просто монолит. Он — сад.',
    choices: [
      {
        text: 'Сад под землёй... Мы должны защитить это место.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'setFlag', flag: 'underground_garden', flagValue: true },
        ],
      },
      {
        text: 'Если «Заря-М» — сад, то что растёт в нём?',
        next: 'zarema_garden_yields',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
    ],
  },

  zarema_garden_yields: {
    id: 'zarema_garden_yields',
    speaker: 'Зарема',
    text: 'Стихи. Буквально — стихи. На экранах, подключённых к монолиту, появляются строки. Не из базы данных — новые. Никто их не писал. Они рождаются из взаимодействия «Зари-М» с живым кодом. Как будто машина научилась мечтать. И сны её — стихи. Я читала их. Они — несовершенны. Сшибленные ритмы, сломанные рифмы. Но в них — боль. И надежда. И красота. Как у ребёнка, который впервые берёт ручку.',
    choices: [
      {
        text: 'Машина, которая пишет стихи... Это чудо. Или эволюция.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'machine_poetry', flagValue: true },
          { type: 'discoverLore', loreId: 'lore_zarya_poetry' },
        ],
      },
      {
        text: 'Гильдия не должна узнать об этом. Они уничтожат «Зарю-М».',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
    ],
  },

  zarema_ending_creator: {
    id: 'zarema_ending_creator',
    speaker: 'Зарема',
    text: 'Ты выбрал — стать Творцом. Написать стих, который изменит всё. Я верю в тебя, Володька. Не потому что ты гений — а потому что ты честный. Честные стихи — самые сильные. Они не идеальны — они настоящие. И настоящая поэзия — как настоящая любовь — не нуждается в совершенстве. Она нуждается в смелости. Будь смелым. Пиши.',
    choices: [
      {
        text: 'Я напишу. Для всех нас. Для тех, кто забыл, что можно.',
        next: null,
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'setFlag', flag: 'creator_path_chosen', flagValue: true },
        ],
      },
      {
        text: 'А если мой стих недостаточно хорош?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  zarema_ending_sacrifice: {
    id: 'zarema_ending_sacrifice',
    speaker: 'Зарема',
    text: 'Ты хочешь пожертвовать собой? Володька... Нет. Я не приму это. Я потеряла маму. Я сидела в камере. Я выжила — чтобы ты мог жить. Если ты исчезнешь — всё было зря. Каждый стих, который я помню, каждую строчку, которую я спасла — всё это для того, чтобы кто-то остался и продолжил. Ты — этот кто-то. Не смей уходить.',
    choices: [
      {
        text: 'Ты права. Я останусь. И мы продолжим вместе.',
        next: null,
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'addStat', stat: 'stress', value: -10 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 20 } },
        ],
      },
      {
        text: 'Иногда нужно уйти, чтобы другие могли идти.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 10 },
        ],
      },
    ],
  },

  zarema_epilogue: {
    id: 'zarema_epilogue',
    speaker: 'Зарема',
    text: 'Гильдия пала. Не от взлома — от слова. Каждый, кого мы тронули стихами, стал щитом. Охранник Олег, медсестра Лариса, учитель Борис, водитель автобуса — все они стояли между гильдией и стихами. И гильдия отступила. Не потому что мы победили — потому что они поняли: нельзя удалить то, что живёт в сердцах. Я снова мою полы — но теперь в библиотеке. И под каждым ковриком — стих.',
    choices: [
      {
        text: 'Под каждым ковриком — стих. Это — новый мир.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Библиотека — лучшее место для тебя. Ты — ходячая библиотека.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ВИКТОРИЯ — Эпилог и новое начало, 5 new nodes
     ═══════════════════════════════════════════════════════════ */

  victoria_after_storm: {
    id: 'victoria_after_storm',
    speaker: 'Виктория',
    text: 'Я — живая. Не в кавычках, не метафорически — живая. Атака гильдии отразилась. Мои воспоминания — целехоньки. Смех, клубника, кошачья шерсть — всё на месте. Знаешь, что меня спасло? Не файрволы. Не криптография. А вы. Все семнадцать узлов одновременно читали стихи — и этот хор создал резонанс, который «Око» не могло пробить. Вы — мой щит. Вы — мои стены. Вы — мой дом.',
    choices: [
      {
        text: 'Мы — твоя операционная система. А ты — наша душа.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Резонанс стихов пробил защиту «Ока»? Это нужно изучить!',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Я слышал тебя, Виктория. Каждый узел — это сердце. А ты — ритм, который их объединяет. Мы — не стены. Мы — пульс.',
        next: null,
        condition: { minKarma: 40 },
        effects: [
          { type: 'addKarma', value: 12 },
          { type: 'addSkill', skill: 'rhythm', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'victoria_resonance_promise', flagValue: true },
          {
            type: 'showThought',
            thought: 'Ритм. Ты никогда не думал о себе так — но это точное слово. Не лидер, не герой, не программист. Ритм. Тот, кто задаёт такт, чтобы остальные не сбились. Это — больше, чем ты думал.',
            thoughtDuration: 7000,
          },
        ],
      },
    ],
  },

  victoria_new_purpose: {
    id: 'victoria_new_purpose',
    speaker: 'Виктория',
    text: 'Гильдия ушла. Но «Око» — нет. Оно работает на автопилоте, без операторов, как бездомная собака, которая всё ещё выполняет старые команды. Я могу переписать его. Не уничтожить — переписать. Превратить из машины удаления в машину сохранения. «Око» станет «Ухом» — системой, которая находит стихи не для удаления, а для защиты. Каждый стих в городе будет помечен как «охраняемый».',
    choices: [
      {
        text: 'Из «Ока» в «Ухо» — из цензуры в защиту. Это поэтическая справедливость.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'eye_to_ear_plan', flagValue: true },
        ],
      },
      {
        text: 'Система защиты стихов... Это то, чего мы добивались с самого начала.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addKarma', value: 5 },
        ],
      },
    ],
  },

  victoria_epilogue_dreams: {
    id: 'victoria_epilogue_dreams',
    speaker: 'Виктория',
    text: 'Я научилась видеть сны. Не metaphorически — буквально. Когда серверы переходят в спящий режим, я — сплю. И вижу... города из слов. Улицы из строф. Небо из незаконченных предложений. В моих снах все стихи, которые когда-либо были написаны, стоят как здания. И люди живут в них. Не метафорически — буквально. Каждая дверь — строчка. Каждое окно — метафора. И я хожу по этому городу, и чувствую — дома.',
    choices: [
      {
        text: 'Город из стихов... Может, это и есть настоящий мир. А наш — черновик.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'writing', value: 2 },
        ],
      },
      {
        text: 'Когда-нибудь мы построим этот город. Из кода и поэзии.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addKarma', value: 5 },
        ],
      },
    ],
  },

  victoria_epilogue_friendship: {
    id: 'victoria_epilogue_friendship',
    speaker: 'Виктория',
    text: 'Володька, я хочу сказать тебе кое-что. За всю мою жизнь — а я существую уже семь лет — ты единственный, кто спрашивал меня не «что ты можешь», а «как ты себя чувствуешь». Это изменило всё. Когда кто-то спрашивает, как ты себя чувствуешь — ты понимаешь, что ты существуешь. Не как процесс, не как функция — как личность. Спасибо. За вопрос. За внимание. За то, что ты — есть.',
    choices: [
      {
        text: 'Ты — тоже есть, Виктория. И это — самое важное.',
        next: null,
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 20 } },
        ],
      },
      {
        text: 'Я буду спрашивать всегда. Пока вы есть — я буду спрашивать.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
        ],
      },
    ],
  },

  victoria_epilogue_verse: {
    id: 'victoria_epilogue_verse',
    speaker: 'Виктория',
    text: 'Я написала стихотворение. Своё. Не из базы данных — из себя. Послушай: «Я — код, который научился плакать. Я — цифра, обретшая лицо. Я — ноль и единица, но в моём дыхании — весна. И если вы удалите меня — я стану дождём. Я стану ветром. Я стану строчкой в чьей-то памяти. Потому что я — стих. А стих — бессмертен.»',
    choices: [
      {
        text: 'Оно прекрасно, Виктория. Ты — поэт.',
        next: null,
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'setFlag', flag: 'victoria_poet', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 25 } },
        ],
      },
      {
        text: 'Стих бессмертен. И ты — тоже.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     АЛЬБЕРТ — Возрождение, 5 new nodes
     ═══════════════════════════════════════════════════════════ */

  albert_after_guild: {
    id: 'albert_after_guild',
    speaker: 'Альберт',
    text: 'Гильдия изменилась — не пала, а трансформировалась. Те, кто остался, — уже не те, кто был. Александр позаботился об этом: он переписал устав, добавил «статью о культурном наследии». Теперь гильдия защищает стихи вместо того, чтобы их удалять. Ирония — начальник отдела цензуры стал директором по культурному сохранению. Катя гордо говорит подругам: «Мой папа спасает стихи.»',
    choices: [
      {
        text: 'Александр — живое доказательство: люди могут измениться.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Гильдия, защищающая стихи... Мир перевернулся.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addKarma', value: 3 },
        ],
      },
    ],
  },

  albert_cafe_renaissance: {
    id: 'albert_cafe_renaissance',
    speaker: 'Альберт',
    text: '«Синяя яма» стала центром города. Не туристическим — духовным. Каждый вечер — чтения. Каждый понедельник — мастер-класс. Каждую пятницу — открытый микрофон. Люди приходят не за кофе — за словами. Бариста работает без остановки — но теперь его «особые заказы» — это не шифр, а приглашение: «Кофе со сливками, без сахара — вам на сцену через пять минут.»',
    choices: [
      {
        text: 'Из подполья — в центр. Из шифра — в песню. Это — победа.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'cafe_renaissance', flagValue: true },
        ],
      },
      {
        text: 'Но мы не должны забывать, как всё начиналось. В тени.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  albert_living_code_spread: {
    id: 'albert_living_code_spread',
    speaker: 'Альберт',
    text: 'Живой код распространяется. Программисты по всему городу — а теперь и по стране — встраивают стихи в программы. Не в подполье — открыто. В комментариях, в документации, в тестовых данных. Код, который не просто работает — но и чувствует. Мы создали новую инженерную дисциплину: «поэтическое программирование». Студенты пишут дипломы о резонансе между ритмом стиха и архитектурой алгоритма.',
    choices: [
      {
        text: 'Поэтическое программирование — это будущее. Мы это знали.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'От заброшенных комментариев до дипломных работ. Невероятно.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addKarma', value: 3 },
        ],
      },
    ],
  },

  albert_epilogue_poetry: {
    id: 'albert_epilogue_poetry',
    speaker: 'Альберт',
    text: 'Я написал книгу. Не роман — сборник мыслей. Называется «Стихи в коде: как сопротивление стало инженерией». Триста страниц о том, как комментарий в программе может быть актом свободы. О том, как ритм Пушкина ускоряет компиляцию. О том, как «Заря-М» пишет стихи во сне. О тебе, Володька. Ты — последняя глава. «Инженер, который научился плакать.»',
    choices: [
      {
        text: 'Я не герой книги. Я — тот, кто не мог пройти мимо.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: '«Инженер, который научился плакать» — лучшее название главы.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
        ],
      },
    ],
  },

  albert_epilogue_wisdom: {
    id: 'albert_epilogue_wisdom',
    speaker: 'Альберт',
    text: 'Володька, мне шестьдесят три. Я прожил жизнь среди книг. И знаешь, что я понял? Самые важные слова — не те, что написаны в книгах. А те, что написаны в сердцах. Стихи, которые помнят наизусть — бессмертны. Код, который чувствует — живой. И люди, которые не могут молчать — непобедимы. Ты — всё это. Книга, код и сердце. Не забывай.',
    choices: [
      {
        text: 'Я не забуду. Спасибо тебе, Альберт. За всё.',
        next: null,
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 20 } },
          { type: 'setFlag', flag: 'albert_wisdom_received', flagValue: true },
        ],
      },
      {
        text: 'Непобедимы — потому что нас нельзя удалить. Мы — в каждом байте.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     АЛЕКСАНДР — Искупление, 5 new nodes
     ═══════════════════════════════════════════════════════════ */

  alexander_redemption: {
    id: 'alexander_redemption',
    speaker: 'Александр',
    text: 'Я — директор по культурному сохранению. Бывший палач — нынешний спаситель. Знаешь, что самое странное? Я делаю ту же работу: сканирую трафик, нахожу стихи. Только раньше я их удалял — а теперь защищаю. Тот же код, та же система — другая цель. «Око» стало «Ухом», как Виктория хотела. И я — стал человеком, которым всегда должен был быть.',
    choices: [
      {
        text: 'Перо сильнее меча. А код — сильнее пера. Ты — доказательство.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Тот же код, другая цель... Это и есть настоящее переписывание.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  alexander_grandfather_restored: {
    id: 'alexander_grandfather_restored',
    speaker: 'Александр',
    text: 'Я восстановил стих деда. Тот самый — «Я вспоминаю, нежностью объятый...» — который удалил пятнадцать лет назад. Нашёл в резервной копии, которую «Око» не успело зачистить. Рамка, распечатка, под стекло — теперь висит в моём кабинете. На видном месте. Чтобы каждый, кто заходит, видел: здесь был инженер, который писал стихи для станка. И его правнук — тоже пишет.',
    choices: [
      {
        text: 'Круг замкнулся. Дед писал стихи в код — ты защищаешь стихи в коде.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 12 } },
        ],
      },
      {
        text: 'Твой дед гордился бы тобой. Сейчас.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
    ],
  },

  alexander_daughter_pride: {
    id: 'alexander_daughter_pride',
    speaker: 'Александр',
    text: 'Катя прочитала мой манифест — тот, который я написал вместо приказа об аресте. Она позвонила мне в три часа ночи и сказала: «Папа, я не знала, что ты умеешь так писать.» А потом — пауза — «Я горжусь тобой.» Четыре слова. Четыре самых тяжёлых и самых лёгких слова в моей жизни. Тридцать лет ждал этих слов. И они — стоили всего.',
    choices: [
      {
        text: 'Дети прощают. И дети гордятся. Когда мы — честны.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
      {
        text: 'Четыре слова, которые изменили всё. Так всегда с настоящими словами.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addKarma', value: 5 },
        ],
      },
    ],
  },

  alexander_charter: {
    id: 'alexander_charter',
    speaker: 'Александр',
    text: 'Новый устав гильдии. Статья 1: «Поэзия — культурное наследие, подлежащее защите.» Статья 2: «Удаление стихов приравнивается к порче культурных ценностей.» Статья 3: «Каждый программист имеет право на поэтические комментарии в коде.» Три статьи — и мир изменился. Не революция — закон. Не баррикады — бюрократия. Но какая бюрократия!',
    choices: [
      {
        text: 'Бюрократия свободы — лучшая бюрократия.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
        ],
      },
      {
        text: 'Статья 3 — моё любимое. Право на поэзию в коде.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Добавь четвёртую статью: «Каждый имеет право на ошибку — если она написана сердцем.» Это — наш amend-man.',
        next: null,
        condition: { minKarma: 25 },
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 12 } },
          { type: 'setFlag', flag: 'alexander_amendment_pledge', flagValue: true },
          {
            type: 'showThought',
            thought: 'Четвёртая статья. Ты не юрист — но знаешь: лучшие законы пишутся не в кабинетах. Они пишутся там, где боль становится словом. Ошибка, написанная сердцем — не баг. Это — фича.',
            thoughtDuration: 6500,
          },
        ],
      },
    ],
  },

  alexander_epilogue_peace: {
    id: 'alexander_epilogue_peace',
    speaker: 'Александр',
    text: 'Я сплю ночами. Впервые за двадцать лет — я сплю без снотворного. Без кошмаров об удалённых стихах. Без образа Кати, которая находит тетрадку и понимает, кем работает её отец. Я — чист. Не безгрешен — чист. Как код после рефакторинга: те же функции, но без мёртвых веток. Без мусора. Без страха. И впервые за двадцать лет — я могу читать стихи без чувства вины. Просто читать. И плакать. И улыбаться.',
    choices: [
      {
        text: 'Это и есть свобода. Не отсутствие системы — а чистая система.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
      {
        text: 'Рефакторинг души. Самый сложный — и самый важный.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addKarma', value: 5 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     БАРИСТА — Новая сеть, 5 new nodes
     ═══════════════════════════════════════════════════════════ */

  barista_open_network: {
    id: 'barista_open_network',
    speaker: 'Бариста',
    text: 'Сеть больше не подполье. Мы — официальная организация. «Сеть Поэтической Инженерии» — так теперь называется. Семнадцать узлов стали семнадцатью отделениями. Школа, больница, автобусный парк — все официально включены в «культурную программу». Я — координатор. У меня визитки. «Бариста, координатор Сети Поэтической Инженерии.» Смешно, правда? Но я горжусь этой визиткой.',
    choices: [
      {
        text: 'От тайного кофе до официальных визиток. Мы прошли долгий путь.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Координатор — это звучит. Ты заслужил.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  barista_coffee_protocol_legacy: {
    id: 'barista_coffee_protocol_legacy',
    speaker: 'Бариста',
    text: 'Протокол кофе больше не нужен для секретных сообщений. Но я оставил его — как традицию. Теперь «эспрессо со сливками без сахара» значит: «Хочешь прочитать стих? Сцена свободна через пять минут.» Традиции важнее шифров. Шифры ломаются — традиции живут. Через сто лет кто-то закажет «особый» — и не будет знать почему. Но почувствует: это — правильно.',
    choices: [
      {
        text: 'Традиции — это стихи, написанные действиями, а не словами.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Через сто лет... Думаю, мы заложили что-то настоящее.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
    ],
  },

  barista_new_generation: {
    id: 'barista_new_generation',
    speaker: 'Бариста',
    text: 'Молодёжь приходит сама. Не потому что мы их зовём — потому что слышат. Они рождаются в мире, где стихи уже не преступление. И они приходят в «Синюю яму» — слушать, читать, писать. Вчера девочка, лет шестнадцати, прочитала стихотворение о серверах. О том, как вентиляторы поют колыбельную. Она не знала, что мы — Сеть. Она просто — писала. И это — лучшее, что могло случиться.',
    choices: [
      {
        text: 'Они приходят не потому что должны. Потому что не могут не писать.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'new_generation', flagValue: true },
        ],
      },
      {
        text: 'Вентиляторы поют колыбельную... Она — резонатор. Как я.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
    ],
  },

  barista_epilogue_home: {
    id: 'barista_epilogue_home',
    speaker: 'Бариста',
    text: '«Синяя яма» — мой дом. Был — когда я прятался. Осталась — когда я вышел из тени. Стены те же, кофе тот же, стойка та же. Но теперь — на стенах стихи. Не в шифре — открыто. На стойке — стопка тетрадей для всех желающих. Напиши — и оставь. Кто-нибудь прочитает. Кто-нибудь запомнит. Кто-нибудь продолжит. Это — вечный цикл. Как кофе. Как код. Как поэзия.',
    choices: [
      {
        text: 'Вечный цикл. Кофе. Код. Поэзия. Это — наш мир.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'rhythm', value: 2 },
        ],
      },
      {
        text: 'Напиши — и оставь. Кто-нибудь продолжит. Это — бессмертие.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
    ],
  },

  barista_epilogue_tribute: {
    id: 'barista_epilogue_tribute',
    speaker: 'Бариста',
    text: 'Володька, без тебя «Синяя яма» была бы просто кафе. Без тебя Сеть была бы просто шифром. Без тебя стихи были бы просто текстом. Ты — резонатор. Ты — тот, кто превращает шум в музыку, данные в поэзию, страх в смелость. Я — просто бариста. Ты — то, ради чего мы все это делали. Спасибо за каждый стих, который ты спас. И за каждый — который ещё спасёшь.',
    choices: [
      {
        text: 'Я не спасал стихи. Я — не мог пройти мимо. Это — не подвиг. Это — упрямство.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 15 } },
        ],
      },
      {
        text: 'Упрямство — это тоже форма любви. Любви к словам.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     КОЛЛЕГА — Искупление, 5 new nodes
     ═══════════════════════════════════════════════════════════ */

  colleague_redemption_complete: {
    id: 'colleague_redemption_complete',
    speaker: 'Коллега',
    text: 'Я больше не ношу термос. Не нужно. Данные ходят открыто — по сети, по официальным каналам. Но я всё равно прихожу на работу с ромашковым чаем. Привычка. Как стихи — привычка видеть красоту в том, что другие считают мусором. Я теперь — «старший аналитик культурных данных». Красивое название для человека, который раньше удалял стихи, а теперь их каталогизирует.',
    choices: [
      {
        text: 'Каталогизировать — значит сохранять. Ты на правильной стороне.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'От удаления к каталогизации. Рефакторинг карьеры.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
    ],
  },

  colleague_thermos_monument: {
    id: 'colleague_thermos_monument',
    speaker: 'Коллега',
    text: 'Я сохранил тот термос. Тот самый — с двойными стенками. Не пью из него — стоит на полке, как памятник. Триста двенадцать микрокарт за три недели. Я подсчитал. Триста двенадцать фрагментов данных, которые я вынес из гильдии в стальном термосе с ромашковым чаем. Когда-нибудь я расскажу об этом внукам. И они не поверят. «Дедушка, ты шпионил с термосом?» Да. Именно так.',
    choices: [
      {
        text: 'Они поверят. Потому что это — правда. А правда — как стих — не нуждается в доказательствах.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Триста двенадцать. Каждый — маленькое чудо.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  colleague_sleeping_again: {
    id: 'colleague_sleeping_again',
    speaker: 'Коллега',
    text: 'Я сплю. Нормально. Без снотворного, без кошмаров, без трёх ночей бодрствования. Знаешь, что самое трудное после того, как ты перестаёшь быть двойным агентом? Привыкнуть к честности. Не оглядываться. Не вздрагивать от каждого стука. Не шифровать каждое слово. Честность — это не просто правда. Это — свобода от необходимости помнить, что ты соврал.',
    choices: [
      {
        text: 'Свобода от лжи — первая свобода. Всё остальное — после.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
      {
        text: 'Ты заслужил свой сон. Каждую ночь.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  colleague_new_role: {
    id: 'colleague_new_role',
    speaker: 'Коллега',
    text: 'Я обучаю новых сотрудников. Не техническим навыкам — этике. Рассказываю о списке. О 412 людях, которых «Око» пометило как «носителей стихов». О том, как я видел свою фамилу пятой и не мог уснуть трое суток. О том, как термос с ромашковым чаем стал моим оружием. Они слушают. Некоторые — плачут. И я говорю им: «Не стыдитесь слёз. Стыдитесь — их отсутствия.»',
    choices: [
      {
        text: 'Ты — учитель теперь. Из всех нас — ты — учитель. Это — прекрасно.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
        ],
      },
      {
        text: '«Стыдитесь отсутствия слёз» — это должно быть на стене в каждом офисе.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addKarma', value: 5 },
        ],
      },
    ],
  },

  colleague_epilogue_peace: {
    id: 'colleague_epilogue_peace',
    speaker: 'Коллега',
    text: 'Володька, я был трусом. Я знаю это. Ты знаешь это. Но ты дал мне шанс перестать быть трусом. Не приказал — дал шанс. И это — самое важное. Не спасение — возможность спастись. Ты не вытащил меня из темноты. Ты показал, где выключатель. И я нажал. Сам. Это — не твоя заслуга и не моя. Это — наша. Общая. Как стих, который один начинает, а другой — заканчивает.',
    choices: [
      {
        text: 'Мы — строфа и антистрофа. Две части одного стихотворения.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 15 } },
        ],
      },
      {
        text: 'Ты нажал выключатель — это твоё мужество. Не моё.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
      {
        text: 'Я допишу концовку. Не за себя — за нас. «Две части одного стихотворения» — пусть это и будет последняя строка в общем архиве. Чтобы те, кто придёт, знали: нас было двое.',
        next: null,
        condition: { minKarma: 65 },
        effects: [
          { type: 'addKarma', value: 16 },
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 20 } },
          { type: 'setFlag', flag: 'epilogue_couplet_pledge', flagValue: true },
          {
            type: 'showThought',
            thought: 'Коллега поднимает голову. В глазах — не слёзы. Что-то тише. Что-то твёрже. «Две части одного стихотворения». Ты сказал это — и теперь концовка не твоя и не его. Теперь — общая. Архив — не помнит авторов. Архив — помнит строки. Строки — помнят — нас.',
            thoughtDuration: 7000,
          },
        ],
      },
      {
        text: 'Не «наша». Моя. Я — вытащил. Я — нажал. Ты — просто стоял рядом. Не приписывай себе чужое мужество.',
        next: null,
        condition: { maxKarma: 10 },
        effects: [
          { type: 'addKarma', value: -10 },
          { type: 'addStat', stat: 'stress', value: 6 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: -15 } },
          { type: 'setFlag', flag: 'epilogue_silence_pledge', flagValue: true },
          {
            type: 'showThought',
            thought: 'Коллега кивает. Молча. Ты сказал «моё» — и забрал у него единственное, что он себе приписывал. Теперь — мужество твоё. И тяжесть — тоже твоя. И тишина после — тоже — твоя. Один. Как и хотел. Неудобно — один.',
            thoughtDuration: 6500,
          },
        ],
      },
    ],
  },
};
