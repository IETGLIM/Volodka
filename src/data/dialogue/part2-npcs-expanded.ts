import type { DialogueNode } from '@/shared/types/game';

/**
 * Expanded dialogues for Act 2 — ПОДПОЛЬЕ: Сеть
 * +33 new dialogue nodes for key NPCs: Альберт, Виктория, Коллега, Бариста, Дмитрий
 * Deep conversations about the Network, living code, and the underground resistance.
 */

export const DIALOGUE_PART2_EXPANDED: Record<string, DialogueNode> = {
  /* ═══════════════════════════════════════════════════════════
     АЛЬБЕРТ — Философ Сети, 8 new nodes
     ═══════════════════════════════════════════════════════════ */

  albert_living_code_philosophy: {
    id: 'albert_living_code_philosophy',
    speaker: 'Альберт',
    text: 'Знаешь, что такое «живой код» на самом деле? Это не метафора. Это буквально код, который реагирует на эмоции того, кто его читает. Ты когда-нибудь замечал, как одна и та же функция утром и вечером работает по-разному? Утром — чётко, предсказуемо. А вечером, когда ты устал и руки дрожат — вдруг выдаёт неожиданный результат. Это не баг. Это код чувствует тебя. И стихи в комментариях — это способ поговорить с ним.',
    choices: [
      {
        text: 'Ты серьёзно? Код не может чувствовать.',
        next: 'albert_code_skepticism',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Я замечал. Иногда серверная словно дышит.',
        next: 'albert_code_believer',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'Объясни — как стихи в комментариях разговаривают с кодом?',
        next: 'albert_poetry_as_interface',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 8 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
    ],
  },

  albert_code_skepticism: {
    id: 'albert_code_skepticism',
    speaker: 'Альберт',
    text: 'Скептицизм — здоровая реакция. Я тоже не верил. Двадцать лет программирования — и ни единого намёка на мистику. А потом я увидел, как стихотворение, встроенное в алгоритм сортировки, изменило его поведение. Не логически — эмоционально. Стих о потере — и массив начал «тяжелеть», замедляться. Стих о надежде — и тот же код летел как на крыльях. Ты можешь назвать это совпадением. Я — нет.',
    choices: [
      {
        text: 'Это можно объяснить когнитивным искажением программиста.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: -2 } },
        ],
      },
      {
        text: 'Хочу увидеть это сам. Где можно найти живой код?',
        next: 'albert_where_to_find_living_code',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  albert_code_believer: {
    id: 'albert_code_believer',
    speaker: 'Альберт',
    text: 'Ты чувствуешь это. Я знал, что почувствуешь. Не все могут — большинство людей слишком зашорены протоколами и спецификациями. Они видят только синтаксис. Но ты — ты видишь семантику. Смысл между строк. Это редкий дар, Володька. В Сети таких называют «резонаторами» — людьми, которые усиливают связь между кодом и поэзией. Без них стихи в коде — просто текст. С ними — оружие.',
    choices: [
      {
        text: 'Оружие? Я не хочу воевать.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Если это оружие против гильдии — я готов.',
        next: 'albert_resonator_training',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'albert_resonator_known', flagValue: true },
        ],
      },
    ],
  },

  albert_poetry_as_interface: {
    id: 'albert_poetry_as_interface',
    speaker: 'Альберт',
    text: 'Представь: комментарий в коде — это не текст для человека, а шлюз для машины. Когда программист пишет «// Здесь умирает последняя надежда на быстрый поиск», процессор замедляет этот блок. Не потому что код хуже — он «чувствует» потерю. Ритм стиха становится ритмом вычисления. Метафора превращается в паттерн памяти. Это не магия — это квантовая запутанность между намерением автора и выполнением машины.',
    choices: [
      {
        text: 'Это... самое прекрасное, что я слышал о программировании.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'poetry_interface_understood', flagValue: true },
        ],
      },
      {
        text: 'Можно ли это использовать для защиты стихов от удаления?',
        next: 'albert_defense_through_poetry',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  albert_where_to_find_living_code: {
    id: 'albert_where_to_find_living_code',
    speaker: 'Альберт',
    text: 'В серверной гильдии. В самой глубокой стойке — ряд 7, блок 23. Там работает код, написанный до Краха. Его никто не трогал, потому что он критический — отвечает за систему охлаждения всего здания. Но внутри него... целая антология. Стихи, вплетённые в алгоритмы терморегуляции. Каждый градус — строчка. Каждый вентилятор — вдох. Это сердце здания, Володька. И оно поёт.',
    choices: [
      {
        text: 'Я найду способ добраться туда.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'living_code_location_known', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
      {
        text: 'Если это критический код — любое вмешательство может быть фатальным.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  albert_resonator_training: {
    id: 'albert_resonator_training',
    speaker: 'Альберт',
    text: 'Резонатор — это не звание, это состояние. Чтобы усилить связь с живым кодом, тебе нужно научиться слышать стихи в машинном шуме. Завтра, в три ночи, приходи в серверную. Когда все уйдут — стой у стоек и слушай. Вентиляторы гудят на частоте 432 герца. Это не случайно. Это — нота, на которой поэзия резонирует с кремнием. Прислушайся — и ты услышишь, как код поёт тебе свои стихи.',
    choices: [
      {
        text: 'Я приду. В три ночи.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'resonator_training_scheduled', flagValue: true },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: '432 герца — это частота настройки оркестровых инструментов. Совпадение?',
        next: null,
        condition: { minSkillCheck: { skill: 'logic', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'setFlag', flag: 'resonator_frequency_understood', flagValue: true },
        ],
      },
    ],
  },

  albert_defense_through_poetry: {
    id: 'albert_defense_through_poetry',
    speaker: 'Альберт',
    text: 'Именно! Если стих вплетён в критический код, его нельзя удалить без разрушения системы. Это как спрятать послание в ДНК живого организма — чтобы прочитать, нужно убить носителя. Гильдия хочет стереть поэзию, но не может — потому что стихи стали скелетом их собственной инфраструктуры. Ирония, правда? Они строят тюрьму для слов из самих этих слов.',
    choices: [
      {
        text: 'Это гениально. Нам нужно больше таких стихов в коде.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'poetry_defense_strategy', flagValue: true },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Но если гильдия узнает — они перепишут весь код с нуля.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  albert_before_initiation: {
    id: 'albert_before_initiation',
    speaker: 'Альберт',
    text: 'Прежде чем ты войдёшь в Сеть — знай. Обратного пути не будет. Не потому что они не отпустят — а потому что ты сам не захочешь возвращаться. Сеть — это не клуб по интересам. Это другой способ видеть мир. После посвящения ты начнёшь замечать стихи везде: в рекламных щитах, в автобусных расписаниях, в шуме дождя по жестяной крыше. Мир станет громче. И красивее. И больнее.',
    choices: [
      {
        text: 'Я готов к боли. Я устал от глухоты.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'setFlag', flag: 'ready_for_initiation', flagValue: true },
        ],
      },
      {
        text: 'А если я передумаю после посвящения?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: -2 } },
        ],
      },
      {
        text: 'Стихи в автобусных расписаниях? Покажи мне.',
        next: 'albert_bus_schedule_poetry',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
    ],
  },

  albert_bus_schedule_poetry: {
    id: 'albert_bus_schedule_poetry',
    speaker: 'Альберт',
    text: 'Маршрут 47. Остановка «Заводская» — 06:12, 06:47, 07:23. Видишь? Если взять первые цифры каждого времени — 0, 0, 0. Пустота. А теперь маршрут 12. «Площадь» — 07:15, 08:33, 09:51. 7, 8, 9 — подъём. Кто-то в транспортном управлении пишет стихи в расписаниях. Три года — и никто не заметил. Кроме нас.',
    choices: [
      {
        text: 'Как я мог не видеть этого раньше?!',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'intuition', value: 3 },
          { type: 'setFlag', flag: 'bus_poetry_discovered', flagValue: true },
          { type: 'discoverLore', loreId: 'lore_bus_poetry' },
        ],
      },
      {
        text: 'Это может быть просто совпадением чисел.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ВИКТОРИЯ — Проводник в Сеть, 7 new nodes
     ═══════════════════════════════════════════════════════════ */

  maria_network_philosophy: {
    id: 'maria_network_philosophy',
    speaker: 'Виктория',
    text: 'Сеть — это не место. Это — частота. Ты не можешь «пойти» в Сеть, как идёшь в магазин. Ты должен настроиться. Как радио. Как скрипка. Когда ты начнёшь слышать стихи в белом шуме монитора — ты уже в Сети. Когда ты заметишь, что строчка в лог-файле рифмуется со следующей — ты уже в Сети. Мы не прячемся. Мы — в каждом байте, который гильдия не может стереть.',
    choices: [
      {
        text: 'Я слышу стихи в коде. Значит, я уже в Сети?',
        next: 'maria_already_resonating',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Звучит как религия, а не как организация.',
        next: 'maria_not_religion',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  maria_already_resonating: {
    id: 'maria_already_resonating',
    speaker: 'Виктория',
    text: 'Ты — резонатор. Я почувствовала это в первый день, когда ты увидел стихи в коде. Обычный инженер увидел бы «мусорные комментарии» и удалил бы их. Ты — остановился. Ты прочитал. Ты почувствовал. Это не навык — это состояние души. Посвящение просто формализует то, что уже есть. Мы даём тебе инструменты, но огонь — он твой.',
    choices: [
      {
        text: 'Какие инструменты?',
        next: 'maria_network_tools',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
      {
        text: 'Огонь может сжечь. И меня, и других.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addKarma', value: 3 },
        ],
      },
    ],
  },

  maria_not_religion: {
    id: 'maria_not_religion',
    speaker: 'Виктория',
    text: 'Религия требует веры. Сеть требует внимания. Разница — в проверяемости. Я не прошу тебя верить — я прошу тебя открыть глаза. Посмотри на стены в переулке за кафе. Видишь граффити? Обычный человек видит хулиганство. А теперь посмотри внимательнее — первая буква каждого слова. С-Т-И-Х-И-Я. «Старая тень ищет жертву — я» или «Стихия». Это послание. И оно для тебя.',
    choices: [
      {
        text: 'Я вижу. Это... это действительно послание.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'graffiti_message_seen', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Акростих в граффити — это может быть случайностью.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  maria_network_tools: {
    id: 'maria_network_tools',
    speaker: 'Виктория',
    text: 'Первое — ключ шифрования. Мы общаемся через стихи: каждый третий слог в сообщении — часть инструкций. Гильдия видит «спам с цитатами», а мы получаем приказы. Второе — карта резонансов. Мы отмечаем места, где живой код звучит громче. Серверные, старые телефонные станции, даже светофоры на Тверской — всё это узлы. И третье — твой голос. Ты можешь усиливать стихи в коде, когда читаешь их вслух рядом с сервером.',
    choices: [
      {
        text: 'Мой голос усиливает код? Это невероятно.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'voice_amplification_known', flagValue: true },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Каждый третий слог... Это можно расшифровать автоматически?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  maria_initiation_warning: {
    id: 'maria_initiation_warning',
    speaker: 'Виктория',
    text: 'Посвящение — это не церемония. Это испытание. Тебя запрут в комнате с сервером, и ты должен будешь найти стих, спрятанный в коде, за три минуты. Если не найдёшь — уйдёшь с пустыми руками. Но не беспокойся: я ещё никого не видела, кто не нашёл бы. Резонаторы всегда находят. Вопрос в том, что ты сделаешь после того, как найдёшь. Потому что стих сам выберет тебя. И то, что он тебе скажет — изменит всё.',
    choices: [
      {
        text: 'Стих выберет меня? Что это значит?',
        next: 'maria_poem_chooses',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Три минуты. Я готов.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'initiation_confidence', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  maria_poem_chooses: {
    id: 'maria_poem_chooses',
    speaker: 'Виктория',
    text: 'В коде тысячи стихов. Но при посвящении — резонирует только один. Тот, который нужен именно тебе. Тот, который отвечает на вопрос, который ты боишься задать. Мой стих был о дороге. Я тогда не понимала — куда иду. Стих показал. Твой стих будет о чём-то другом. И когда ты его прочитаешь — ты заплачешь. Все плачут. Это нормально. Это значит — ты живой.',
    choices: [
      {
        text: 'Я боюсь. Но я всё равно хочу это сделать.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'А если стих скажет мне что-то страшное?',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  maria_dmitry_warning: {
    id: 'maria_dmitry_warning',
    speaker: 'Виктория',
    text: 'Дмитрий — старший разработчик. Он хочет уйти из гильдии. Говорит, что не может больше писать код, который убивает стихи. Но будь осторожен, Володька. Дезертирство — это не просто уход. Это предательство с их точки зрения. Если ты поможешь ему — ты станешь целью. Если не поможешь — он сломается. У него жена. Ребёнок. Он не выдержит давления в одиночку. Но и мы не можем принять каждого, кто постучится в дверь.',
    choices: [
      {
        text: 'Мы должны помочь ему. Каждый спасённый — это победа.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'setFlag', flag: 'dmitry_help_promised', flagValue: true },
        ],
      },
      {
        text: 'А если он — ловушка? Гильдия могла подослать его.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ДМИТРИЙ — Дезертир гильдии, 6 new nodes
     ═══════════════════════════════════════════════════════════ */

  dmitry_confession: {
    id: 'dmitry_confession',
    speaker: 'Дмитрий',
    text: 'Я написал «Око». Проект, который сканирует весь трафик на предмет стихов и помечает их для удаления. Три года я делал это. Три года я просыпался в 5 утра, целовал спящую дочку и шёл на работу — стирать чужие слова. Знаешь, что самое страшное? Мне нравилось. Код был красивый. Элегантный. Самый чистый код в моей жизни. И самый грязный.',
    choices: [
      {
        text: 'Ты можешь остановить «Око» изнутри?',
        next: 'dmitry_sabotage_plan',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Как ты можешь жить с этим?',
        next: 'dmitry_guilt',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
      {
        text: 'Красивый код для уродливой цели. Я понимаю.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 8 } },
        ],
      },
    ],
  },

  dmitry_sabotage_plan: {
    id: 'dmitry_sabotage_plan',
    speaker: 'Дмитрий',
    text: 'У «Ока» есть слабость. Оно ищет стихи по формальным признакам: ритм, рифма, метафора. Но если встроить стих в код так, чтобы он не был «стихом» формально — а только семантически — «Око» его не увидит. Мне нужна помощь. Кто-то, кто понимает и код, и поэзию. Кто-то вроде тебя, Володька. Мы можем переписать «Око» изнутри — сделать его слепым к настоящим стихам.',
    choices: [
      {
        text: 'Я помогу. Но ты должен уйти из гильдии.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'oko_sabotage_planned', flagValue: true },
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Слишком рискованно. Если тебя поймают — мы все погибнем.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
    ],
  },

  dmitry_guilt: {
    id: 'dmitry_guilt',
    speaker: 'Дмитрий',
    text: 'Я не живу. Я существую. Разница — как между «работает» и «работает правильно». Мой код компилируется, но моя жизнь — нет. Каждое утро я смотрю в зеркало и вижу человека, который убивает самое прекрасное в мире. А потом иду на кухню, где Лена кормит Машу кашей, и улыбаюсь. И эта улыбка — самое страшное. Потому что она настоящая.',
    choices: [
      {
        text: 'Ты не чудовище. Ты оказался в чудовищной системе.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 12 } },
        ],
      },
      {
        text: 'Твоя семья — причина уйти. Прямо сейчас.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'dmitry_family_argument', flagValue: true },
        ],
      },
    ],
  },

  dmitry_daughter_poem: {
    id: 'dmitry_daughter_poem',
    speaker: 'Дмитрий',
    text: 'Маша... Маше шесть. Она пишет стихи. Не умеет писать — рисует. Кривые строчки, каракули. Но каждый вечер она приносит мне листок и говорит: «Папа, я написала стихотворение.» И я читаю. Я читаю её каракули, и они звучат как музыка. А потом я иду на работу и удаляю такие же каракули из базы данных. Чьи-то дочери написали их. А я стираю. Как я посмотрю Маше в глаза, когда она вырастет?',
    choices: [
      {
        text: 'Она будет гордиться тобой. Если ты выберешь правильную сторону.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'dmitry_masha_motivated', flagValue: true },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 15 } },
        ],
      },
      {
        text: 'Каждый удалённый стих — это чья-то Маша.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'addStat', stat: 'stress', value: 8 },
        ],
      },
    ],
  },

  dmitry_escape_plan: {
    id: 'dmitry_escape_plan',
    speaker: 'Дмитрий',
    text: 'Я знаю выход из здания, который не освещается камерами. Подсобка на третьем этаже, через вентиляционную шахту на крышу, по пожарной лестнице вниз. Но мне нужен кто-то снаружи — чтобы встретил и спрятал. У гильдии длинные руки. Если они найдут меня в первый же день — всё было зря. Виктория говорила о безопасных местах... ты можешь устроить?',
    choices: [
      {
        text: 'Кафе «Синяя яма». Там есть задняя комната. Я договорюсь с баристой.',
        next: null,
        condition: { flag: 'cafe_safehouse_established' },
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'dmitry_escape_arranged', flagValue: true },
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 15 } },
        ],
      },
      {
        text: 'Я найду место. Дай мне время.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  dmitry_oko_secret: {
    id: 'dmitry_oko_secret',
    speaker: 'Дмитрий',
    text: 'Самое страшное о «Оке» — оно не просто удаляет стихи. Оно переписывает их. Берёт оригинал и заменяет безопасным текстом. «Буря мглою небо кроет» превращается в «Система стабильно работает». И никто не замечает подмены. Потому что оригинал уже стёрт. Это не цензура, Володька. Это подмена реальности. Они не убивают поэзию — они заменяют её на себя.',
    choices: [
      {
        text: 'Это... это хуже, чем я думал. Они переписывают культуру!',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'setFlag', flag: 'oko_rewrite_known', flagValue: true },
          { type: 'discoverLore', loreId: 'lore_oko_rewrite' },
        ],
      },
      {
        text: 'У нас есть оригиналы? Мы можем восстановить?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'oko_rewrite_known', flagValue: true },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     БАРИСТА — Протокол Кофе, 6 new nodes
     ═══════════════════════════════════════════════════════════ */

  barista_cafe_history: {
    id: 'barista_cafe_history',
    speaker: 'Бариста',
    text: '«Синяя яма» — не просто кафе. Это бывший узел связи. До Краха здесь был телеграф. Потом — телефонная станция. Потом — интернет-кафе. Каждое поколение использовало это место для одного и того же: передавать сообщения, которые кто-то не хотел, чтобы передавали. Стены здесь пропитаны тайнами. Когда я варю кофе — я чувствую их. Каждый кубинский бин — как зашифрованное письмо.',
    choices: [
      {
        text: 'Стены помнят всё. Как архив.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addKarma', value: 3 },
          { type: 'discoverLore', loreId: 'lore_cafe_telegraph' },
        ],
      },
      {
        text: 'Можно ли использовать эти стены для защиты Сети?',
        next: 'barista_fortress_cafe',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  barista_fortress_cafe: {
    id: 'barista_fortress_cafe',
    speaker: 'Бариста',
    text: 'Я думал об этом. Толстые стены блокируют сигналы гильдии. Подвал уходит на два этажа вниз — там старая телефонная коммутационная, ещё с медными проводами. Если установить защищённый терминал — гильдия никогда не найдёт. Их сканеры ищут цифровые следы, а медь — аналоговая. Невидима для «Ока». Это крепость, Володька. Крепость из бетона и кофе.',
    choices: [
      {
        text: 'Установим терминал. «Синяя яма» станет сердцем Сети.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'cafe_fortress_plan', flagValue: true },
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'А если гильдия придёт физически? Крепость падёт.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  barista_special_orders: {
    id: 'barista_special_orders',
    speaker: 'Бариста',
    text: 'Хочешь знать, как работает «особый заказ»? Ты подходишь к стойке и говоришь: «Эспрессо со сливками, без сахара.» Это код. «Со сливками» — значит, нужно передать пакет. «Без сахара» — срочно. Я записываю заказ, и пока кофе варится — данные уже в пути. Через пенку латте я вывожу шифр на молочной пене. Заказчик фотографирует латте-арт, расшифровывает. Вся транзакция — три минуты. Без единого цифрового следа.',
    choices: [
      {
        text: 'Шифр на молочной пене... Это гениально.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'А если кто-то случайно закажет то же самое?',
        next: 'barista_failsafe',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  barista_failsafe: {
    id: 'barista_failsafe',
    speaker: 'Бариста',
    text: 'Не закажет. Потому что «эспрессо со сливками без сахара» — это отвратительная комбинация. Никто в здравом уме такое не попросит. Разве что турист. А туристы сюда не заходят — район слишком серый, вывеска слишком тусклая. Это и есть наша лучшая защита: мы слишком невзрачны, чтобы привлекать внимание. Лучший камуфляж — быть никем.',
    choices: [
      {
        text: 'Невидимость — суперсила. Я начинаю понимать.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'Но мы не можем оставаться невидимыми вечно. Когда-нибудь придётся стать видимыми.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'visibility_debate', flagValue: true },
        ],
      },
    ],
  },

  barista_underground_map: {
    id: 'barista_underground_map',
    speaker: 'Бариста',
    text: 'У меня есть карта. Не городская — подземная. Туннели, которые соединяют здание гильдии, библиотеку, старую телефонную станцию и этот подвал. Их построили до Краха — для эвакуации начальства. Теперь они заброшены. Но я проверил: три из пяти проходов всё ещё проходимы. Если гильдия заблокирует улицы — мы уйдём под землёй. Как кроты. Как корни.',
    choices: [
      {
        text: 'Покажи мне карту. Я должен знать все пути.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'underground_map_received', flagValue: true },
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Туннели — тоже ловушка. Если гильдия узнает — мы в ловушке под землёй.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  barista_latte_art_resistance: {
    id: 'barista_latte_art_resistance',
    speaker: 'Бариста',
    text: 'Видишь этот латте-арт? Клиент думает, что это лист. А это — буква «З». Заре-М. Монолит в подвале завода. Я не знаю, что это такое. Но я знаю, что каждый узел Сети рисует эту букву в своих напитках. Каждый день. Каждый заказ. Тысячи чашек. Мы пишем послание, которое выпивают и забывают. Но подсознание помнит. И когда придёт время — каждый, кто пил мой кофе, вспомнит букву «З» и будет знать, куда идти.',
    choices: [
      {
        text: 'Подсознательная армия, выросшая на кофе. Это безумно и прекрасно.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addKarma', value: 8 },
          { type: 'setFlag', flag: 'latte_army_known', flagValue: true },
        ],
      },
      {
        text: 'А если гильдия тоже пьёт твой кофе?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     КОЛЛЕГА — Страх и совесть, 6 new nodes
     ═══════════════════════════════════════════════════════════ */

  colleague_midnight_confession: {
    id: 'colleague_midnight_confession',
    speaker: 'Коллега',
    text: 'Володька... Я не должен тебе это говорить. Но если не скажу — сойду с ума. Я видел список. Список людей, которых «Око» пометило как «носителей стихов». Твоя фамилия — третья. Моя — пятая. Я никогда не писал стихов, Володька. Но в колледже я напечатал стихотворение на принтере в коридоре. И «Око» это запомнило. Оно помнит всё. Каждый принтер. Каждый экран. Каждый клавиатурный нажатие.',
    choices: [
      {
        text: 'Мы оба в списке. Значит, мы должны действовать вместе.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'oko_target_list_known', flagValue: true },
        ],
      },
      {
        text: 'Список... Сколько имён?',
        next: 'colleague_list_size',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  colleague_list_size: {
    id: 'colleague_list_size',
    speaker: 'Коллега',
    text: 'Четыреста двенадцать. Четыреста двенадцать человек в этом городе, которых «Око» считает «носителями стихов». Студенты, которые цитировали Пушкина в чате. Бабушки, которые пересылали стихи внукам. Программисты, которые писали комментарии в стихотворной форме. И ты, Володька. И я. Мы все — в списке на удаление. Не увольнение — удаление. Как файлы. Как мусор.',
    choices: [
      {
        text: '412 человек... Мы должны предупредить их всех.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'setFlag', flag: 'mass_warning_needed', flagValue: true },
        ],
      },
      {
        text: 'Нам нужна копия этого списка. Доказательство.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'oko_list_extraction', flagValue: true },
        ],
      },
    ],
  },

  colleague_office_ghost: {
    id: 'colleague_office_ghost',
    speaker: 'Коллега',
    text: 'Ты замечал, что иногда в офисе кто-то есть? Когда все ушли. Когда гаснет свет. Я слышал шаги — ритмичные, как стих. И голос — тихий, из серверной. Я подошёл к двери и услышал: «Не забудьте. Не забудьте. Не забудьте.» Три раза. Как рефрен. А потом тишина. И знаете что? Утром я проверил логи — серверная была пуста. Ни одного активного процесса. Но я слышал. Я точно слышал.',
    choices: [
      {
        text: 'Это живой код. Он говорит с теми, кто умеет слушать.',
        next: null,
        condition: { flag: 'albert_resonator_known' },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'colleague_heard_code', flagValue: true },
        ],
      },
      {
        text: 'Может, это охранник проверял оборудование?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: -2 } },
        ],
      },
      {
        text: '«Не забудьте»... Это послание. Кому?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  colleague_quitting_dilemma: {
    id: 'colleague_quitting_dilemma',
    speaker: 'Коллега',
    text: 'Я написал заявление. Двадцать раз. И двадцать раз порвал. Знаешь, что меня останавливает? Не страх. Страх я могу преодолеть. Меня останавливает мысль: а что, если на моём месте окажется кто-то хуже? Кто-то, кто не будет мучиться. Кто-то, кто будет удалять стихи с улыбкой. Может, лучше я останусь и буду саботировать изнутри. Маленькие акты неповиновения. Неудалённый комментарий здесь. «Случайная» ошибка в фильтре там.',
    choices: [
      {
        text: 'Ты прав. Саботаж изнутри — мощнее, чем атака снаружи.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'colleague_sabotage_agreed', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Или ты сгоришь изнутри, пытаясь быть двойным агентом.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  colleague_alexander_shadow: {
    id: 'colleague_alexander_shadow',
    speaker: 'Коллега',
    text: 'Александр... Он не то, чем кажется. Все думают — он начальник, он за гильдию. Но я видел его ночью, в серверной. Он сидел перед монитором и читал стихи. Не удалял — читал. У него были слёзы на глазах, Володька. Я клянусь. И когда он заметил меня — он не разозлился. Он просто сказал: «Не всем дано выбирать правильную сторону с первого раза. Иногда нужно постоять на неправильной, чтобы понять разницу.»',
    choices: [
      {
        text: 'Александр — союзник? Нам нужно поговорить с ним.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'alexander_possible_ally', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Или это манипуляция. Начальник, который читает стихи — удобный образ.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  colleague_data_smuggling: {
    id: 'colleague_data_smuggling',
    speaker: 'Коллега',
    text: 'Я придумал способ выносить данные. USB-накопители запрещены — сканеры на выходе. Но есть лазейка: мой термос. Двойные стенки. Внутри — не только чай. Я записываю данные на микрокарту, прячу между стенками, и выношу каждый вечер. Уже три недели. Стихи, протоколы, списки. Всё уходит в Сеть через термос. Смешно, правда? Информационная революция в стальном термосе с ромашковым чаем.',
    choices: [
      {
        text: 'Ты героем не называешь себя, но ты — герой.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'thermos_smuggling_known', flagValue: true },
        ],
      },
      {
        text: 'Термосконтрабанда... Сколько данных ты уже вынес?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'thermos_smuggling_known', flagValue: true },
        ],
      },
    ],
  },
};
