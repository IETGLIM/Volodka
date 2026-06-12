import type { StoryNode } from '@/shared/types/game';

export const STORY_NODES_ACT1: Record<string, StoryNode> = {
  /* ─────────────── ACT 1 – PROLOGUE ─────────────── */
  start: {
    id: 'start',
    text: 'Ты просыпаешься от назойливого писка терминала. В правом запястье — знакомый тянущий спазм, напоминание о двенадцати часах за клавиатурой. Тусклый свет монитора едва прорезает полумрак комнаты, и серое отражение ложится на стёкла очков — минус три с половиной, и каждый год чуть хуже. На столе — полупустая кружка растворимого кофе, остывшая часов пять назад; на дне — коричневая плёнка, как осадок прожитого дня. На экране — новое сообщение от IT-гильдии. За окном моросит дождь, и город тонет в привычной серости. Твоё имя — Володька, тебе тридцать три, поясница ноет, и сегодня всё изменится.',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    choices: [
      {
        text: 'Подняться и осмотреться',
        next: 'explore_mode', goldenPath: true,
        effects: [{ type: 'setFlag', flag: 'woke_up', flagValue: true }],
      },
      {
        text: 'Проверить терминал',
        next: 'room_table',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'checked_terminal', flagValue: true },
        ],
      },
    ],
  },

  explore_mode: {
    id: 'explore_mode',
    text: 'Комната небольшая, но уютная в своём роде. Стены увешаны распечатками кода и выцветшими фотографиями. Книжная полка грозит обрушиться под тяжестью томов. Рабочий стол — эпицентр твоей жизни — завален чашками и проводами. Дверь в коридор приоткрыта.',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    choices: [
      { text: 'Подойти к столу', next: 'room_table', goldenPath: true },
      { text: 'Осмотреть книжную полку', next: 'room_bookshelf' },
      { text: 'Выйти в коридор', next: 'corridor_door' },
      { text: 'Свободно исследовать комнату', next: 'explore_mode' },
    ],
  },

  room_table: {
    id: 'room_table',
    text: 'Ты садишься за стол. Три монитора мигают — на среднем открыто незаконченное стихотворение, на левом — логи серверов, на правом — сообщение от IT-гильдии: «Инцидент #4729. Требуется диагностика. Явка обязательна.» Клавиатура ещё тёплая от вчерашней ночи.',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    choices: [
      {
        text: 'Прочитать стихотворение',
        next: 'explore_mode',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Изучить сообщение гильдии',
        next: 'explore_mode',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'read_guild_message', flagValue: true },
        ],
      },
      {
        text: 'Ответить гильдии — я приду',
        next: 'go_to_cafe',
        effects: [
          { type: 'setFlag', flag: 'accepted_guild_quest', flagValue: true },
          { type: 'triggerQuest', questId: 'incident_scroll_4729' },
        ],
      },
      {
        text: 'Встать и выйти в коридор',
        next: 'corridor_door',
        goldenPath: true,
        effects: [{ type: 'transitionScene', sceneId: 'volodka_corridor' }],
      },
    ],
  },

  room_bookshelf: {
    id: 'room_bookshelf',
    text: 'Книжная полка — твой алтарь знаний. Тут вперемешку стоят тома Пушкина и руководства по архитектуре ПО, сборники Ахматовой и «Чистый код» Мартина. Между книгами — засушенный цветок и старая фотография. Ты проводишь пальцем по корешкам, и на пол падает сложенный листок.',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    choices: [
      {
        text: 'Поднять листок — это стихи',
        next: 'explore_mode',
        condition: { missingPoem: 'poem_2' },
        effects: [
          { type: 'collectPoem', poemId: 'poem_2' },
          { type: 'addKarma', value: 2 },
        ],
      },
      {
        text: 'Перечитать знакомые строки',
        next: 'explore_mode',
        condition: { collectedPoem: 'poem_2' },
        effects: [{ type: 'addSkill', skill: 'writing', value: 1 }],
      },
      {
        text: 'Отложить листок, читать дальше',
        next: 'explore_mode',
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
    ],
  },

  corridor_door: {
    id: 'corridor_door',
    text: 'Ты выходишь в коридор коммуналки. Лампочка мигает, отбрасывая нервные тени. У зеркала стоит Алина — для тебя она всегда Солныш: светлые волосы, голубые глаза, лёгкий платок на плечах. Лучшая подруга с гимназии улыбается: «Доброе утро, Володька. Опять всю ночь кодил? Не забывай есть.» У её ног крутится Умка. Из кухни доносится звон посуды — Зарема уже проснулась.',
    speaker: 'narrator',
    sceneId: 'volodka_corridor',
    choices: [
      {
        text: 'Поздороваться с Солныш и осмотреться',
        next: 'corridor_explore_mode',
        goldenPath: true,
        effects: [
          { type: 'npcChange', npcId: 'vera', npcChange: { relation: 3 } },
          { type: 'triggerQuest', questId: 'solnysh_comfort' },
        ],
      },
      { text: 'Пойти на кухню', next: 'kitchen_table' },
      { text: 'Выйти на улицу', next: 'street_bench' },
      { text: 'Вернуться в комнату', next: 'go_home' },
    ],
  },

  corridor_explore_mode: {
    id: 'corridor_explore_mode',
    text: 'Коридор тянется в обе стороны — потёртый линолеум, облупившаяся краска, таблички с фамилиями на дверях соседей. У зеркала — Солныш и Умка; дальше по правой стене — знакомая дверь в комнату Алины и Лёни, откуда пахнет кофе. Лампочка под потолком то гаснет, то вспыхивает.',
    speaker: 'narrator',
    sceneId: 'volodka_corridor',
    choices: [
      { text: 'Поговорить с Солныш', next: 'solnysh_corridor_talk' },
      { text: 'Зайти к Алине и Лёне', next: 'solnysh_door' },
      { text: 'Пойти на кухню', next: 'kitchen_table', goldenPath: true },
      { text: 'Выйти на улицу', next: 'street_bench' },
      { text: 'Вернуться в комнату', next: 'go_home' },
      { text: 'Свободно исследовать коридор', next: 'corridor_explore_mode' },
    ],
  },

  solnysh_corridor_talk: {
    id: 'solnysh_corridor_talk',
    text: '«Володька!» — Алина оборачивается — для тебя она всегда Солныш. Поправляет светлые волосы; голубые глаза усталые, но тёплые. Умка крутится у её ног. «Мы с детства рядом, а сегодня… сегодня мне кажется, что мир слишком серый. Ты меня понимаешь?»',
    speaker: 'Солныш',
    sceneId: 'volodka_corridor',
    choices: [
      {
        text: 'Всё не так плохо — тебя любят, мы рядом',
        next: 'corridor_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'solnysh_comforted', flagValue: true },
          { type: 'npcChange', npcId: 'vera', npcChange: { relation: 8 } },
          { type: 'addKarma', value: 5 },
          { type: 'triggerQuest', questId: 'solnysh_comfort' },
        ],
      },
      {
        text: 'Зайти к вам — поговорим у вас',
        next: 'solnysh_door',
      },
      {
        text: 'Умка сегодня симпатичная',
        next: 'corridor_explore_mode',
        effects: [
          { type: 'npcChange', npcId: 'vera', npcChange: { relation: 3 } },
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
      { text: 'Побежал — увидимся', next: 'corridor_explore_mode' },
    ],
  },

  go_home: {
    id: 'go_home',
    text: 'Ты возвращаешься в свою комнату. Здесь привычно и спокойно. Мониторы всё так же мерцают, и город за окном всё так же сер. Но что-то неуловимо изменилось — может быть, в тебе самом.',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    choices: [
      { text: 'Осмотреться', next: 'explore_mode' },
      { text: 'Сесть за стол', next: 'room_table' },
      { text: 'Осмотреть полку', next: 'room_bookshelf' },
      { text: 'Снова выйти в коридор', next: 'corridor_door' },
      {
        text: 'Лечь спать — нужен отдых',
        next: 'sleep_dream_entrance',
        effects: [{ type: 'addStat', stat: 'energy', value: 30 }, { type: 'addStat', stat: 'stress', value: -15 }],
      },
    ],
  },

  kitchen_table: {
    id: 'kitchen_table',
    text: 'На кухне Зарема ставит перед тобой кружку горячего чая. «Опять не спал всю ночь?» — спрашивает она мягко, но с тревогой в глазах. На столе — хлеб, варенье и старый радиоприёмник, из которого льётся статика. Зарема — единственный человек, который по-настоящему заботится о тебе в этом городе.',
    speaker: 'narrator',
    sceneId: 'home_evening',
    choices: [
      {
        text: 'Поблагодарить Зарему',
        next: 'kitchen_window', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Промолчать и пить чай',
        next: 'kitchen_window',
        effects: [{ type: 'addStat', stat: 'stress', value: -5 }],
      },
    ],
  },

  kitchen_window: {
    id: 'kitchen_window',
    text: 'Ты смотришь в окно. Серые панельные дома уходят к горизонту, между ними — неоновые вывески и голограммы рекламы. Где-то далеко мигает башня IT-гильдии. Дождь усиливается, и город будто смазывается акварелью. «Тебе пора?» — тихо спрашивает Зарема.',
    speaker: 'narrator',
    sceneId: 'home_evening',
    choices: [
      { text: 'Да, мне нужно в кафе «Синяя яма»', next: 'go_to_cafe', goldenPath: true },
      {
        text: 'Ещё немного побуду дома',
        next: 'go_home',
        effects: [{ type: 'addStat', stat: 'energy', value: 10 }],
      },
      {
        text: 'Выйти на балкон — подышать',
        next: 'balcony_thought',
        effects: [{ type: 'addSkill', skill: 'writing', value: 1 }],
      },
    ],
  },

  cafe_enter: {
    id: 'cafe_enter',
    text: 'Кафе «Синяя яма» — странное место. Подвальное помещение, освещённое синими неоновыми трубками. В воздухе висит запах жжёного кофе и жареных орехов. За стойкой — бариста с кибернетическим протезом руки. В углу сидит Альберт — философ-затворник, постоянный гость. Музыка — старый джаз, перемежающийся электронными помехами.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      { text: 'Осмотреться в кафе', next: 'cafe_explore_mode', goldenPath: true },
      {
        text: 'Сесть рядом с Альбертом',
        next: 'cafe_barista',
        effects: [
          { type: 'setFlag', flag: 'met_albert', flagValue: true },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Найти свободный столик',
        next: 'cafe_barista',
        effects: [{ type: 'addStat', stat: 'energy', value: 5 }],
      },
    ],
  },

  cafe_barista: {
    id: 'cafe_barista',
    text: 'Бариста смотрит на тебя с ленивым любопытством. «Обычный или особый?» — спрашивает он, постукивая металлическими пальцами по стойке. Его протез тихо жужжит сервоприводами. На полке за ним — ряды банок с надписями на языках, которых ты не знаешь.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Обычный кофе, пожалуйста',
        next: 'office_alexander',
        goldenPath: true,
        effects: [
          { type: 'addStat', stat: 'energy', value: 15 },
          { type: 'addKarma', value: 1 },
        ],
      },
      {
        text: 'Что за «особый»?',
        next: 'explore_mode',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'asked_special_coffee', flagValue: true },
        ],
        condition: { minKarma: 40 },
      },
    ],
  },

  street_bench: {
    id: 'street_bench',
    text: 'Ты садишься на скамейку у подъезда. Дождь закончился, но воздух всё ещё влажный. Мимо проходят люди — каждый в своём мире, каждый смотрит в свой терминал. Неоновая вывеска «Синяя яма» мигает в переулке напротив. Где-то вдалеке гудит башня гильдии.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      { text: 'Пойти в кафе', next: 'cafe_enter' },
      { text: 'Оглядеть улицу', next: 'street_bench_view', goldenPath: true },
      {
        text: 'Вернуться домой',
        next: 'go_home',
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
    ],
  },

  street_bench_view: {
    id: 'street_bench_view',
    text: 'Улица залита неоновым светом. Рекламные голограммы мерцают на стенах домов, предлагая улучшения, обновления, апгрейды. Стрим-дроны проносятся над головой. В переулке кто-то сидит на корточках — силуэт, почти невидимый в тени. Ты замечаешь, что это женщина, и она смотрит прямо на тебя.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Подойти к незнакомке',
        next: 'maria_curious', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'spotted_maria', flagValue: true },
          { type: 'addKarma', value: 2 },
          { type: 'collectPoem', poemId: 'poem_19' },
        ],
      },
      {
        text: 'Побыстрее уйти в кафе',
        next: 'cafe_enter',
        effects: [{ type: 'addStat', stat: 'stress', value: 5 }],
      },
    ],
  },

  office_alexander: {
    id: 'office_alexander',
    text: 'Офис IT-гильдии — стерильное пространство из стекла и хрома. Александр, лидер гильдии, встречает тебя у дверей. Его лицо — маска профессионального спокойствия, но глаза выдают усталость. «Инцидент #4729 — это не обычный баг,» — говорит он тихо. «Кто-то намеренно внедрил код в систему. Нам нужна твоя помощь.»',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Я помогу. Что нужно сделать?',
        next: 'office_explore_mode', goldenPath: true,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'agreed_help_alexander', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 10 } },
          { type: 'collectPoem', poemId: 'poem_20' },
        ],
      },
      {
        text: 'Сначала расскажи подробности',
        next: 'start_diagnosis',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'asked_details_alexander', flagValue: true },
        ],
      },
      {
        text: 'Мне нужно подумать',
        next: 'office_colleague',
        effects: [{ type: 'addStat', stat: 'stress', value: 5 }],
      },
    ],
  },

  office_colleague: {
    id: 'office_colleague',
    text: 'В офисе за соседним столом сидит коллега — он нервно перебирает провода и бросает тревожные взгляды на экран. «Ты тоже здесь из-за инцидента?» — шёпотом спрашивает он. «Говорят, это связано с старыми архивами... с тем, что стёрли после Краха.» Он оглядывается и добавляет: «Некоторым лучше не лезть в эти файлы.»',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Убедить его рассказать больше',
        next: 'colleague_persuasion_line', goldenPath: true,
        condition: { minSkill: { persuasion: 3 } },
      },
      {
        text: 'Поблагодарить и подойти к Александру',
        next: 'office_alexander',
        effects: [{ type: 'addSkill', skill: 'empathy', value: 1 }],
      },
      {
        text: 'Проигнорировать предупреждение',
        next: 'start_diagnosis',
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'low_empathy', flagValue: true },
        ],
      },
    ],
  },

  maria_curious: {
    id: 'maria_curious',
    text: 'Она поднимает голову. Глаза — два осколка зимнего неба. «Ты — уставший инженер,» — говорит она без вопроса. Не угроза, а констатация. «Я видела твой код в архивах. У тебя другой почерк. Не такой, как у них.» Она протягивает руку, и в ладони блестит чип данных. «Тебе стоит это прочитать. Пока ещё можно.»',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Попрощаться и зайти в кафе',
        next: 'cafe_enter',
        goldenPath: true,
      },
      {
        text: 'Взять чип данных',
        next: 'maria_introduction',
        effects: [
          { type: 'addItem', itemId: 'maria_data_chip', value: 1 },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'accepted_maria_chip', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: -5 } },
          { type: 'triggerQuest', questId: 'maria_connection' },
        ],
      },
      {
        text: 'Кто ты?',
        next: 'explore_mode',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'asked_maria_identity', flagValue: true },
        ],
      },
      {
        text: 'Я не знаю тебя. Уходи.',
        next: 'street_bench',
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'addKarma', value: -3 },
          { type: 'setFlag', flag: 'low_empathy', flagValue: true },
        ],
      },
    ],
  },

  go_to_cafe: {
    id: 'go_to_cafe',
    text: 'Ты направляешься в кафе «Синяя яма». Улицы постепенно заполняются людьми — утренняя смена просыпается. Рекламные голограммы переключаются на утренние новости. В переулке ты замечаешь знакомый силуэт — кажется, кто-то ждёт именно тебя.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      { text: 'Присесть на скамейку у подъезда', next: 'street_bench', goldenPath: true },
      { text: 'Войти в кафе', next: 'cafe_enter' },
      { text: 'Подойти к силуэту', next: 'maria_curious' },
      {
        text: 'Прогуляться — вечер только начинается',
        next: 'friday_arrives',
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
    ],
    effects: [{ type: 'setFlag', flag: 'going_to_cafe', flagValue: true }],
  },

  start_diagnosis: {
    id: 'start_diagnosis',
    text: 'Ты садишься за терминал. На экране — cascading логи инцидента #4729. Код выглядит странно: комментарии на русском, переменные с поэтическими именами, и кое-где — строки, похожие на стихи. Это не обычный вирус. Кто-то зашифровал послание в самом коде. Александр стоит за твоей спиной и молча ждёт.',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Начать расшифровку',
        next: 'fix_success', goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'addStat', stat: 'energy', value: -15 },
          { type: 'setFlag', flag: 'started_decryption', flagValue: true },
        ],
      },
      {
        text: 'Сравнить с архивными данными',
        next: 'office_colleague',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'compared_archives', flagValue: true },
        ],
      },
    ],
  },

  colleague_persuasion_line: {
    id: 'colleague_persuasion_line',
    text: 'Ты наклоняешься ближе и говоришь тихо: «Послушай, если тут замешаны старые архивы — мне нужно знать. Не ради гильдии. Ради правды.» Коллега колеблется. Он оглядывается по сторонам и наконец шепчет: «После Краха были стёрты целые разделы. Но копия... копия может быть в Хранилище. Только доступ туда — только для старших.»',
    speaker: 'narrator',
    sceneId: 'office_day',
    effects: [{ type: 'triggerQuest', questId: 'vault_backup_trial' }],
    choices: [
      {
        text: 'Попросить его помочь с доступом',
        next: 'office_alexander',
        goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'colleague_help_access', flagValue: true },
          { type: 'setFlag', flag: 'vault_access_granted', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Поблагодарить и действовать самостоятельно',
        next: 'office_alexander',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'addKarma', value: 2 },
        ],
      },
    ],
  },

  /* ─── ACT 1 missing nodes ─── */

  fix_success: {
    id: 'fix_success',
    text: 'Твои пальцы летают по клавиатуре. Строки кода складываются в узор — ты видишь закономерность, скрытую за хаосом. Переменные разворачиваются, дешифратор делает последний проход, и на экране проступает текст. Не код. Стихи. Настоящие, живые стихи, спрятанные в недрах серверов гильдии. У тебя перехватывает дыхание.',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Внимательно прочитать стихотворение',
        next: 'office_colleague', goldenPath: true,
        effects: [
          { type: 'collectPoem', poemId: 'poem_1' },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'found_first_poem', flagValue: true },
          { type: 'setFlag', flag: 'read_poem_1', flagValue: true },
          { type: 'setFlag', flag: 'thread_lore_4729', flagValue: true },
        ],
      },
      {
        text: 'Сохранить копию и доложить Александру',
        next: 'office_alexander',
        effects: [
          { type: 'collectPoem', poemId: 'poem_1' },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'reported_poem_to_alexander', flagValue: true },
          { type: 'setFlag', flag: 'read_poem_1', flagValue: true },
          { type: 'setFlag', flag: 'thread_lore_4729', flagValue: true },
        ],
      },
    ],
  },

  balcony_thought: {
    id: 'balcony_thought',
    text: 'Ты выходишь на балкон. Холодный ветер бьёт в лицо, но ты не уходишь — не можешь, потому что город сегодня особенно красноречив. Серверные башни на горизонте пульсируют ровным светом, как мониторы сердечного ритма в больнице, для которой ты когда-то строил кластер. Река Белая внизу отражает неон — зелёный, красный, белый — как повреждённые данные, перетекающие из одного потока в другой. Старые советские панельки стоят вокруг, серые и молчаливые, но ты знаешь: они помнят. Они помнят город до серверов, до «Атмосферы-У», до «Паноптикума». В трещинах их стен — старые данные, проступающие как грунтовые воды. А между ними — новые башни, хромированные и гладкие, без единой трещины, без единой памяти. Где-то там, за неоновыми вывесками, живут люди, которые тоже слышат ритм в машинном коде. Ты чувствуешь, как слова складываются сами — строка за строкой, как будто город диктует. Уфа — сервер с окнами. И сейчас он передаёт тебе пакет данных.',
    speaker: 'narrator',
    sceneId: 'home_evening',
    choices: [
      {
        text: 'Записать стихотворение, родившееся в голове',
        next: 'go_to_cafe',
        goldenPath: true,
        effects: [
          { type: 'collectPoem', poemId: 'poem_3' },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'Просто постоять в тишине',
        next: 'kitchen_table',
        effects: [
          { type: 'addStat', stat: 'stress', value: -10 },
          { type: 'addStat', stat: 'energy', value: 5 },
        ],
      },
      {
        text: 'Вернуться к терминалу — нужно работать',
        next: 'room_table',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  friday_arrives: {
    id: 'friday_arrives',
    text: 'Пятница. Вечер. Сто сорок седьмая пятница с тех пор, как ты ушёл из гильдии. Город зажигает огни, но ты не чувствуешь праздника — только усталость, въевшуюся в кости, как пыль в старые серверы. Комната кажется особенно пустой, когда дверь Заремы закрыта: квартира звучит иначе без её радио, без звона посуды, без тройного стука в стену. Только гул серверов да мигание светодиодов — тусклый пульс машины, которая никогда не спит. Ты садишься на край кровати и смотришь на свои руки. Пальцы ещё помнят клавиатуру — подушечки жёсткие от клавиш, ногти стрижены коротко, как у человека, которому некогда. Строчки кода, строчки стихов — всё сливается. За стеной кто-то включает музыку, и ты вдруг понимаешь, как одинок. Сто сорок семь пятниц. И каждая — как рекурсия, вызывающая саму себя без условия выхода.',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    choices: [
      {
        text: 'Написать стихотворение об одиночестве',
        next: 'go_to_cafe',
        goldenPath: true,
        effects: [
          { type: 'collectPoem', poemId: 'poem_4' },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
      {
        text: 'Выйти из дома — не сидеть же так',
        next: 'street_bench',
        effects: [
          { type: 'addStat', stat: 'energy', value: 5 },
          { type: 'addKarma', value: 1 },
        ],
      },
      {
        text: 'Позвонить Зареме',
        next: 'kitchen_table',
        effects: [
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 3 } },
          { type: 'addStat', stat: 'stress', value: -8 },
          { type: 'collectPoem', poemId: 'poem_16' },
        ],
      },
    ],
  },

  maria_introduction: {
    id: 'maria_introduction',
    text: '«Меня зовут Виктория,» — говорит она, и в её голосе звучит странная нотка, как будто это имя — лишь частичная правда. «Я была аналитиком в гильдии. До Краха. Потом... всё изменилось.» Она смотрит на неоновые отражения в луже. «Я знаю о стихах в коде. Я знаю, кто их пишет. И я знаю, что гильдия их уничтожает. Хочешь узнать больше?»',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Да. Расскажи мне всё.',
        next: 'act2_transition',
        effects: [
          { type: 'collectPoem', poemId: 'poem_6' },
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'maria_introduced', flagValue: true },
        ],
      },
      {
        text: 'Почему я должен тебе верить?',
        next: 'act2_transition',
        effects: [
          { type: 'collectPoem', poemId: 'poem_6' },
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'maria_introduced', flagValue: true },
        ],
      },
      {
        text: 'Мне нужно время подумать',
        next: 'go_to_cafe',
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'setFlag', flag: 'maria_introduced', flagValue: true },
        ],
      },
    ],
  },

};
