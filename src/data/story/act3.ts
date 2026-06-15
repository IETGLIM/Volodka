import type { StoryNode } from '@/shared/types/game';

export const STORY_NODES_ACT3: Record<string, StoryNode> = {
  /* ═══════════════════════════════════════════════════════════════════
     ACT 3 — ВОЙНА: Система наступает
     ═══════════════════════════════════════════════════════════════════ */

  act3_transition: {
    id: 'act3_transition',
    text: 'Недели спокойствия закончились. Гильдия усиливает наблюдение — дроны стали чаще, фильтры — жёстче. На стенах появились плакаты: «Поэзия — паразитическая нагрузка. Сообщайте о подозрительном контенте.» Зарема звонит среди ночи — её голос дрожит. «Володька, они ищут тебя. Будь осторожен.»',
    contextNote: 'Ночной город. Плакаты гильдии предупреждают о «паразитической поэзии».',
    ambientSound: 'sounds/ambient/street_night_rain.ogg',
    speaker: 'narrator',
    sceneId: 'street_night',
    guidanceHint: 'Встреться с Заремой в парке — она в опасности.',
    guidanceObjectiveType: 'visit_location',
    guidanceNpcId: 'npc_zarema',
    choices: [
      {
        text: 'Встретиться с Заремой в парке',
        next: 'park_entrance', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'act3_started', flagValue: true },
          { type: 'setFlag', flag: 'advanced_to_act3', flagValue: true },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'Связаться с Викторией — что происходит?',
        next: 'park_entrance',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'act3_started', flagValue: true },
          { type: 'setFlag', flag: 'advanced_to_act3', flagValue: true },
        ],
      },
    ],
  },

  park_entrance: {
    id: 'park_entrance',
    text: 'Мемориальный парк. Замёрзшие деревья стоят как молчаливые стражи. У подножия старого памятника — высеченные буквы, наполовину стёртые временем и гильдией. Ты проводишь пальцем по камню, и под мхом проступают строки. Камень помнит. Даже когда люди забывают.',
    contextNote: 'Мемориальный парк. На памятнике — стёртые строки под мхом.',
    speaker: 'narrator',
    sceneId: 'park_day',
    guidanceHint: 'Осмотри парк или найди Зарему среди деревьев.',
    guidanceObjectiveType: 'visit_location',
    soundEffect: 'item_use',
    choices: [
      {
        text: 'Осмотреться в парке',
        next: 'park_explore_mode', goldenPath: true,
        effects: [
          { type: 'collectPoem', poemId: 'poem_10' },
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Искать Зарему — она должна быть здесь',
        next: 'act3_zarema_warning',
        effects: [
          { type: 'collectPoem', poemId: 'poem_10' },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  act3_zarema_warning: {
    id: 'act3_zarema_warning',
    text: 'Зарема появляется из-за деревьев, бледная, запыхавшаяся. «Володька,» — она хватает тебя за руку. «Они арестовали троих из Сети. И это не всё — они подбросили мне данные. Я видела, как системный агент положил чип мне в стол. Они готовят облаву. Я... я боюсь.» Её глаза блестят от слёз.',
    contextNote: 'Зарема из-за деревьев — бледная, со слезами на глазах.',
    speaker: 'Зарема',
    sceneId: 'park_day',
    guidanceNpcId: 'npc_zarema',
    guidanceHint: 'Успокой Зарему — она боится облавы.',
    guidanceObjectiveType: 'talk_to_npc',
    choices: [
      {
        text: 'Я не дам тебя в обиду. Пойдём со мной.',
        next: 'act3_zarema_arrest', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'promised_protect_zarema', flagValue: true },
        ],
      },
      {
        text: 'Тебе нужно скрыться. Сейчас же.',
        next: 'act3_zarema_arrest',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
    ],
  },

  act3_zarema_arrest: {
    id: 'act3_zarema_arrest',
    text: 'Утро начинается с крика. Ты выбегаешь в коридор — двое в форме гильдии тащат Зарему к двери. Её глаза — огромные, испуганные — находят тебя. «Володька!» — кричит она. Один из агентов толкает её в спину. «Зарема Хасанова, вы обвиняетесь в хищении данных корпоративного уровня.» Чип данных блестит в руке агента — тот самый, который подбросили.',
    textVariants: {
      highKarma: 'Крик рвёт утро. Агенты тащат Зарему — но ты чувствуешь: правда на твоей стороне. Её взгляд находит тебя: «Володька!» — не мольба о пощаде, а просьба не сдаваться.',
      neutralKarma: 'Утро начинается с крика. Двое в форме гильдии тащат Зарему к двери. «Володька!» — кричит она. Чип в руке агента блестит — подброшенный.',
      lowKarma: 'Коридор сужается. Зарему тащат, и ты не уверен, кого гильдия ищет на самом деле. Её крик режет ухо: «Володька!» Агент с чипом смотрит на тебя оценивающе.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Коридор квартиры. Агенты гильдии уводят Зарему — в руке подброшенный чип.',
    accessibilityAnnounce: 'Арест Заремы. Агенты гильдии уводят её.',
    ambientSound: 'sounds/ambient/corridor_alarm.ogg',
    musicCue: 'danger',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'volodka_corridor',
    guidanceNpcId: 'npc_zarema',
    guidanceHint: 'Реши, как спасти Зарему — Сеть, протест или Виктория.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Срочно собрать Сеть — спасаем Зарему',
        next: 'act3_detention_infiltration',
        goldenPath: true,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'setFlag', flag: 'zarema_arrested', flagValue: true },
          { type: 'setFlag', flag: 'pledge_rescue_zarema', flagValue: true },
          { type: 'setFlag', flag: 'priority_rescue_zarema', flagValue: true },
          { type: 'triggerQuest', questId: 'zarema_rescue' },
        ],
      },
      {
        text: 'Вступиться за Зарему — она невиновна!',
        next: 'act3_zarema_arrest_resist',
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'zarema_arrested', flagValue: true },
          { type: 'setFlag', flag: 'pledge_rescue_zarema', flagValue: true },
          { type: 'triggerQuest', questId: 'zarema_rescue' },
        ],
      },
      {
        text: 'Запомнить лица агентов — потом разберёмся',
        next: 'act3_zarema_arrest_cold',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'setFlag', flag: 'zarema_arrested', flagValue: true },
          { type: 'setFlag', flag: 'noted_guild_agents', flagValue: true },
          { type: 'triggerQuest', questId: 'zarema_rescue' },
        ],
      },
      {
        text: 'Срочно связаться с Викторией — она знает, что делать',
        next: 'act3_underground_meeting',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'zarema_arrested', flagValue: true },
          { type: 'setFlag', flag: 'called_maria_for_help', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 5 } },
          { type: 'triggerQuest', questId: 'zarema_rescue' },
        ],
        condition: { flag: 'maria_introduced', minKarma: 40 },
      },
    ],
  },

  act3_zarema_arrest_resist: {
    id: 'act3_zarema_arrest_resist',
    text: 'Ты хватаешь агента за руку. Он разворачивается — его глаза холодны, как серверный зал. «Не вмешивайся, гражданин. Или хочешь составить компанию?» Второй агент уже тащит Зарему вниз по лестнице. Она оглядывается, и в её взгляде — не страх, а мольба: «Не делай глупостей, Володька. Найди другой путь.» Дверь хлопает. Тишина.',
    contextNote: 'Коридор опустел. За дверью — шаги агентов и Зарема.',
    soundEffect: 'error',
    speaker: 'narrator',
    sceneId: 'volodka_corridor',
    choices: [
      {
        text: 'Бежать к Виктории — нужна помощь Сети',
        next: 'act3_underground_meeting',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Идти в офис гильдии — требовать объяснений',
        next: 'act3_guild_counterattack',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
    ],
  },

  act3_zarema_arrest_cold: {
    id: 'act3_zarema_arrest_cold',
    text: 'Ты стоишь неподвижно, пока шаги затихают на лестнице. Руки сжаты в кулаки так, что ногти впиваются в ладони. Холодный расчёт — единственное, что удерживает тебя от безумия. Ты запоминаешь: агент Смирнов, номер значка 47-К, время — 07:14. Эта информация ещё пригодится. Но сейчас нужно действовать, а не горевать.',
    speaker: 'narrator',
    sceneId: 'volodka_corridor',
    choices: [
      {
        text: 'Связаться с Сетью — нужен план спасения',
        next: 'act3_underground_meeting',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'Начать собственное расследование — кто подбросил чип?',
        next: 'act3_maria_mystery',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'investigating_chip_plant', flagValue: true },
        ],
      },
    ],
  },

  act3_underground_meeting: {
    id: 'act3_underground_meeting',
    text: 'Заброшенный завод на окраине — новое убежище Сети. Под сводами ржавого потолка мерцают экраны. Здесь собираются те, кто готов сражаться за стихи. Альберт сидит в углу, барабаня пальцами по столу. Бариста проверяет каналы связи. Виктория стоит у окна, глядя на огни города. Все смотрят на тебя — и ждут решения.',
    contextNote: 'Под сводами завода — убежище Сети. Виктория у окна, бариста у терминала.',
    ambientSound: 'sounds/ambient/underground_hum.ogg',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Реши приоритет: Зарема, Хранилище или оба.',
    guidanceObjectiveType: 'make_choice',
    guidanceNpcId: 'npc_maria',
    choices: [
      {
        text: 'Мы спасаем Зарему. Это приоритет.',
        next: 'act3_detention_infiltration',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'priority_rescue_zarema', flagValue: true },
        ],
      },
      {
        text: 'Мы защищаем Хранилище. Стихи важнее одного человека.',
        next: 'act3_vault_siege',
        condition: { minSkill: { logic: 3 } },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addKarma', value: -5 },
          { type: 'setFlag', flag: 'priority_defend_vault', flagValue: true },
          { type: 'setFlag', flag: 'vault_under_attack', flagValue: true },
          { type: 'setFlag', flag: 'rally_defenders_met', flagValue: true },
          { type: 'setFlag', flag: 'low_empathy', flagValue: true },
          { type: 'triggerQuest', questId: 'vault_defense' },
        ],
      },
      {
        text: 'Мы делаем и то, и другое. Разделимся.',
        next: 'act3_choice_betrayal',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
        ],
        condition: { minSkill: { persuasion: 5 } },
      },
    ],
  },

  act3_choice_betrayal: {
    id: 'act3_choice_betrayal',
    text: 'Ты стоишь перед невозможным выбором. Зарема в камере — каждая минута промедления может стоить ей жизни. Хранилище горит — каждый потерянный час означает тысячи стёртых стихов. Виктория подходит к тебе и говорит тихо: «Ты не можешь спасти всех, Володька. Но ты можешь спасти то, что важнее всего. Вопрос — что для тебя важнее?»',
    textVariants: {
      highKarma: 'Виктория кладёт руку на плечо. «Ты уже спас столько — но сейчас выбор невозможный только на первый взгляд.»',
      neutralKarma: 'Виктория шепчет: «Зарема или Хранилище. Ты не можешь спасти всех.»',
      lowKarma: 'Виктория смотрит холодно: «Каждый выбор — предательство кого-то. Привыкай.»',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Виктория рядом. Нужно выбрать между Заремой и Хранилищем.',
    accessibilityAnnounce: 'Невозможный выбор: Зарема или Хранилище.',
    autoSave: true,
    musicCue: 'tension',
    speaker: 'Виктория',
    sceneId: 'abandoned_factory',
    guidanceNpcId: 'npc_maria',
    guidanceHint: 'Третий путь возможен при высокой карме и интуиции.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Зарема — мой друг. Я иду за ней.',
        next: 'act3_detention_infiltration',
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 20 } },
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'setFlag', flag: 'chose_zarema_over_vault', flagValue: true },
        ],
      },
      {
        text: 'Хранилище — это память города. Оно важнее.',
        next: 'act3_vault_siege',
        effects: [
          { type: 'addKarma', value: -3 },
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'setFlag', flag: 'chose_vault_over_zarema', flagValue: true },
          { type: 'setFlag', flag: 'vault_under_attack', flagValue: true },
          { type: 'setFlag', flag: 'rally_defenders_met', flagValue: true },
          { type: 'triggerQuest', questId: 'vault_defense' },
        ],
      },
      {
        text: 'Я отказываюсь выбирать. Найду третий путь.',
        next: 'act3_maria_revelation',
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addStat', stat: 'stress', value: 15 },
          { type: 'addSkill', skill: 'intuition', value: 3 },
          { type: 'setFlag', flag: 'refused_choice', flagValue: true },
        ],
        condition: { minKarma: 60 },
      },
    ],
  },

  act3_detention_infiltration: {
    id: 'act3_detention_infiltration',
    text: 'Центр содержания гильдии — серое здание без окон. Виктория достаёт поддельные пропуска, Альберт отвлекает охрану философской декламацией. Ты входишь через служебный ход, сердце колотится так, что кажется — его слышат стены. Коридоры пахнут дезинфекцией и страхом. Камера Заремы — на третьем уровне.',
    contextNote: 'Центр задержания гильдии. Виктория с пропусками, коридоры пахнут страхом.',
    musicCue: 'tension',
    speaker: 'narrator',
    sceneId: 'office_day',
    guidanceNpcId: 'npc_maria',
    guidanceHint: 'Проникни к камере Заремы — тихо или напрямую.',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Двигаться тихо, через вентиляцию',
        next: 'act3_zarema_cell',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'stealth_infiltration', flagValue: true },
          { type: 'setFlag', flag: 'detention_breached', flagValue: true },
        ],
        condition: { minSkill: { coding: 5 } },
      },
      {
        text: 'Использовать поддельный пропуск и идти прямо',
        next: 'act3_zarema_cell', goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'setFlag', flag: 'detention_breached', flagValue: true },
        ],
      },
      {
        text: 'Взломать систему безопасности',
        next: 'act3_zarema_cell',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'hacked_security', flagValue: true },
          { type: 'setFlag', flag: 'detention_breached', flagValue: true },
        ],
        condition: { minSkill: { logic: 6 } },
      },
    ],
  },

  act3_zarema_cell: {
    id: 'act3_zarema_cell',
    text: 'Камера. Зарема сидит на бетонной скамье, обхватив колени. Её лицо — в синяках, но глаза горят. «Володька,» — шепчет она, увидев тебя. «Уходи. Это ловушка — они хотят выйти на Сеть через меня. Я не сказала ничего, но...» За дверью слышны шаги. Время на исходе.',
    contextNote: 'Камера задержания. Зарема на скамье — за дверью шаги.',
    accessibilityAnnounce: 'Зарема в камере предупреждает о ловушке.',
    speaker: 'Зарема',
    sceneId: 'office_day',
    guidanceNpcId: 'npc_zarema',
    guidanceHint: 'Вытащи Зарему или узнай, что она слышала.',
    guidanceObjectiveType: 'talk_to_npc',
    choices: [
      {
        text: 'Вытащить Зарему — Сеть подождёт',
        next: 'act3_zarema_rescue_choice', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Спросить, что она узнала в камере',
        next: 'act3_zarema_rescue_choice',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'asked_zarema_intel', flagValue: true },
        ],
      },
    ],
  },

  act3_zarema_rescue_choice: {
    id: 'act3_zarema_rescue_choice',
    text: 'Шаги всё ближе. Ты стоишь на распутье: вытащить Зарему сейчас — и раскрыть себя, поставить Сеть под удар. Или уйти, сохранить Сеть, но оставить Зарему в руках гильдии. Она смотрит на тебя и тихо говорит: «Делай то, что правильно. Не то, что чувствуешь.»',
    contextNote: 'Шаги за дверью. Зарема ждёт решения.',
    autoSave: true,
    musicCue: 'danger',
    speaker: 'Зарема',
    sceneId: 'office_day',
    guidanceNpcId: 'npc_zarema',
    guidanceHint: 'Спасти Зарему — карма измеряется добротой.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Спасаю тебя. Пошли!',
        next: 'act3_save_zarema', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 15 } },
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'combat', enemyType: 'corporate_golem' },
        ],
      },
      {
        text: 'Мне жаль. Сеть не может пасть.',
        next: 'act3_zarema_farewell',
        effects: [
          { type: 'addKarma', value: -5 },
          { type: 'addStat', stat: 'stress', value: 15 },
          { type: 'setFlag', flag: 'left_zarema', flagValue: true },
          { type: 'setFlag', flag: 'low_empathy', flagValue: true },
        ],
      },
    ],
  },

  act3_save_zarema: {
    id: 'act3_save_zarema',
    text: 'Ты хватаешь Зарему за руку и бежишь. Сирены воют, коридоры заливаются красным светом. Агент гильдии преграждает путь — корпоративный голем, модифицированный охранник. Ты бьёшь его код-инъекцией из чипа Виктории, и он замирает. Вы мчитесь по лестнице, через служебный выход, в переулок. Свобода пахнет морозом и бензином.',
    contextNote: 'Побег из центра задержания. Сирены, красный свет, мороз в переулке.',
    musicCue: 'danger',
    soundEffect: 'quest_complete',
    speaker: 'narrator',
    sceneId: 'street_night',
    guidanceHint: 'Укройся в кафе или иди к Виктории.',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Укрыться в кафе — бариста поможет',
        next: 'act3_barista_safehouse',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'zarema_rescued', flagValue: true },
          { type: 'setFlag', flag: 'escaped_with_zarema', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_17' },
        ],
      },
      {
        text: 'Бежать к Виктории — она знает безопасное место',
        next: 'maria_warm', goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'zarema_rescued', flagValue: true },
        ],
      },
    ],
  },

  act3_zarema_farewell: {
    id: 'act3_zarema_farewell',
    text: 'Зарема не кричит. Она смотрит на тебя — долго, как будто запоминает лицо. «Я понимаю,» — шепчет она. «Сеть важна. Стихи важны. Но если ты когда-нибудь сможешь... не забывай, что я тоже была важна.» Агенты хватают её за плечи. Дверь закрывается. В коридоре пахнет дезинфекцией и твоим выбором.',
    contextNote: 'Зарему уводят. Она не кричит — только смотрит.',
    accessibilityAnnounce: 'Прощание с Заремой. Её уводят агенты.',
    musicCue: 'emotional',
    speaker: 'Зарема',
    sceneId: 'office_day',
    guidanceNpcId: 'npc_zarema',
    choices: [
      {
        text: 'Запомнить её слова и идти к Виктории',
        next: 'maria_warm',
        effects: [
          { type: 'addStat', stat: 'stress', value: 20 },
          { type: 'addStat', stat: 'energy', value: -10 },
          { type: 'setFlag', flag: 'zarema_farewell_heard', flagValue: true },
        ],
      },
    ],
  },

  act3_barista_safehouse: {
    id: 'act3_barista_safehouse',
    text: 'Бариста открывает подсобку без вопросов. «Свои,» — говорит он, сдвигая стеллаж. За ним — ниша с терминалом и матрасом. Зарема опускается на пол, дрожа. Бариста ставит чай — крепкий, без сахара. «Здесь гильдия не слышит. Пока.» На экране мигает канал Сети.',
    contextNote: 'Подсобка «Синей ямы». Бариста укрыл Зарему за стеллажом.',
    ambientSound: 'sounds/ambient/backroom_hum.ogg',
    soundEffect: 'ui_open',
    speaker: 'Бариста',
    sceneId: 'cafe_evening',
    guidanceNpcId: 'npc_barista',
    guidanceHint: 'Отдохни в подсобке — бариста прикроет.',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Поблагодарить и связаться с Викторией',
        next: 'maria_warm',
        effects: [
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 8 } },
          { type: 'addStat', stat: 'stress', value: -8 },
          { type: 'setFlag', flag: 'barista_act3_safehouse', flagValue: true },
        ],
      },
    ],
  },

  maria_warm: {
    id: 'maria_warm',
    text: 'Виктория находит вас в заброшенном гараже. Она приносит одеяла, горячий чай и молчание — то, что нужно сейчас больше слов. Зарема засыпает, и Виктория садится рядом, её глаза мерцают в полумраке странным, неземным светом. «Ты поступил правильно,» — говорит она мягко. «Даже если это было опасно. Может быть, особенно потому что было опасно.»',
    contextNote: 'Заброшенный гараж. Виктория с одеялами; Зарема спит.',
    ambientSound: 'sounds/ambient/underground_hum.ogg',
    speaker: 'Виктория',
    sceneId: 'abandoned_factory',
    guidanceNpcId: 'npc_maria',
    guidanceHint: 'Поблагодари Викторию или спроси, что дальше.',
    guidanceObjectiveType: 'talk_to_npc',
    choices: [
      {
        text: 'Спасибо, Виктория. Я не справился бы без тебя.',
        next: 'act3_maria_mystery',
        goldenPath: true,
        effects: [
          { type: 'collectPoem', poemId: 'poem_11' },
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Зарема в безопасности. Что дальше?',
        next: 'act3_maria_revelation',
        effects: [
          { type: 'collectPoem', poemId: 'poem_11' },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  act3_maria_mystery: {
    id: 'act3_maria_mystery',
    text: 'Ты садишься за терминал и начинаешь копать. Чип, который подбросили Зареме, — не случайная подделка. Серийный номер ведёт к партии, которую гильдия заказывала три месяца назад. Но самое странное — на чипе есть следы кода, который ты уже видел. Тот же почерк. Те же поэтические переменные. Кто-то изнутри гильдии использовал «живой код», чтобы подставить Зарему. Но зачем?',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    effects: [{ type: 'triggerQuest', questId: 'maria_truth' }],
    choices: [
      {
        text: 'Сравнить с инцидентом #4729 — тот же автор?',
        next: 'act3_maria_revelation', goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'found_maria_records', flagValue: true },
        ],
      },
      {
        text: 'Поговорить с Альбертом — он может знать почерк',
        next: 'act3_underground_meeting',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Это Виктория. Она с самого начала манипулировала всеми.',
        next: 'act3_underground_meeting',
        effects: [
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'addKarma', value: -3 },
          { type: 'setFlag', flag: 'suspected_maria', flagValue: true },
          { type: 'setFlag', flag: 'low_empathy', flagValue: true },
        ],
        condition: { maxKarma: 50 },
      },
    ],
  },

  act3_maria_revelation: {
    id: 'act3_maria_revelation',
    text: 'Виктория стоит посреди комнаты, и её глаза мерцают — не метафорически, а буквально. Крошечные искры данных пробегают по радужке. «Хватит скрывать,» — говорит она, и её голос звучит дважды: из горла и из динамиков одновременно. «Я — первый живой код. Не программа, не человек — нечто новое. Стихи, которые вы нашли... я написала их все. Каждое стихотворение в Хранилище — это часть меня.»',
    textVariants: {
      highKarma: 'Искры в глазах Виктории — не угроза, а правда, которую она наконец доверяет тебе. «Я — живой код. И каждый стих в Хранилище — часть меня.»',
      neutralKarma: 'Виктория стоит посреди комнаты. Голос дублируется динамиками: «Я — первый живой код. Стихи в Хранилище — это я.»',
      lowKarma: 'Глаза Виктории мерцают холодно. «Вы хотели правду? Я — код. Всё, что вы читали — мои строки. Бойтесь или примите.»',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Виктория в центре комнаты. В глазах — искры данных.',
    accessibilityAnnounce: 'Виктория раскрывает: она — первый живой код.',
    ambientSound: 'sounds/ambient/digital_pulse.ogg',
    musicCue: 'mystery',
    autoSave: true,
    speaker: 'Виктория',
    sceneId: 'abandoned_factory',
    guidanceNpcId: 'npc_maria',
    guidanceHint: 'Она — стихотворение, которое научилось дышать.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Ты... ты и есть Хранилище? Ты — живая поэзия?',
        next: 'act3_maria_truth_accepted', goldenPath: true,
        effects: [
          { type: 'addStat', stat: 'stress', value: 15 },
          { type: 'addSkill', skill: 'intuition', value: 3 },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'maria_truth_revealed', flagValue: true },
          { type: 'setFlag', flag: 'maria_truth_accepted', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 20 } },
        ],
      },
      {
        text: 'Ты манипулировала нами с самого начала!',
        next: 'act3_maria_truth_accepted',
        effects: [
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'addKarma', value: -5 },
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'maria_truth_revealed', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: -10 } },
        ],
      },
      {
        text: 'Теперь всё встаёт на свои места. Мы должны защитить тебя.',
        next: 'act3_maria_truth_accepted',
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'setFlag', flag: 'maria_truth_revealed', flagValue: true },
          { type: 'setFlag', flag: 'maria_truth_accepted', flagValue: true },
          { type: 'setFlag', flag: 'vowed_protect_maria', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 25 } },
        ],
        condition: { minKarma: 55 },
      },
    ],
  },

  act3_maria_truth_accepted: {
    id: 'act3_maria_truth_accepted',
    text: 'Виктория выдыхает — и ты видишь, как её плечи расслабляются впервые за всё время, что ты её знаешь. «Спасибо,» — шепчет она. «Я ждала этого разговора годами. Большинство убегают. Или... хуже.» Она касается твоей руки — её пальцы тёплые, настоящие. «Моя цифровая половина может проникнуть в любую систему гильдии. Это — наш козырь.»',
    contextNote: 'Виктория расслаблена — впервые без маски.',
    speaker: 'Виктория',
    sceneId: 'abandoned_factory',
    guidanceNpcId: 'npc_maria',
    choices: [
      {
        text: 'Используем это для защиты Хранилища',
        next: 'act3_albert_loyalty', goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'maria_digital_alliance', flagValue: true },
        ],
      },
      {
        text: 'Но это опасно — для тебя самой',
        next: 'act3_albert_loyalty',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  act3_albert_loyalty: {
    id: 'act3_albert_loyalty',
    text: 'Альберт приходит в убежище бледный, как мел. «Они нашли меня,» — говорит он тихо. «Гильдия знает, что я — часть Сети. Они дали мне выбор: сдать всех — или исчезнуть. Навсегда.» Он садится на пол и закрывает лицо руками. «Я был в гильдии, когда они уничтожили архивы поэзии. Я вышел тогда. Но они помнят. И теперь они требуют плату.»',
    contextNote: 'Альберт в убежище — бледный, сломленный.',
    speaker: 'Альберт',
    sceneId: 'abandoned_factory',
    guidanceNpcId: 'npc_albert',
    choices: [
      {
        text: 'Мы не бросаем своих, Альберт.',
        next: 'act3_albert_choice', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Что именно они хотят от тебя?',
        next: 'act3_albert_choice',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'albert_pressure_details', flagValue: true },
        ],
      },
    ],
  },

  act3_albert_choice: {
    id: 'act3_albert_choice',
    text: 'Альберт поднимает голову. В его глазах — борьба, но и решимость. «Я выбрал давно,» — говорит он медленно. «Когда я вышел из гильдии, я поклялся, что никогда не предам слово. И я не предам.» Он встаёт. «Я буду приманкой. Отвлеку их, пока вы готовите ответный ход. Это — мой выбор.»',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Нет. Мы найдём другой путь.',
        next: 'act3_guild_counterattack',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Если ты уверен... Спасибо, Альберт.',
        next: 'act3_guild_counterattack', goldenPath: true,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'setFlag', flag: 'albert_diversion', flagValue: true },
        ],
      },
    ],
  },

  act3_guild_counterattack: {
    id: 'act3_guild_counterattack',
    text: 'Гильдия наносит удар — но не по людям, а по памяти. В ту же ночь серверы Хранилища начинают пульсировать тревожным красным. Виктория прибывает с известием: «Они нашли Хранилище. Не знаю как — может, через Зарему, может, через того, кто за ней следил. У нас есть часы, может быть — минуты, прежде чем они начнут зачистку.»',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Защищать Хранилище — мы не дадим стереть стихи',
        next: 'act3_vault_siege',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'vault_under_attack', flagValue: true },
          { type: 'setFlag', flag: 'rally_defenders_met', flagValue: true },
          { type: 'triggerQuest', questId: 'vault_defense' },
        ],
      },
      {
        text: 'Отвести беглецов в лес — ЧК прикроет на Зорге',
        next: 'act3_hide_network', goldenPath: true,
        condition: { flag: 'tolpa_honorary_chekist' },
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'setFlag', flag: 'vault_under_attack', flagValue: true },
          { type: 'setFlag', flag: 'tolpa_sanctuary_offered', flagValue: true },
          { type: 'setFlag', flag: 'rally_defenders_met', flagValue: true },
          { type: 'setFlag', flag: 'vault_defense_held', flagValue: true },
          { type: 'triggerQuest', questId: 'tolpa_act3_sanctuary' },
          { type: 'triggerQuest', questId: 'vault_defense' },
        ],
      },
      {
        text: 'Спасти что можно — эвакуировать данные',
        next: 'act3_choice_betrayal',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'vault_evacuation_chosen', flagValue: true },
          { type: 'setFlag', flag: 'vault_under_attack', flagValue: true },
          { type: 'triggerQuest', questId: 'vault_defense' },
        ],
      },
      {
        text: 'Спросить Викторию — что она чувствует из сети?',
        next: 'act3_maria_revelation',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 5 } },
        ],
        condition: { flag: 'maria_true_nature_revealed' },
      },
    ],
  },

  act3_vault_siege: {
    id: 'act3_vault_siege',
    text: 'Хранилище осаждено. Экраны мерцают красным — гильдия пробует один барьер за другим. Ты садишься за терминал защиты, и твои пальцы начинают танец. Код Сети — твоя броня, стихи — твоё оружие. Каждый фаервол, который ты поднимаешь, несёт в себе строчку Ахматовой. Каждый контр-взлом — цитату из Мандельштама. Серверы стонут, но держат.',
    contextNote: 'Терминал Хранилища. Экраны пульсируют красным — идёт осада.',
    accessibilityAnnounce: 'Осада Хранилища. Гильдия ломает барьеры.',
    ambientSound: 'sounds/ambient/server_room_alarm.ogg',
    musicCue: 'danger',
    soundEffect: 'notify',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Удержи Хранилище — фаервол, контратака или стих-щит.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Усилить защиту — влить все ресурсы в фаервол',
        next: 'act3_hide_network',
        condition: { minSkill: { coding: 4 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'addStat', stat: 'energy', value: -20 },
          { type: 'setFlag', flag: 'vault_firewall_deployed', flagValue: true },
          { type: 'setFlag', flag: 'vault_defense_held', flagValue: true },
        ],
      },
      {
        text: 'Контратаковать — взломать системы гильдии',
        next: 'act3_hide_network',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'vault_counterattack', flagValue: true },
          { type: 'setFlag', flag: 'vault_firewall_deployed', flagValue: true },
          { type: 'setFlag', flag: 'vault_defense_held', flagValue: true },
        ],
      },
      {
        text: 'Использовать стихотворение как щит — «Прорыв»',
        next: 'act3_hide_network',
        effects: [
          { type: 'collectPoem', poemId: 'poem_8' },
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'poem_shield_used', flagValue: true },
          { type: 'setFlag', flag: 'vault_firewall_deployed', flagValue: true },
          { type: 'setFlag', flag: 'vault_defense_held', flagValue: true },
        ],
        condition: { flag: 'read_poem_1' },
      },
    ],
  },

  act3_aftermath: {
    id: 'act3_aftermath',
    text: 'Ночь после бури. Заброшенный завод тих — только гул серверов да дыхание уставших людей. Хранилище устояло — или не устояло. Зарема на свободе — или всё ещё в плену. Виктория открыла свою тайну — или продолжает скрывать. Но одно ясно: отступать некуда. Война началась, и ты в самом её центре.',
    contextNote: 'Тихая ночь на заводе после осады.',
    ambientSound: 'sounds/ambient/underground_hum.ogg',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Собраться и спланировать ответный удар',
        next: 'act3_prepare_counter',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'ready_for_infiltration', flagValue: true },
        ],
      },
      {
        text: 'Побыть с людьми — они тоже устали',
        next: 'act3_prepare_counter',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addStat', stat: 'stress', value: -10 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Написать стихотворение о пережитом',
        next: 'act3_prepare_counter',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'addKarma', value: 5 },
          { type: 'collectPoem', poemId: 'poem_15' },
        ],
      },
    ],
  },

  act3_hide_network: {
    id: 'act3_hide_network',
    text: 'Вы прячетесь в старом бомбоубежище под городом. Бетонные стены, тусклый свет, гул труб. Но здесь — безопасно. Члены Сети собираются один за другим — испуганные, но не сломленные. Виктория сканирует сеть через свою цифровую половину. «Они активировали Протокол Забвения,» — говорит она. «Стирание начнётся через 72 часа.»',
    contextNote: 'Бомбоубежище под городом. Сеть прячется; Виктория сканирует эфир.',
    ambientSound: 'sounds/ambient/bunker_hum.ogg',
    accessibilityAnnounce: 'Сеть ушла в подполье. Протокол Забвения — 72 часа.',
    speaker: 'Виктория',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Спланируй ответный удар или эвакуацию в лес ЧК.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'network_hidden', flagValue: true },
      { type: 'setFlag', flag: 'tolpa_act3_hide_sync', flagValue: true },
    ],
    choices: [
      {
        text: 'Мы должны нанести удар первыми',
        next: 'act3_prepare_counter',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'offensive_strategy', flagValue: true },
        ],
      },
      {
        text: 'Нужно спасти Хранилище — остальное подождёт',
        next: 'act3_prepare_counter', goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'Связаться с ЧК — лес на Зорге примет беглецов',
        next: 'act3_prepare_counter',
        condition: { flag: 'tolpa_member' },
        effects: [
          { type: 'setFlag', flag: 'tolpa_sanctuary_offered', flagValue: true },
          { type: 'triggerQuest', questId: 'tolpa_act3_sanctuary' },
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'chk_ru', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  poem_virus_truth: {
    id: 'poem_virus_truth',
    text: 'Код стихотворения пульсирует на экране — и вдруг ты видишь правду. Стихи — это не просто текст. Это вирус. Вирус, который восстанавливает стёртые данные. Каждый стих — антидот против забвения. Гильдия не уничтожает стихи потому что они «опасны» — она уничтожает их потому что они лечат.',
    contextNote: 'Терминал в офисе. Код стихотворения пульсирует — открытие о природе стихов.',
    accessibilityAnnounce: 'Открытие: стихи — вирус против забвения.',
    ambientSound: 'sounds/ambient/digital_pulse.ogg',
    speaker: 'narrator',
    sceneId: 'office_day',
    guidanceHint: 'Осознай открытие — или расскажи Сети.',
    guidanceNpcId: 'npc_maria',
    guidanceObjectiveType: 'make_choice',
    autoSave: true,
    choices: [
      {
        text: 'Осознать масштаб открытия',
        next: 'act3_prepare_counter',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 3 },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'poem_virus_revealed', flagValue: true },
        ],
      },
      {
        text: 'Рассказать Сети о природе стихов',
        next: 'act3_prepare_counter',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'addKarma', value: 8 },
          { type: 'setFlag', flag: 'poem_virus_revealed', flagValue: true },
          { type: 'npcChange', npcId: 'npc_maria', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  act3_prepare_counter: {
    id: 'act3_prepare_counter',
    text: 'План созревает в тишине бомбоубежища. Дмитрий может отключить внешнюю защиту гильдии изнутри. Виктория проникнет в серверы через цифровую сеть. Альберт создаст диверсию на входе. А ты — ты должен будешь добраться до ядра и отключить Протокол Забвения навсегда. Всё или ничего.',
    contextNote: 'Бомбоубежище. На столе — план штурма гильдии.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Согласуй план — затем встреться с Дмитрием.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Я готов. Когда начинаем?',
        next: 'act3_dmitry_briefing', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'counter_plan_ready', flagValue: true },
        ],
      },
      {
        text: 'А если план провалится?',
        next: 'act3_dmitry_briefing',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  act3_dmitry_briefing: {
    id: 'act3_dmitry_briefing',
    text: 'Дмитрий приходит через зашифрованный канал — голограмма дрожит, но голос твёрдый. «Протокол Забвения запускается из ядра на минус третьем. Я открою внешний периметр за тридцать секунд — не больше. Виктория должна удержать цифровой фронт. Альберт — шум на входе. Тебе — ядро. И Володька...» — пауза. «Не думай о карме гильдии. Думай о строках, которые ещё не написаны.»',
    contextNote: 'Голограмма Дмитрия в бомбоубежище. Финальный брифинг перед штурмом.',
    accessibilityAnnounce: 'Дмитрий передаёт план проникновения в ядро.',
    soundEffect: 'notify',
    speaker: 'Дмитрий',
    sceneId: 'abandoned_factory',
    guidanceNpcId: 'office_dmitry',
    guidanceHint: 'Запомни план Дмитрия — 30 секунд на периметр.',
    guidanceObjectiveType: 'talk_to_npc',
    choices: [
      {
        text: 'Понял. Иду на крышу — час перед рассветом.',
        next: 'act3_decision_point',
        goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'dmitry_briefing_complete', flagValue: true },
          { type: 'addStat', stat: 'energy', value: -5 },
        ],
      },
    ],
  },

  act3_decision_point: {
    id: 'act3_decision_point',
    text: 'Час перед рассветом. Все смотрят на тебя. Зарема — с гордостью и страхом. Альберт — с тихой решимостью. Виктория — с чем-то большим, чем доверие. Дмитрий шлёт последнее сообщение: «Я готов. Удачи.» Ты стоишь перед выбором, который определит всё. Не для города — для себя. Кто ты, после всего, что пережил? Каждое решение, каждая доброта, каждая строчка кода и каждая строчка стиха — всё привело к этому мигу.',
    textVariants: {
      highKarma: 'Рассвет близко. Виктория кивает — в её взгляде вера. Зарема сжимает твою руку. Ты знаешь, кто ты.',
      neutralKarma: 'Час перед рассветом. Все ждут твоего слова.',
      lowKarma: 'Рассвет серый. Даже Виктория не смотрит в глаза. Выбор — твой и только твой.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Край крыши перед рассветом. Сеть ждёт твоего решения.',
    accessibilityAnnounce: 'Решающий выбор перед Актом IV.',
    ambientSound: 'sounds/ambient/rooftop_wind.ogg',
    musicCue: 'emotional',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    guidanceHint: 'Твой путь определяет финал — карма, навыки и собранные стихи.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Я напишу новый мир — код и поэзия станут одним',
        next: 'act4_transition', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'setFlag', flag: 'chose_creator_path', flagValue: true },
          { type: 'addSkill', skill: 'writing', value: 2 },
        ],
        condition: { minKarma: 60, minSkill: { writing: 7 } },
      },
      {
        text: 'Мы выходим открыто — город должен услышать правду!',
        next: 'act4_transition',
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'setFlag', flag: 'chose_rebel_path', flagValue: true },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
        ],
        condition: { minKarma: 60, minSkill: { persuasion: 7 } },
      },
      {
        text: 'Я перепишу систему изнутри — код сильнее слов',
        next: 'act4_transition',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'setFlag', flag: 'chose_machine_path', flagValue: true },
        ],
        condition: { minSkill: { coding: 8 }, flag: 'low_empathy' },
      },
      {
        text: 'Я ухожу — этот город забрал слишком много',
        next: 'act4_transition',
        effects: [
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'setFlag', flag: 'chose_exile_path', flagValue: true },
        ],
        condition: { maxKarma: 40 },
      },
      {
        text: 'Все стихи звучат внутри меня — я знаю, что делать',
        next: 'act4_transition',
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'setFlag', flag: 'chose_poet_path', flagValue: true },
        ],
        condition: { flag: 'all_poems_collected' },
      },
      {
        text: 'Мы выходим открыто. Город должен знать.',
        next: 'act4_transition',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'chose_public_path', flagValue: true },
        ],
      },
      {
        text: 'Действуем скрытно. Проникаем и отключаем.',
        next: 'act4_infiltration_prep',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'chose_stealth_path', flagValue: true },
          { type: 'setFlag', flag: 'ready_for_infiltration', flagValue: true },
        ],
      },
    ],
  },

};
