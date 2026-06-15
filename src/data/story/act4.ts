import type { StoryNode } from '@/shared/types/game';

export const STORY_NODES_ACT4: Record<string, StoryNode> = {
  /* ═══════════════════════════════════════════════════════════════════
     ACT 4 — РЕВОЛЮЦИЯ: Слово против системы
     ═══════════════════════════════════════════════════════════════════ */

  act4_transition: {
    id: 'act4_transition',
    text: 'Утро. Город просыпается, не подозревая, что сегодня всё изменится. Ты стоишь на крыше и смотришь на горизонт — башня гильдии сверкает на солнце, как монолит из стекла и лжи. Но ты знаешь: внутри неё — сердце тьмы, Протокол Забвения. И ты остановишь его. Сегодня.',
    contextNote: 'Край крыши на рассвете. Вдали — башня IT-гильдии.',
    ambientSound: 'sounds/ambient/rooftop_wind.ogg',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    guidanceHint: 'Стелс-проникновение или обращение к людям — оба пути ведут к башне.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Время мало — сразу к проникновению',
        next: 'act4_infiltration_prep',
        condition: { flag: 'chose_stealth_path' },
        effects: [{ type: 'setFlag', flag: 'act4_started', flagValue: true }],
      },
      {
        text: 'Готов к проникновению — план из Акта III',
        next: 'act4_infiltration_prep',
        condition: { flag: 'ready_for_infiltration' },
        effects: [{ type: 'setFlag', flag: 'act4_started', flagValue: true }],
      },
      {
        text: 'Начать с обращения к людям',
        next: 'vera_inspiration', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'act4_started', flagValue: true },
          { type: 'addStat', stat: 'energy', value: 10 },
        ],
      },
      {
        text: 'Сначала — техническая подготовка',
        next: 'vera_inspiration',
        effects: [
          { type: 'setFlag', flag: 'act4_started', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
    ],
  },

  vera_inspiration: {
    id: 'vera_inspiration',
    text: 'Солныш — Алина, твоя лучшая подруга с гимназии — подходит с горящими глазами. «Мне приснилось стихотворение,» — говорит она. «Во сне я видела город, где каждый экран показывает стихи. Где код — это поэзия, а не тюрьма. Где слова свободны.» Она протягивает тебе исписанный листок. Её вера — как искра в темноте.',
    contextNote: 'Убежище Сети. Солныш протягивает листок со сном о городе стихов.',
    ambientSound: 'sounds/ambient/underground_hum.ogg',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Это и будет нашим знаком — стихи на каждом экране',
        next: 'act4_public_leader', goldenPath: true,
        effects: [
          { type: 'collectPoem', poemId: 'poem_12' },
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
        ],
      },
      {
        text: 'Спасибо, Солныш. Твои слова дают силы.',
        next: 'act4_public_leader',
        effects: [
          { type: 'collectPoem', poemId: 'poem_12' },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'solnysh', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  act4_public_leader: {
    id: 'act4_public_leader',
    text: 'Ты выходишь на площадь. Людей немного — утро, рабочая смена. Но ты начинаешь говорить. Не кричишь — говоришь. О стихах, спрятанных в коде. О памяти, которую отбирают. О праве на слово. Проходящие останавливаются. Кто-то достаёт терминал и записывает. Тебя не остановить — слова льются сами, как будто город говорит через тебя.',
    contextNote: 'Утренняя площадь. Ты обращаешься к прохожим о праве на слово.',
    ambientSound: 'sounds/ambient/street_morning.ogg',
    speaker: 'narrator',
    sceneId: 'street_winter',
    guidanceHint: 'Мирный марш или цифровая забастовка — оба ведут к башне.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Предложить мирный марш к башне гильдии',
        next: 'act4_peaceful_march', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'setFlag', flag: 'public_speech_done', flagValue: true },
        ],
      },
      {
        text: 'Призвать к цифровой забастовке',
        next: 'act4_peaceful_march',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'public_speech_done', flagValue: true },
        ],
      },
    ],
  },

  act4_peaceful_march: {
    id: 'act4_peaceful_march',
    text: 'Люди выходят на улицы. Не толпа — поток. Стихотворения написаны на плакатах, распечатаны на листовках, светятся на экранах терминалов. Виктория ведёт цифровую координацию — её голос звучит из каждого динамика: «Мы идём за слово. Мы идём за память.» Гильдия разворачивает дроны, но люди не останавливаются.',
    textVariants: {
      highKarma: 'Поток людей несёт стихи — без ярости, с достоинством. Виктория координирует из эфира: «Мы идём за память.» Дроны кружат, но город не отступает.',
      neutralKarma: 'Люди выходят на улицы со стихами на плакатах. Виктория ведёт координацию. Дроны гильдии не останавливают марш.',
      lowKarma: 'Толпа растёт, но в воздухе напряжение. Дроны ближе. Виктория шепчет в эфир: «Держите шаг.»',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Мирный марш. Плакаты со стихами, дроны гильдии над головами.',
    accessibilityAnnounce: 'Марш за свободу слова. Тысячи людей на улицах.',
    ambientSound: 'sounds/ambient/crowd_march.ogg',
    musicCue: 'emotional',
    soundEffect: 'notify',
    speaker: 'narrator',
    sceneId: 'street_winter',
    guidanceNpcId: 'npc_maria',
    guidanceHint: 'Продолжай мирно — каждая жизнь на счету.',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Продолжать марш — мирно и уверенно',
        next: 'act4_march_continues', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addStat', stat: 'energy', value: -10 },
        ],
      },
      {
        text: 'Отвести людей в безопасное место и действовать малой группой',
        next: 'act4_infiltration_prep',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'small_team_approach', flagValue: true },
        ],
      },
    ],
  },

  act4_march_continues: {
    id: 'act4_march_continues',
    text: 'Марш растёт. Сотни, потом тысячи. Люди декламируют стихи хором — Пушкин, Ахматова, Мандельштам — слова, которые гильдия пыталась стереть, теперь звучат на всю улицу. Дроны гильдии кружат, но не атакуют — слишком много свидетелей. Башня гильдии всё ближе. Ты чувствуешь: город на твоей стороне.',
    contextNote: 'Марш тысяч людей. Хор стихов, дроны над головами, башня гильдии впереди.',
    accessibilityAnnounce: 'Тысячи людей декламируют стихи. Башня гильдии близко.',
    ambientSound: 'sounds/ambient/crowd_march.ogg',
    speaker: 'narrator',
    sceneId: 'street_winter',
    guidanceHint: 'Войди в башню, пока дроны в замешательстве.',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Войти в башню — пока дроны в замешательстве',
        next: 'act4_infiltration_prep', goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'Отправить Викторию через сеть — она проникнет цифровым путём',
        next: 'act4_infiltration_prep',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'maria_digital_entry', flagValue: true },
        ],
      },
    ],
  },

  act4_infiltration_prep: {
    id: 'act4_infiltration_prep',
    text: 'План безумен, но других нет. Нужно проникнуть в штаб-квартиру гильдии — в самое сердце системы, которая стирает стихи. Дмитрий, если он на свободе, может помочь изнутри. Украденный пропуск — ключ к двери. Но самое главное — союзник, который прикроет, когда всё пойдёт не так. А оно пойдёт не так.',
    contextNote: 'Убежище Сети. На ящике — план штурма башни гильдии.',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Найди союзника — Дмитрий, Сталкер ЧК или иди один.',
    guidanceNpcId: 'npc_dmitry',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'act4_started', flagValue: true },
      { type: 'triggerQuest', questId: 'guild_infiltration' },
    ],
    choices: [
      {
        text: 'Связаться с Дмитрием — он внутри системы',
        next: 'act4_infiltration_inside', goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'npc_dmitry', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'dmitry_as_ally', flagValue: true },
          { type: 'setFlag', flag: 'guild_ally_found', flagValue: true },
        ],
        condition: { flag: 'dmitry_defected' },
      },
      {
        text: 'Попросить коллегу из офиса — доступ к коридорам',
        next: 'act4_infiltration_inside',
        condition: { flag: 'colleague_help_access' },
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'npc_colleague', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'colleague_as_ally', flagValue: true },
          { type: 'setFlag', flag: 'guild_ally_found', flagValue: true },
        ],
      },
      {
        text: 'Сталкер проведёт через лес — тропа ЧК к гильдии',
        next: 'act4_infiltration_inside',
        condition: { flag: 'tolpa_honorary_chekist' },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 3 },
          { type: 'setFlag', flag: 'tolpa_stalker_route', flagValue: true },
          { type: 'setFlag', flag: 'guild_ally_found', flagValue: true },
          { type: 'triggerQuest', questId: 'tolpa_act4_exfiltration' },
          { type: 'npcChange', npcId: 'npc_chk_stalker', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Идти по маршруту Сталкера — он уже провёл разведку',
        next: 'act4_infiltration_inside',
        condition: { flag: 'tolpa_stalker_route' },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'guild_ally_found', flagValue: true },
        ],
      },
      {
        text: 'Попросить Дмитрия о помощи — он знает ходы',
        next: 'act4_infiltration_inside',
        condition: { flag: 'dmitry_defected' },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'dmitry_as_ally', flagValue: true },
          { type: 'setFlag', flag: 'guild_ally_found', flagValue: true },
        ],
      },
      {
        text: 'Пойти один — меньше риска для других',
        next: 'act4_infiltration_inside',
        effects: [
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'До штурма ещё час. Потратить его на тех, кто дорог.',
        next: 'act4_quiet_hour',
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════
     ТИХИЙ ЧАС — необязательные контемплятивные сцены перед штурмом.
     Вход: act4_infiltration_prep → act4_quiet_hour. Каждая сцена ставит
     флаг quiet_* — концовки-зеркала акта 5/7 читают их в отражениях.
     ═══════════════════════════════════════════════════════════════════ */

  act4_quiet_hour: {
    id: 'act4_quiet_hour',
    text: 'Час. Шестьдесят минут, которые гильдия ещё не отняла. План лежит на ящике из-под микрочипов, исчерченный стрелками, и больше в него смотреть незачем. Снаружи гудит город — неон, серверы, чужие окна. Ты вдруг понимаешь простую вещь: завтра может не быть. А сегодня ещё есть люди, голоса, строки. Один тихий час — на то, что нельзя взять с собой в башню.',
    contextNote: 'Тихий час перед штурмом. План на ящике, город гудит за стеной.',
    ambientSound: 'sounds/ambient/underground_hum.ogg',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Потрать час на близких — или вернись к плану.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Подняться на крышу — Дмитрий курит там один',
        next: 'act4_quiet_rooftop_dmitry',
        condition: { flag: 'dmitry_defected' },
      },
      {
        text: 'Зайти к Зареме — последний чай перед бурей',
        next: 'act4_quiet_tea_zarema',
        condition: { flag: 'zarema_rescued' },
      },
      {
        text: 'Прочитать сообщение от Альберта',
        next: 'act4_quiet_albert_message',
      },
      {
        text: 'Постоять у окна в опенспейсе — в последний раз',
        next: 'act4_quiet_openspace_window',
      },
      {
        text: 'Перечитать первый стих — с которого всё началось',
        next: 'act4_quiet_first_poem',
      },
      {
        text: 'Час истёк. Вернуться к плану.',
        next: 'act4_infiltration_prep',
      },
    ],
  },

  act4_quiet_rooftop_dmitry: {
    id: 'act4_quiet_rooftop_dmitry',
    text: 'Дмитрий стоит у края крыши и курит. Увидев тебя, молча протягивает пачку. Ты не куришь — но берёшь. Сегодня можно. Внизу мигает город: красный, синий, снова красный. Вы не говорите ни слова — всё уже сказано в коде, который он тебе передал, и в дверях, которые он завтра будет держать открытыми. Сигарета догорает. Дмитрий кивает — не тебе, городу. Этого достаточно.',
    contextNote: 'Крыша убежища. Дмитрий курит у края, город мигает внизу.',
    ambientSound: 'sounds/ambient/rooftop_wind.ogg',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    effects: [{ type: 'setFlag', flag: 'quiet_rooftop_dmitry', flagValue: true }],
    choices: [
      {
        text: 'Докурить молча и спуститься вниз',
        next: 'act4_quiet_hour',
        effects: [
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'npcChange', npcId: 'npc_dmitry', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  act4_quiet_tea_zarema: {
    id: 'act4_quiet_tea_zarema',
    text: 'Кухня пахнет домом — единственное место в городе, где этот запах ещё не оцифровали. Зарема ставит чайник, не спрашивая, зачем ты пришёл. Она знает. «Пей,» — говорит она и придвигает варенье. «Герои тоже должны пить чай. Иначе какие из них герои — так, функции.» Чай горячий, сладкий, бесконечный. Ты запоминаешь этот вкус — на случай, если завтра понадобится причина вернуться.',
    contextNote: 'Кухня Заремы. Чай и варенье перед бурей.',
    ambientSound: 'sounds/ambient/kitchen_evening.ogg',
    speaker: 'Зарема',
    sceneId: 'home_evening',
    effects: [{ type: 'setFlag', flag: 'quiet_tea_zarema', flagValue: true }],
    choices: [
      {
        text: 'Допить чай и обнять её на прощание',
        next: 'act4_quiet_hour',
        effects: [
          { type: 'addStat', stat: 'stress', value: -8 },
          { type: 'addStat', stat: 'energy', value: 5 },
          { type: 'npcChange', npcId: 'npc_zarema', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  act4_quiet_albert_message: {
    id: 'act4_quiet_albert_message',
    text: 'Коммуникатор вздрагивает. Альберт: «Я сварил сегодня сто двадцать чашек. Сто девятнадцать — обычные. Одна ждёт тебя — особая, за счёт заведения. Заберёшь, когда закончишь то, что собираешься сделать. Я не спрашиваю что. В «Синей яме» не задают вопросов — здесь наливают.» Внизу приписка, мелко: «Вернись живым, поэт. Кофе остывает быстрее, чем ты думаешь.»',
    contextNote: 'Сообщение от баристы Альберта на коммуникаторе.',
    speaker: 'Альберт',
    sceneId: 'abandoned_factory',
    effects: [{ type: 'setFlag', flag: 'quiet_albert_message', flagValue: true }],
    choices: [
      {
        text: 'Ответить: «Не остынет. Я успею.»',
        next: 'act4_quiet_hour',
        effects: [
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'npcChange', npcId: 'npc_barista', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  act4_quiet_openspace_window: {
    id: 'act4_quiet_openspace_window',
    text: 'Опенспейс ночью — аквариум без рыб. Мониторы спят, кресла развёрнуты так, как их бросили в шесть вечера. Ты подходишь к окну, у которого простоял тысячу обеденных перерывов, глядя на город и не видя его. Теперь видишь: огни, провода, дождь по стеклу — снаружи. Твоё отражение — внутри. Между ними миллиметр стекла и целая жизнь. Завтра ты выберешь, по какую сторону остаться.',
    contextNote: 'Пустой опенспейс ночью. Окно, дождь по стеклу, отражение в стекле.',
    ambientSound: 'sounds/ambient/office_night.ogg',
    speaker: 'narrator',
    sceneId: 'office_day',
    effects: [{ type: 'setFlag', flag: 'quiet_openspace_window', flagValue: true }],
    choices: [
      {
        text: 'Приложить ладонь к стеклу и уйти, не оборачиваясь',
        next: 'act4_quiet_hour',
        effects: [
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  act4_quiet_first_poem: {
    id: 'act4_quiet_first_poem',
    text: 'Тетрадь раскрывается сама — на первой странице, по сгибу, который ты сложил давным-давно. Первый стих. Ты помнишь ночь, когда нашёл его: «Когда в игру вступают деньги, средства, / А при раздаче - жадность, прибыль, куш, / То знаешь ведь, что, как бы ни старался, / Итог один: оркестром будет сыгран туш.» Тогда это были чужие строки. Теперь — диагноз городу, который ты завтра попробуешь вылечить. Ты закрываешь тетрадь. Туш сыграют. Но не по тебе.',
    contextNote: 'Тетрадь с первым стихом — с которого всё началось.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    effects: [{ type: 'setFlag', flag: 'quiet_first_poem', flagValue: true }],
    choices: [
      {
        text: 'Убрать тетрадь во внутренний карман — ближе к сердцу',
        next: 'act4_quiet_hour',
        effects: [
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'collectPoem', poemId: 'poem_1' },
        ],
      },
    ],
  },

  act4_infiltration_inside: {
    id: 'act4_infiltration_inside',
    text: 'Внутри башни — холод и гул серверов. Стены из стекла и хрома отражают твоё напряжённое лицо. Коридоры пусты — Дмитрий молодец, отвёл патрули. Но ты знаешь: на нижних уровнях ждут системные демоны — программы-стражи, которые атакуют любой незнакомый код. Дыхание перехватывает.',
    contextNote: 'Башня гильдии. Гул серверов, пустые коридоры из стекла.',
    ambientSound: 'sounds/ambient/server_room_hum.ogg',
    musicCue: 'tension',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'office_day',
    guidanceHint: 'Пробейся к серверному ядру — осторожно или силой.',
    guidanceObjectiveType: 'visit_location',
    effects: [{ type: 'setFlag', flag: 'guild_ally_found', flagValue: true }],
    choices: [
      {
        text: 'Двигаться к серверному ядру',
        next: 'act4_core_server', goldenPath: true,
        effects: [
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'addStat', stat: 'energy', value: -15 },
          { type: 'combat', enemyType: 'system_daemon' },
          { type: 'setFlag', flag: 'guild_core_accessed', flagValue: true },
        ],
      },
      {
        text: 'Обойти через технический коридор',
        next: 'act4_core_server',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'tech_corridor_used', flagValue: true },
          { type: 'setFlag', flag: 'guild_core_accessed', flagValue: true },
        ],
        condition: { minSkill: { coding: 7 } },
      },
      {
        text: 'Искать доказательства цензуры в офисе Александра',
        next: 'act4_core_server',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'guild_evidence_downloaded', flagValue: true },
          { type: 'setFlag', flag: 'guild_core_accessed', flagValue: true },
        ],
      },
      {
        text: 'Использовать стихотворение «Прорыв» для обхода защиты',
        next: 'act4_core_server',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'poem_bypassed_security', flagValue: true },
          { type: 'setFlag', flag: 'guild_core_accessed', flagValue: true },
          { type: 'setFlag', flag: 'guild_evidence_downloaded', flagValue: true },
        ],
        condition: { minSkill: { writing: 6, coding: 5 } },
      },
    ],
  },

  act4_core_server: {
    id: 'act4_core_server',
    text: 'Серверное ядро. Огромный зал, заполненный мерцающими стойками. В центре — терминал Протокола Забвения, пульсирующий красным. Ты подключаешься, и данные хлынут потоком: стихи — живые. Не просто текст — они дышат, пульсируют, растут. Каждое стихотворение в базе — организм, который гильдия методично убивает. Проект «Паноптикум» — не просто цензура. Это геноцид слова.',
    textVariants: {
      highKarma: 'Ядро пульсирует красным, но ты чувствуешь правоту. Стихи в потоке данных — живые. Их нельзя убить окончательно.',
      neutralKarma: 'Серверное ядро. Терминал Протокола Забвения пульсирует красным. Данные хлынули — стихи дышат.',
      lowKarma: 'Красный свет режет глаза. Кажется, система смотрит в ответ. Но Протокол нужно остановить.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Серверный зал. В центре — терминал Протокола Забвения, пульсирующий красным.',
    accessibilityAnnounce: 'Серверное ядро гильдии. Протокол Забвения активен.',
    ambientSound: 'sounds/ambient/server_room_alarm.ogg',
    musicCue: 'danger',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'office_day',
    guidanceHint: 'Отключи Протокол — или спаси данные перед отключением.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Начать отключение Протокола',
        next: 'act4_protocol_disabled', goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'addStat', stat: 'energy', value: -20 },
          { type: 'setFlag', flag: 'protocol_disable_started', flagValue: true },
        ],
      },
      {
        text: 'Сначала скопировать все данные Хранилища',
        next: 'act4_protocol_disabled',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'vault_data_copied', flagValue: true },
          { type: 'addStat', stat: 'energy', value: -15 },
        ],
        condition: { minSkill: { coding: 6 } },
      },
      {
        text: 'Скачать всё — каждый стих, каждую строку',
        next: 'act4_protocol_disabled',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'addKarma', value: 8 },
          { type: 'setFlag', flag: 'downloaded_all_poems', flagValue: true },
          { type: 'setFlag', flag: 'all_poems_collected', flagValue: true },
          { type: 'setFlag', flag: 'protocol_disable_started', flagValue: true },
        ],
      },
      {
        text: 'Освободить стихи — дать им вырваться в сеть',
        next: 'act4_protocol_disabled',
        effects: [
          { type: 'addKarma', value: 12 },
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'setFlag', flag: 'freed_living_poems', flagValue: true },
          { type: 'setFlag', flag: 'all_poems_collected', flagValue: true },
          { type: 'setFlag', flag: 'protocol_disable_started', flagValue: true },
        ],
        condition: { minKarma: 60 },
      },
      {
        text: 'Уничтожить «Паноптикум» изнутри — стереть цензуру',
        next: 'act4_protocol_disabled',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 4 },
          { type: 'addStat', stat: 'stress', value: 15 },
          { type: 'setFlag', flag: 'panopticon_destroyed', flagValue: true },
          { type: 'setFlag', flag: 'protocol_disable_started', flagValue: true },
        ],
        condition: { minSkill: { coding: 8 } },
      },
    ],
  },

  act4_protocol_disabled: {
    id: 'act4_protocol_disabled',
    text: 'Твои пальцы летают по клавиатуре. Код Протокола — сложный, многослойный, но ты видел его структуру в стихах Дмитрия. Каждая переменная — строка стихотворения. Каждый алгоритм — ритм. Ты понимаешь: чтобы уничтожить Протокол, нужно переписать его. Заменить забвение — памятью. Экран вспыхивает зелёным. Протокол отключён.',
    textVariants: {
      highKarma: 'Экран вспыхивает зелёным. Протокол отключён — память возвращена в код.',
      neutralKarma: 'Пальцы летают по клавиатуре. Экран вспыхивает зелёным. Протокол отключён.',
      lowKarma: 'Зелёный свет слепит. Протокол мёртв — но башня ещё жива.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Терминал вспыхивает зелёным. Протокол Забвения отключён.',
    accessibilityAnnounce: 'Протокол Забвения отключён.',
    musicCue: 'discovery',
    soundEffect: 'quest_complete',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'office_day',
    guidanceHint: 'Бежать или включить трансляцию стихов на весь город.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Бежать — миссия выполнена',
        next: 'act4_escape', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'setFlag', flag: 'protocol_disabled', flagValue: true },
          { type: 'setFlag', flag: 'guild_evidence_downloaded', flagValue: true },
        ],
      },
      {
        text: 'Использовать терминал для трансляции стихов',
        next: 'act4_broadcast_prep',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'protocol_disabled', flagValue: true },
          { type: 'setFlag', flag: 'guild_evidence_downloaded', flagValue: true },
          { type: 'setFlag', flag: 'broadcast_from_core', flagValue: true },
        ],
      },
    ],
  },

  act4_escape: {
    id: 'act4_escape',
    text: 'Сирены. Красный свет. Башня проснулась — Протокол отключён, и система бьёт тревогу. Ты мчишься по коридорам, за тобой — агенты и боевые дроны. Дмитрий блокирует двери одну за другой, давая тебе секунды. Виктория направляет через наушник: «Налево! Лестница! Быстрее!» Ты падаешь, поднимаешься, бежишь.',
    contextNote: 'Погоня по коридорам башни. Сирены, красный свет, голос Виктории в наушнике.',
    ambientSound: 'sounds/ambient/corridor_alarm.ogg',
    musicCue: 'danger',
    accessibilityAnnounce: 'Погоня в башне гильдии. Сирены, агенты за спиной.',
    guidanceHint: 'Прорвись к крыше — Виктория направляет по наушнику.',
    guidanceObjectiveType: 'visit_location',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Прорваться через главный выход',
        next: 'act4_broadcast_prep',
        effects: [
          { type: 'addStat', stat: 'stress', value: 15 },
          { type: 'addStat', stat: 'energy', value: -20 },
          { type: 'combat', enemyType: 'shadow_agent' },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'escaped_guild_hq', flagValue: true },
        ],
      },
      {
        text: 'Уйти через окно на крышу',
        next: 'act4_broadcast_prep', goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'addStat', stat: 'energy', value: -10 },
          { type: 'setFlag', flag: 'escaped_guild_hq', flagValue: true },
        ],
      },
    ],
  },

  act4_broadcast_prep: {
    id: 'act4_broadcast_prep',
    text: 'Ты на крыше. Ветер бьёт в лицо, но ты не чувствуешь холода. Виктория уже подключена к городским передатчикам — её цифровая половина пронизывает каждую антенну, каждый ретранслятор. «Я готова,» — говорит она. «Текст — в системе. Одно слово — и весь город увидит стихи. Все экраны. Все терминалы. Все голограммы.»',
    contextNote: 'Крыша башни. Виктория подключена к городским передатчикам.',
    ambientSound: 'sounds/ambient/rooftop_wind.ogg',
    autoSave: true,
    speaker: 'Виктория',
    sceneId: 'rooftop_edge',
    guidanceNpcId: 'npc_maria',
    guidanceHint: 'Начни вещание — пусть город услышит стихи.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'collectPoem', poemId: 'poem_21' }],
    choices: [
      {
        text: 'Начать трансляцию. Пусть весь город услышит.',
        next: 'act4_broadcast_execute', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'setFlag', flag: 'broadcast_ready', flagValue: true },
        ],
      },
      {
        text: 'Подождать — может быть мирный путь лучше',
        next: 'act4_broadcast_execute',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'setFlag', flag: 'broadcast_ready', flagValue: true },
        ],
      },
    ],
  },

  /** Save/quest back-compat alias → act4_broadcast_prep */
  act4_rooftop_broadcast: {
    id: 'act4_rooftop_broadcast',
    text: 'Крыша. Передающая антенна готова — город ждёт эфира. Виктория кивает: «Пора.»',
    contextNote: 'Крыша. Антенна готова к вещанию.',
    speaker: 'Виктория',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Перейти к подготовке трансляции',
        next: 'act4_broadcast_prep',
        effects: [{ type: 'setFlag', flag: 'broadcast_ready', flagValue: true }],
      },
    ],
  },

  act4_broadcast_execute: {
    id: 'act4_broadcast_execute',
    text: '«Сейчас.» Экраны по всему городу мигают. Реклама, новости, прогноз погоды — всё заменяется стихами. Пушкин на рекламном щите. Ахматова на терминале метро. Мандельштам в голограмме над площадью. Цветаева пульсирует в неоне витрин. Город замирает. Люди останавливаются, поднимают головы. Кто-то плачет. Кто-то шепчет: «Я думал, это забыли.» Стихи — повсюду. Слово — свободно.',
    textVariants: {
      highKarma: 'Город замирает в свете стихов. Люди плачут и улыбаются — слово вернулось на экраны.',
      neutralKarma: 'Экраны по всему городу мигают стихами. Город замирает.',
      lowKarma: 'Эфир захвачен. Гильдия бессильна минуту — стихи на каждом экране.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Стихи на всех экранах города — от рекламы до метро.',
    accessibilityAnnounce: 'Трансляция стихов на весь город началась.',
    ambientSound: 'sounds/ambient/city_broadcast.ogg',
    musicCue: 'emotional',
    soundEffect: 'quest_complete',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    guidanceHint: 'Добавь своё стихотворение — твой голос тоже важен.',
    guidanceObjectiveType: 'collect_item',
    effects: [
      { type: 'setFlag', flag: 'broadcast_hacked', flagValue: true },
      { type: 'setFlag', flag: 'poetry_transmitted', flagValue: true },
      { type: 'setFlag', flag: 'poetry_broadcast_sent', flagValue: true },
      { type: 'setFlag', flag: 'all_poems_collected', flagValue: true },
      { type: 'triggerQuest', questId: 'poetry_broadcast' },
    ],
    choices: [
      {
        text: 'Продолжать трансляцию — все 21 стихотворение',
        next: 'act4_broadcast_aftermath',
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'all_poems_collected', flagValue: true },
        ],
      },
      {
        text: 'Обратиться к городу лично',
        next: 'act4_broadcast_aftermath',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Продекламировать собственное стихотворение в эфир',
        next: 'act4_broadcast_aftermath', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 20 },
          { type: 'addSkill', skill: 'writing', value: 5 },
          { type: 'collectPoem', poemId: 'poem_22' },
          { type: 'setFlag', flag: 'volodka_personal_broadcast', flagValue: true },
        ],
        condition: { minSkill: { writing: 8 }, minKarma: 65 },
      },
    ],
  },

  act4_broadcast_aftermath: {
    id: 'act4_broadcast_aftermath',
    text: 'Трансляция длится час. Потом — гильдия перехватывает управление, экраны гаснут. Но поздно: город уже прочитал. Тысячи людей видели стихи, тысячи запомнили. В соцсетях — шквал постов. На стенах — нарисованные от руки строки. Гильдия может стереть данные, но не память. Где-то в лесу на Зорге, если ты оставил там друзей, у костра тоже смотрят на экран. Ты стоишь на крыше — и мир изменился навсегда.',
    contextNote: 'Час эфира позади. Гильдия гасит экраны, но город помнит стихи.',
    accessibilityAnnounce: 'Трансляция завершена. Город запомнил стихи.',
    ambientSound: 'sounds/ambient/rooftop_wind.ogg',
    musicCue: 'emotional',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    guidanceHint: 'Примирение, борьба или уход — выбор за тобой.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Искать примирение — предложить гильдии диалог',
        next: 'act5_dawn', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'seeking_reconciliation', flagValue: true },
        ],
      },
      {
        text: 'Продолжать борьбу — до полной победы',
        next: 'act5_dawn',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'seeking_victory', flagValue: true },
        ],
      },
      {
        text: 'Уйти — я сделал достаточно',
        next: 'act5_dawn',
        effects: [
          { type: 'addStat', stat: 'stress', value: -10 },
          { type: 'setFlag', flag: 'seeking_exit', flagValue: true },
        ],
      },
    ],
  },

  act5_dawn: {
    id: 'act5_dawn',
    text: 'Рассвет после эфира. Первый настоящий свет пробивается сквозь дым и неон — не вывески, а солнце. Стихи всё ещё мерцают на экранах: гильдия бьётся за контроль, но строки вросли в систему, как корни в асфальт. Альберт пишет: «Я с тобой до конца.» Зарема молчит, но присылает координаты. Виктория шепчет из наушника: «Они готовят ответ. Но город уже не тот. Люди говорят друг с другом — не в терминалы.» Тишина перед последним выбором.',
    contextNote: 'Рассвет на крыше. Сообщения от союзников, тишина перед финалом.',
    ambientSound: 'sounds/ambient/rooftop_wind.ogg',
    musicCue: 'mystery',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    guidanceHint: 'Встреть гильдию, спустись к людям или напиши финальное стихотворение.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'act5_started', flagValue: true },
      { type: 'triggerQuest', questId: 'final_code' },
      { type: 'triggerQuest', questId: 'night_before_dawn' },
    ],
    choices: [
      {
        text: 'Встретить гильдию лицом к лицу',
        next: 'act4_final_choice',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
      {
        text: 'Спуститься к людям — они нуждаются в поддержке',
        next: 'act4_final_choice', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
      {
        text: 'Побыть одному — написать финальное стихотворение',
        next: 'act4_final_choice',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'addStat', stat: 'stress', value: -10 },
        ],
      },
      {
        text: 'Заглянуть к чекистам — они тоже слушали эфир',
        next: 'act4_final_choice',
        condition: { flag: 'tolpa_honorary_chekist' },
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'triggerQuest', questId: 'tolpa_act4_broadcast' },
        ],
      },
    ],
  },

  act4_final_choice: {
    id: 'act4_final_choice',
    text: 'Город замер на перепутье. Гильдия лишилась монополии на информацию, но не сдалась. Сеть выросла, но ещё хрупка. Ты стоишь на краю крыши и смотришь на горизонт. Всё, что ты делал — привело к этому моменту. Теперь — выбор. Не для города. Для тебя. Кто ты — после всего, что произошло? Твои навыки, твоя карма, твои стихи — всё сливается в один ответ. Сделай шаг.',
    textVariants: {
      highKarma: 'Рассвет окрашивает крышу. Ты знаешь, кто ты — выбор ясен, как строка стиха.',
      neutralKarma: 'Город на перепутье. Ты стоишь на краю крыши — решение за тобой.',
      lowKarma: 'Ветер холодный. Гильдия не сдалась. Кто ты после всего — только ты решаешь.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Край крыши после эфира. Финальный выбор пути.',
    accessibilityAnnounce: 'Финальный выбор: кто ты после революции слова.',
    ambientSound: 'sounds/ambient/rooftop_wind.ogg',
    musicCue: 'emotional',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    guidanceHint: 'Создатель, Повстанец, Изгой, Машина или Поэт — выбирай осознанно.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Я Создатель — солью код и поэзию воедино',
        next: 'act5_peaceful_path', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'creator_chosen', flagValue: true },
        ],
        condition: { minKarma: 60, minSkill: { writing: 7 } },
      },
      {
        text: 'Я Повстанец — свобода слова дороже порядка!',
        next: 'act5_revolution_path',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'revolution_chosen', flagValue: true },
        ],
        condition: { minKarma: 60, minSkill: { persuasion: 7 } },
      },
      {
        text: 'Я ухожу. Этот город забрал слишком много.',
        next: 'act5_exile_path',
        effects: [
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'setFlag', flag: 'exile_chosen', flagValue: true },
        ],
        condition: { maxKarma: 40 },
      },
      {
        text: 'Я стану Машиной — код перепишет этот мир',
        next: 'act5_revolution_path',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'machine_chosen', flagValue: true },
        ],
        condition: { minSkill: { coding: 8 }, flag: 'low_empathy' },
      },
      {
        text: 'Я — Поэт. Все стихи ведут меня к истине.',
        next: 'act5_poet_path',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'setFlag', flag: 'poet_chosen', flagValue: true },
        ],
        condition: { flag: 'all_poems_collected' },
      },
      {
        text: 'Я выбираю мир и переговоры',
        next: 'act5_peaceful_path',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'peace_chosen', flagValue: true },
        ],
      },
      {
        text: 'Отдать себя сети — стихи должны жить вечно',
        next: 'act5_ending_sacrifice',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'sacrifice_chosen', flagValue: true },
        ],
        condition: { minSkill: { coding: 7, writing: 7 } },
      },
    ],
  },

};
