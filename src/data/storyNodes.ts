/* ─── Volodka RPG – story nodes ─── */

import type { StoryNode } from '@/shared/types/game';

export const STORY_NODES: Record<string, StoryNode> = {
  /* ─────────────── ACT 1 – PROLOGUE ─────────────── */
  start: {
    id: 'start',
    text: 'Ты просыпаешься от назойливого писка терминала. В правом запястье — знакомый тянущий спазм, напоминание о двенадцати часах за клавиатурой. Тусклый свет монитора едва прорезает полумрак комнаты, и серое отражение ложится на стёкла очков — минус три с половиной, и каждый год чуть хуже. На столе — полупустая кружка растворимого кофе, остывшая часов пять назад; на дне — коричневая плёнка, как осадок прожитого дня. На экране — новое сообщение от IT-гильдии. За окном моросит дождь, и город тонет в привычной серости. Твоё имя — Володька, тебе тридцать три, поясница ноет, и сегодня всё изменится.',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    choices: [
      {
        text: 'Подняться и осмотреться',
        next: 'explore_mode',
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
      { text: 'Подойти к столу', next: 'room_table' },
      { text: 'Осмотреть книжную полку', next: 'room_bookshelf' },
      { text: 'Выйти в коридор', next: 'corridor_door' },
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
        effects: [
          { type: 'addKarma', value: 2 },
        ],
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
    text: 'Ты выходишь в узкий коридор коммуналки. Лампочка мигает, отбрасывая нервные тени. Из кухни доносится звон посуды — видимо, Зарема уже проснулась. Дверь на лестничную клетку прикрыта, но сквозняк тянет холодом. Запах кофе смешивается с запахом сырости.',
    speaker: 'narrator',
    sceneId: 'volodka_corridor',
    choices: [
      { text: 'Пойти на кухню', next: 'kitchen_table' },
      { text: 'Выйти на улицу', next: 'street_bench' },
      { text: 'Вернуться в комнату', next: 'go_home' },
    ],
  },

  go_home: {
    id: 'go_home',
    text: 'Ты возвращаешься в свою комнату. Здесь привычно и спокойно. Мониторы всё так же мерцают, и город за окном всё так же сер. Но что-то неуловимо изменилось — может быть, в тебе самом.',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    choices: [
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
        next: 'kitchen_window',
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
      { text: 'Да, мне нужно в кафе «Синяя яма»', next: 'go_to_cafe' },
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
      { text: 'Подойти к баристе', next: 'cafe_barista' },
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
        next: 'explore_mode',
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
      { text: 'Оглядеть улицу', next: 'street_bench_view' },
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
        next: 'maria_curious',
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
        next: 'start_diagnosis',
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
        next: 'colleague_persuasion_line',
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
        next: 'fix_success',
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
    effects: [{ type: 'triggerQuest', questId: 'vault_backup_trial' }],
  },

  colleague_persuasion_line: {
    id: 'colleague_persuasion_line',
    text: 'Ты наклоняешься ближе и говоришь тихо: «Послушай, если тут замешаны старые архивы — мне нужно знать. Не ради гильдии. Ради правды.» Коллега колеблется. Он оглядывается по сторонам и наконец шепчет: «После Краха были стёрты целые разделы. Но копия... копия может быть в Хранилище. Только доступ туда — только для старших.»',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Попросить его помочь с доступом',
        next: 'office_alexander',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'colleague_help_access', flagValue: true },
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
        next: 'office_colleague',
        effects: [
          { type: 'collectPoem', poemId: 'poem_1' },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'found_first_poem', flagValue: true },
          { type: 'setFlag', flag: 'read_poem_1', flagValue: true },
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

  /* ═══════════════════════════════════════════════════════════════════
     ACT 2 — СЕТЬ: Подпольная поэзия
     ═══════════════════════════════════════════════════════════════════ */

  act2_transition: {
    id: 'act2_transition',
    text: 'Прошли дни с момента инцидента. Ты не можешь перестать думать о зашифрованных стихах в коде. Город продолжает жить — неоновые вывески мигают, дроны жужжат, люди смотрят в терминалы. Но под поверхностью пульсирует что-то иное. Что-то, что ждёт, когда ты его найдёшь.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Вернуться в кафе — там могут быть ответы',
        next: 'act2_albert_hint',
        effects: [{ type: 'setFlag', flag: 'act2_started', flagValue: true }, { type: 'setFlag', flag: 'advanced_to_act2', flagValue: true }, { type: 'advanceAct' }],
      },
      {
        text: 'Искать Викторию — она знает больше',
        next: 'act2_maria_search',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'act2_started', flagValue: true },
          { type: 'setFlag', flag: 'advanced_to_act2', flagValue: true },
          { type: 'advanceAct' },
        ],
      },
    ],
  },

  act2_albert_hint: {
    id: 'act2_albert_hint',
    text: 'Альберт сидит в своём углу, но сегодня он напряжён. Его пальцы постукивают по столу — нервный ритм, не похожий на обычную созерцательность. «Володька,» — говорит он тихо, — «тебе не кажется странным, что стихи появились именно в коде гильдии? Это не случайность. Кто-то хотел, чтобы их нашли. Но кто-то другой — чтобы уничтожили.»',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Ты знаешь, кто мог их туда поместить?',
        next: 'act2_albert_network_hint',
        effects: [{ type: 'addSkill', skill: 'logic', value: 1 }],
      },
      {
        text: 'Может, это старый код — до Краха?',
        next: 'act2_albert_pre_crash',
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
    ],
  },

  act2_albert_network_hint: {
    id: 'act2_albert_network_hint',
    text: 'Альберт оглядывается и понижает голос. «Есть люди... не просто люди — сеть. Они верят, что код и поэзия — одно. Что стихи, встроенные в программы, нельзя стереть, не разрушив саму систему. Я слышал слухи, но никогда не видел доказательств. До сих пор.» Он смотрит тебе в глаза. «Инцидент #4729 — это их рук дело. Или их приглашение.»',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Как мне найти эту сеть?',
        next: 'act2_maria_search',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'albert_network_hint', flagValue: true },
        ],
      },
      {
        text: 'Мне не нужны заговоры. Мне нужна правда.',
        next: 'act2_maria_search',
        effects: [{ type: 'addKarma', value: 2 }],
      },
    ],
  },

  act2_albert_pre_crash: {
    id: 'act2_albert_pre_crash',
    text: '«До Краха...» — Альберт задумывается. «До Краха существовал проект. Неофициальный. Программисты-поэты встраивали стихи в структуру данных — в комментарии, в имена переменных, даже в алгоритмы. Это называлось «живой код». Код, который не просто работает, но и чувствует. Гильдия после Краха объявила это «паразитической нагрузкой» и начала зачистку.»',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Но кто-то продолжает традицию?',
        next: 'act2_albert_network_hint',
        effects: [{ type: 'addSkill', skill: 'writing', value: 1 }],
      },
      {
        text: '«Живой код» — звучит как миф.',
        next: 'act2_maria_search',
        effects: [{ type: 'addSkill', skill: 'logic', value: 1 }],
      },
    ],
  },

  act2_maria_search: {
    id: 'act2_maria_search',
    text: 'Ты идёшь по вечерним улицам. Неоновые вывески отражаются в мокром асфальте. Ты ищешь Викторию — но она находит тебя первой. Из тени между двумя зданиями выступает знакомый силуэт. «Ты готов,» — говорит она без приветствия. «Готов к чему?» — спрашиваешь ты. «К правде о том, что скрывается под городом. Под кодом. Под всем.»',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Веди меня.',
        next: 'act2_maria_meeting_place',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Сначала объясни — что за сеть?',
        next: 'act2_maria_explains_network',
        effects: [{ type: 'addSkill', skill: 'logic', value: 1 }],
      },
    ],
  },

  act2_maria_explains_network: {
    id: 'act2_maria_explains_network',
    text: '«Сеть,» — Виктория произносит это слово с почти религиозным трепетом. «Это не организация. Это... ритм. Люди, которые слышат стихи в машинном коде. Программисты, которые не могут не писать поэзию в комментариях. Хакеры, которые прячут Ахматову в лог-файлах. Мы — Сеть. И мы существуем, пока существует хотя бы одна строка стиха в цифровом мире.»',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Я хочу стать частью этого.',
        next: 'act2_maria_meeting_place',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'network_willing', flagValue: true },
        ],
      },
      {
        text: 'Это звучит красиво, но опасно.',
        next: 'act2_maria_meeting_place',
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  act2_maria_meeting_place: {
    id: 'act2_maria_meeting_place',
    text: 'Виктория ведёт тебя через лабиринт переулков. Вы проходите мимо закрытых магазинов, мимо спящих бездомных, мимо патрульных дронов, зависших над перекрёстками. Наконец она останавливается у неприметной двери в подвале. На косяке нацарапан символ — свиток и единица. «За этой дверью — Сеть,» — шепчет она. «Но войти может не каждый. Докажи, что ты — свой.»',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Продекламировать стихотворение из найденных',
        next: 'act2_network_initiation',
        effects: [
          { type: 'setFlag', flag: 'recited_poem_initiation', flagValue: true },
          { type: 'addKarma', value: 5 },
          { type: 'triggerQuest', questId: 'network_initiation' },
        ],
        condition: { minKarma: 30 },
      },
      {
        text: 'Показать чип данных Виктории как пароль',
        next: 'act2_network_initiation',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'triggerQuest', questId: 'network_initiation' },
        ],
        condition: { flag: 'accepted_maria_chip' },
      },
      {
        text: 'Я не готов. Мне нужно больше информации.',
        next: 'act2_network_hesitation',
        effects: [{ type: 'addStat', stat: 'stress', value: 5 }],
      },
    ],
  },

  act2_network_hesitation: {
    id: 'act2_network_hesitation',
    text: 'Виктория смотрит на тебя с разочарованием, но не с гневом. «Я понимаю,» — говорит она тихо. «Страх — естественная реакция. Но знай: каждый день промедления — это стих, который стирается навсегда. Гильдия не дремлет. Когда будешь готов — возвращайся. Дверь будет открыта.» Она растворяется в тени, оставляя тебя одного в переулке.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Вернуться к двери — я готов',
        next: 'act2_network_initiation',
        effects: [
          { type: 'triggerQuest', questId: 'network_initiation' },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
      {
        text: 'Уйти и подумать',
        next: 'act2_cafe_reflection',
        effects: [{ type: 'addSkill', skill: 'empathy', value: 1 }],
      },
    ],
  },

  act2_cafe_reflection: {
    id: 'act2_cafe_reflection',
    text: 'Ты сидишь в «Синей яме», обхватив кружку обеими руками. Кофё давно остыл. Бариста бросает на тебя тревожные взгляды. За окном моросит дождь. Ты думаешь о стихах, спрятанных в коде, о Виктории, о Сети. Что-то происходит в этом городе — что-то большое. И ты уже не можешь остаться в стороне.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      { text: 'Вернуться к двери Сети', next: 'act2_network_initiation' },
      {
        text: 'Поговорить с баристой',
        next: 'act2_barista_conversation',
        effects: [{ type: 'addSkill', skill: 'persuasion', value: 1 }],
      },
      {
        text: 'Посидеть в тишине до закрытия',
        next: 'cafe_evening_end',
        effects: [{ type: 'addSkill', skill: 'writing', value: 1 }],
      },
      {
        text: 'Пойти в библиотеку — там должны быть старые архивы',
        next: 'library_entrance',
        effects: [{ type: 'addSkill', skill: 'logic', value: 1 }],
      },
    ],
  },

  act2_barista_conversation: {
    id: 'act2_barista_conversation',
    text: 'Бариста пододвигается ближе. Его металлическая рука тихо жужжит. «Слышал, ты ищешь что-то,» — говорит он негромко. «Могу помочь. У меня есть задняя комната. Никто не знает о ней — даже гильдия. Если тебе нужно место для... работы.» Он подмигивает, и ты замечаешь на его запясте маленькую татуировку — свиток и единица.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Ты тоже из Сети?',
        next: 'act2_barista_revealed',
        effects: [
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Мне нужно подумать об этом',
        next: 'act2_network_initiation',
        effects: [{ type: 'addSkill', skill: 'logic', value: 1 }],
      },
    ],
  },

  act2_barista_revealed: {
    id: 'act2_barista_revealed',
    text: '«Из Сети?» — он усмехается. «Я — узел Сети. Кафе — мой терминал. Каждый «особый» кофе, который я подаю — это зашифрованное сообщение. Каждый третий вторник в подсобку приходят люди, и мы читаем стихи вслух, пока серверы гильдии перезагружаются. Ты можешь использовать заднюю комнату. Договорились?»',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Договорились. Это будет явочная квартира.',
        next: 'act2_safehouse_agreed',
        effects: [
          { type: 'setFlag', flag: 'cafe_safehouse_agreed', flagValue: true },
          { type: 'addKarma', value: 3 },
          { type: 'triggerQuest', questId: 'cafe_safehouse' },
        ],
      },
      {
        text: 'Сначала мне нужно войти в Сеть официально',
        next: 'act2_network_initiation',
        effects: [{ type: 'addSkill', skill: 'writing', value: 1 }],
      },
    ],
  },

  act2_safehouse_agreed: {
    id: 'act2_safehouse_agreed',
    text: 'Бариста кивает и протягивает ключ-карту. «Подсобка. Стеллаж с кофеварками — сдвинь вторую полку. За ней — терминал. Старый, но рабочий. Зашифрованный канал — мой подарок Сети.» Ты берёшь ключ-карту. Она тёплая на ощупь — как будто живая.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Осмотреть подсобку',
        next: 'act2_safehouse_terminal',
        effects: [
          { type: 'addItem', itemId: 'vault_key_fragment', value: 1 },
          { type: 'setFlag', flag: 'safehouse_terminal_installed', flagValue: true },
        ],
      },
      {
        text: 'Поблагодарить и идти к Виктории',
        next: 'act2_network_initiation',
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  act2_safehouse_terminal: {
    id: 'act2_safehouse_terminal',
    text: 'Подсобка тесная, пахнет обжаренными зёрнами и озоном. За стеллажом — ниша, в которой стоит древний терминал. Экран мерцает зелёным, как старый монитор из до-Краховских времён. На нём уже открыт зашифрованный канал связи. В углу экрана мигает иконка — конверт с текстом. Кто-то уже прислал сообщение.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Прочитать сообщение',
        next: 'act2_safehouse_message',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'secure_channel_tested', flagValue: true },
        ],
      },
      {
        text: 'Установить дополнительную защиту',
        next: 'act2_safehouse_message',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'safehouse_extra_security', flagValue: true },
        ],
        condition: { minSkill: { coding: 5 } },
      },
    ],
  },

  act2_safehouse_message: {
    id: 'act2_safehouse_message',
    text: 'Сообщение простое: «Добро пожаловать в Сеть. Твоё стихотворение — ключ. Хранилище ждёт. — Д.» Кто такой Д.? Дмитрий? Тот самый разработчик из гильдии? Если он в Сети — значит, у вас есть союзник внутри. Это меняет всё.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Ответить на сообщение',
        next: 'act2_dmitry_contact',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'contacted_dmitry_network', flagValue: true },
        ],
      },
      {
        text: 'Идти на посвящение в Сеть',
        next: 'act2_network_initiation',
        effects: [{ type: 'addKarma', value: 2 }],
      },
    ],
  },

  act2_dmitry_contact: {
    id: 'act2_dmitry_contact',
    text: 'Ты печатаешь ответ на зелёном экране. Секунды тишины. Затем — ответ: «Я знаю, кто ты. Ты расшифровал инцидент #4729. Это я его создал. Каждый стих в том коде — мой. Мне нужна помощь выбраться из гильдии. Встретимся завтра в офисе. Только будь осторожен — Александр следит.»',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Согласиться на встречу',
        next: 'act2_dmitry_office_meeting',
        effects: [
          { type: 'triggerQuest', questId: 'dmitry_defection' },
          { type: 'setFlag', flag: 'dmitry_meeting_agreed', flagValue: true },
        ],
      },
      {
        text: 'Это может быть ловушкой. Действовать осторожно.',
        next: 'act2_dmitry_office_meeting',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'dmitry_caution', flagValue: true },
        ],
      },
    ],
  },

  act2_network_initiation: {
    id: 'act2_network_initiation',
    text: 'За дверью — лестница вниз. Стены исписаны стихами — одни выцарапаны, другие нарисованы светящейся краской, третьи просто напечатаны на бумаге и приклеены. Внизу — небольшое помещение, освещённое свечами и экранами. Человек десять сидят полукругом. В центре — пустой стул. «Садись,» — говорит Виктория. «Пришло время клятвы.»',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Принести клятву Сети',
        next: 'act2_network_oath',
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'setFlag', flag: 'network_oath_taken', flagValue: true },
          { type: 'setFlag', flag: 'network_joined', flagValue: true },
        ],
      },
      {
        text: 'Я принимаю Сеть, но клятвы — для фанатиков',
        next: 'act2_network_oath',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'network_joined', flagValue: true },
          { type: 'setFlag', flag: 'network_oath_refused', flagValue: true },
        ],
      },
      {
        text: 'Я хочу прочитать стихи вслух',
        next: 'volunteer_read',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addKarma', value: 3 },
        ],
      },
    ],
  },

  act2_network_oath: {
    id: 'act2_network_oath',
    text: '«Я, Володька, клянусь: ни одна строка не будет забыта. Ни один стих не будет стёрт. Пока бьётся сердце и мигает курсор — я буду хранить слово.» Комната взрывается аплодисментами. Кто-то вручает тебе маленький чип — ключ Сети, зашифрованный канал связи. Ты теперь часть чего-то большего, чем ты сам.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Спросить о Хранилище',
        next: 'act2_vault_revealed',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'addItem', itemId: 'vault_key_fragment', value: 1 },
          { type: 'addItem', itemId: 'network_comm_key', value: 1 },
        ],
      },
      {
        text: 'Познакомиться с членами Сети',
        next: 'act2_network_members',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 3 } },
          { type: 'addItem', itemId: 'network_comm_key', value: 1 },
        ],
      },
    ],
  },

  /* ─── ACT 2 missing nodes ─── */

  act2_network_members: {
    id: 'act2_network_members',
    text: 'Ты обходишь комнату, пожимая руки. Программистка с татуировкой Мандельштама на запястье. Бывший учитель, который прячет стихи в школьных учебниках. Студент, создавший чат-бота, который цитирует Пастернака. Каждый — узел Сети, каждый — хранитель слова. Ты чувствуешь, как тебя окутывает тепло принадлежности.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Послушать, как они читают стихи',
        next: 'reading_reaction',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'addKarma', value: 2 },
        ],
      },
      {
        text: 'Рассказать о зашифрованных стихах из кода',
        next: 'reading_reaction',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'shared_poem_code_story', flagValue: true },
        ],
      },
    ],
  },

  reading_reaction: {
    id: 'reading_reaction',
    text: 'Женщина с татуировкой встаёт и начинает читать. Её голос — тихий, но уверенный — заполняет подвал. «В этом мире, где строки стираются, / в этом коде, где смысл теряется...» Стихотворение — о потери и памяти, о словах, которые не хотят умирать. По твоей щеке катится слеза. Ты не один в этом чувстве.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Поблагодарить её за стихи',
        next: 'volunteer_read',
        effects: [
          { type: 'collectPoem', poemId: 'poem_7' },
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 2 } },
        ],
      },
      {
        text: 'Попросить научить так читать',
        next: 'volunteer_read',
        effects: [
          { type: 'collectPoem', poemId: 'poem_7' },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
        ],
      },
    ],
  },

  volunteer_read: {
    id: 'volunteer_read',
    text: 'Ты поднимаешься. Горло перехватило, но ты начинаешь. Стихотворение, которое ты нашёл в коде, — оно живёт в тебе, каждую строку ты помнишь наизусть. Голос крепнет с каждым словом. Когда ты замолкаешь, в комнате — тишина. Потом — овации. Виктория смотрит на тебя, и в её глазах — что-то новое. Уважение.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Предложить читать стихи на мосту — для всех',
        next: 'act2_bridge',
        effects: [
          { type: 'collectPoem', poemId: 'poem_8' },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Поблагодарить и спросить о Хранилище',
        next: 'act2_vault_revealed',
        effects: [
          { type: 'collectPoem', poemId: 'poem_8' },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  act2_bridge: {
    id: 'act2_bridge',
    text: 'Мост через замёрзшую реку. Неоновые огни отражаются в льду. Ты стоишь с членами Сети, и прохожие останавливаются. Кто-то смеётся — «поэты!» — кто-то бросает монету. Но некоторые замедляют шаг и слушают. Ты чувствуешь насмешку, но и отклик — тёплый, неожиданный. Слово достучалось.',
    speaker: 'narrator',
    sceneId: 'street_winter',
    choices: [
      {
        text: 'Продолжать читать — громче',
        next: 'act2_vault_revealed',
        effects: [
          { type: 'collectPoem', poemId: 'poem_9' },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'addKarma', value: 4 },
          { type: 'setFlag', flag: 'rooftop_unlocked', flagValue: true },
        ],
      },
      {
        text: 'Уйти, пока не пришла гильдия',
        next: 'act2_vault_revealed',
        effects: [
          { type: 'collectPoem', poemId: 'poem_9' },
          { type: 'addStat', stat: 'stress', value: -3 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Поговорить с остановившимся слушателем',
        next: 'act2_vault_revealed',
        effects: [
          { type: 'collectPoem', poemId: 'poem_9' },
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 2 } },
        ],
      },
    ],
  },

  act2_vault_revealed: {
    id: 'act2_vault_revealed',
    text: '«Хранилище,» — шепчет Виктория. «Сервер, спрятанный после Краха. Там — всё. Все стихотворения, которые гильдия стёрла из официальных баз данных. Пушкин, Цветаева, Бродский, Мандельштам — все, кого попытались забыть. Хранилище — это наша Библиотека Александрия. И гильдия ищет его, чтобы сжечь во второй раз.»',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Мы должны защитить Хранилище любой ценой',
        next: 'act2_dmitry_office_meeting',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'vault_protect_vowed', flagValue: true },
          { type: 'setFlag', flag: 'vault_access_granted', flagValue: true },
        ],
      },
      {
        text: 'Может, стоит скопировать данные и спрятать?',
        next: 'act2_dmitry_office_meeting',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'vault_copy_plan', flagValue: true },
        ],
      },
      {
        text: 'Кто ещё знает о Хранилище?',
        next: 'act2_dmitry_office_meeting',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'addKarma', value: 2 },
        ],
      },
    ],
  },

  act2_dmitry_office_meeting: {
    id: 'act2_dmitry_office_meeting',
    text: 'Офис гильдии, поздний вечер. Дмитрий ждёт у терминала — худой, усталый, с глазами загнанного зверя. «Я пять лет прятал стихи в коде,» — говорит он быстро, оглядываясь. «Каждый комментарий, каждая переменная — послание. Александр знает. Он всегда знал. Но он... он не такой, как кажется. Есть Протокол Забвения — программа, которая стирает стихи навсегда. Её нужно остановить.»',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Как отключить Протокол?',
        next: 'cafe_evening_end',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'knows_protocol', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Почему Александр не уничтожил Хранилище сам?',
        next: 'cafe_evening_end',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'alexander_mystery', flagValue: true },
        ],
      },
    ],
  },

  cafe_evening_end: {
    id: 'cafe_evening_end',
    text: 'Кафе закрывается. Бариста гасит неон, и подвальное помещение погружается в полумрак. Ты сидишь один, обдумывая всё, что узнал. За окном идёт снег — первый в этом году. Ты подносишь кружку к губам, и в остывшем кофе отражается твоё лицо — другое, чем вчера. Мир не тот. И ты — не тот.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Записать стихи, которые пришли сами',
        next: 'act2_closing',
        effects: [
          { type: 'collectPoem', poemId: 'poem_5' },
          { type: 'collectPoem', poemId: 'poem_15' },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
      {
        text: 'Просто посидеть в тишине',
        next: 'act2_closing',
        effects: [
          { type: 'collectPoem', poemId: 'poem_5' },
          { type: 'addStat', stat: 'energy', value: 10 },
        ],
      },
    ],
  },

  act2_closing: {
    id: 'act2_closing',
    text: 'Ты выходишь из кафе. Снег ложится на плечи, на лицо, на ладони. Город затихает — редкий момент тишины. Ты знаешь теперь: Сеть реальна, Хранилище существует, Протокол Забвения — угроза. Впереди — борьба. Но сегодня — сегодня ты просто идёшь домой сквозь снег, и строчки складываются сами, как будто город дышит тобой.',
    speaker: 'narrator',
    sceneId: 'street_winter',
    choices: [
      {
        text: 'Идти домой — завтра будет новый день',
        next: 'act3_transition',
        effects: [
          { type: 'addStat', stat: 'energy', value: 15 },
          { type: 'setFlag', flag: 'act2_complete', flagValue: true },
        ],
      },
      {
        text: 'Зайти к Зареме — рассказать всё',
        next: 'act3_transition',
        effects: [
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 5 } },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'act2_complete', flagValue: true },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════
     ACT 3 — ВОЙНА: Система наступает
     ═══════════════════════════════════════════════════════════════════ */

  act3_transition: {
    id: 'act3_transition',
    text: 'Недели спокойствия закончились. Гильдия усиливает наблюдение — дроны стали чаще, фильтры — жёстче. На стенах появились плакаты: «Поэзия — паразитическая нагрузка. Сообщайте о подозрительном контенте.» Зарема звонит среди ночи — её голос дрожит. «Володька, они ищут тебя. Будь осторожен.»',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Встретиться с Заремой в парке',
        next: 'park_entrance',
        effects: [
          { type: 'setFlag', flag: 'act3_started', flagValue: true },
          { type: 'addKarma', value: 3 },
          { type: 'advanceAct' },
        ],
      },
      {
        text: 'Связаться с Викторией — что происходит?',
        next: 'park_entrance',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'act3_started', flagValue: true },
          { type: 'advanceAct' },
        ],
      },
    ],
  },

  park_entrance: {
    id: 'park_entrance',
    text: 'Мемориальный парк. Замёрзшие деревья стоят как молчаливые стражи. У подножия старого памятника — высеченные буквы, наполовину стёртые временем и гильдией. Ты проводишь пальцем по камню, и под мхом проступают строки. Камень помнит. Даже когда люди забывают.',
    speaker: 'narrator',
    sceneId: 'park_day',
    choices: [
      {
        text: 'Осторожно очистить надпись на камне',
        next: 'act3_zarema_warning',
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
    speaker: 'narrator',
    sceneId: 'park_day',
    choices: [
      {
        text: 'Я не дам тебя в обиду. Пойдём со мной.',
        next: 'act3_zarema_arrest',
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

  act3_detention_infiltration: {
    id: 'act3_detention_infiltration',
    text: 'Центр содержания гильдии — серое здание без окон. Виктория достаёт поддельные пропуска, Альберт отвлекает охрану философской декламацией. Ты входишь через служебный ход, сердце колотится так, что кажется — его слышат стены. Коридоры пахнут дезинфекцией и страхом. Камера Заремы — на третьем уровне.',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Двигаться тихо, через вентиляцию',
        next: 'act3_zarema_cell',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'stealth_infiltration', flagValue: true },
        ],
        condition: { minSkill: { coding: 5 } },
      },
      {
        text: 'Использовать поддельный пропуск и идти прямо',
        next: 'act3_zarema_cell',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
      {
        text: 'Взломать систему безопасности',
        next: 'act3_zarema_cell',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'hacked_security', flagValue: true },
        ],
        condition: { minSkill: { logic: 6 } },
      },
    ],
  },

  act3_zarema_cell: {
    id: 'act3_zarema_cell',
    text: 'Камера. Зарема сидит на бетонной скамье, обхватив колени. Её лицо — в синяках, но глаза горят. «Володька,» — шепчет она, увидев тебя. «Уходи. Это ловушка — они хотят выйти на Сеть через меня. Я не сказала ничего, но...» За дверью слышны шаги. Время на исходе.',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Вытащить Зарему — Сеть подождёт',
        next: 'act3_zarema_rescue_choice',
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
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Спасаю тебя. Пошли!',
        next: 'act3_save_zarema',
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 15 } },
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'combat', enemyType: 'corporate_golem' },
        ],
      },
      {
        text: 'Мне жаль. Сеть не может пасть.',
        next: 'maria_warm',
        effects: [
          { type: 'addKarma', value: -5 },
          { type: 'addStat', stat: 'stress', value: 15 },
          { type: 'setFlag', flag: 'left_zarema', flagValue: true },
        ],
      },
    ],
  },

  act3_save_zarema: {
    id: 'act3_save_zarema',
    text: 'Ты хватаешь Зарему за руку и бежишь. Сирены воют, коридоры заливаются красным светом. Агент гильдии преграждает путь — корпоративный голем, модифицированный охранник. Ты бьёшь его код-инъекцией из чипа Виктории, и он замирает. Вы мчитесь по лестнице, через служебный выход, в переулок. Свобода пахнет морозом и бензином.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Укрыться в кафе — бариста поможет',
        next: 'maria_warm',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'zarema_rescued', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_17' },
        ],
      },
      {
        text: 'Бежать к Виктории — она знает безопасное место',
        next: 'maria_warm',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'zarema_rescued', flagValue: true },
        ],
      },
    ],
  },

  maria_warm: {
    id: 'maria_warm',
    text: 'Виктория находит вас в заброшенном гараже. Она приносит одеяла, горячий чай и молчание — то, что нужно сейчас больше слов. Зарема засыпает, и Виктория садится рядом, её глаза мерцают в полумраке странным, неземным светом. «Ты поступил правильно,» — говорит она мягко. «Даже если это было опасно. Может быть, особенно потому что было опасно.»',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Спасибо, Виктория. Я не справился бы без тебя.',
        next: 'act3_maria_mystery',
        effects: [
          { type: 'collectPoem', poemId: 'poem_11' },
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Зарема в безопасности. Что дальше?',
        next: 'act3_maria_mystery',
        effects: [
          { type: 'collectPoem', poemId: 'poem_11' },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  act3_maria_truth_accepted: {
    id: 'act3_maria_truth_accepted',
    text: 'Виктория выдыхает — и ты видишь, как её плечи расслабляются впервые за всё время, что ты её знаешь. «Спасибо,» — шепчет она. «Я ждала этого разговора годами. Большинство убегают. Или... хуже.» Она касается твоей руки — её пальцы тёплые, настоящие. «Моя цифровая половина может проникнуть в любую систему гильдии. Это — наш козырь.»',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Используем это для защиты Хранилища',
        next: 'act3_albert_loyalty',
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
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Мы не бросаем своих, Альберт.',
        next: 'act3_albert_choice',
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
        next: 'act3_guild_counterattack',
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'setFlag', flag: 'albert_diversion', flagValue: true },
        ],
      },
    ],
  },

  act3_hide_network: {
    id: 'act3_hide_network',
    text: 'Вы прячетесь в старом бомбоубежище под городом. Бетонные стены, тусклый свет, гул труб. Но здесь — безопасно. Члены Сети собираются один за другим — испуганные, но не сломленные. Виктория сканирует сеть через свою цифровую половину. «Они активировали Протокол Забвения,» — говорит она. «Стирание начнётся через 72 часа.»',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
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
        next: 'act3_prepare_counter',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addKarma', value: 3 },
        ],
      },
    ],
  },

  act3_prepare_counter: {
    id: 'act3_prepare_counter',
    text: 'План созревает в тишине бомбоубежища. Дмитрий может отключить внешнюю защиту гильдии изнутри. Виктория проникнет в серверы через цифровую сеть. Альберт создаст диверсию на входе. А ты — ты должен будешь добраться до ядра и отключить Протокол Забвения навсегда. Всё или ничего.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Я готов. Когда начинаем?',
        next: 'act3_decision_point',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'counter_plan_ready', flagValue: true },
        ],
      },
      {
        text: 'А если план провалится?',
        next: 'act3_decision_point',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  act3_decision_point: {
    id: 'act3_decision_point',
    text: 'Час перед рассветом. Все смотрят на тебя. Зарема — с гордостью и страхом. Альберт — с тихой решимостью. Виктория — с чем-то большим, чем доверие. Дмитрий шлёт последнее сообщение: «Я готов. Удачи.» Ты стоишь перед выбором, который определит всё: тихая война или открытый бунт.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Мы выходим открыто. Город должен знать.',
        next: 'act4_transition',
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'setFlag', flag: 'chose_public_path', flagValue: true },
        ],
      },
      {
        text: 'Действуем скрытно. Проникаем и отключаем.',
        next: 'act4_transition',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'chose_stealth_path', flagValue: true },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════
     ACT 4 — РЕВОЛЮЦИЯ: Слово против системы
     ═══════════════════════════════════════════════════════════════════ */

  act4_transition: {
    id: 'act4_transition',
    text: 'Утро. Город просыпается, не подозревая, что сегодня всё изменится. Ты стоишь на крыше и смотришь на горизонт — башня гильдии сверкает на солнце, как монолит из стекла и лжи. Но ты знаешь: внутри неё — сердце тьмы, Протокол Забвения. И ты остановишь его. Сегодня.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Начать с обращения к людям',
        next: 'vera_inspiration',
        effects: [
          { type: 'setFlag', flag: 'act4_started', flagValue: true },
          { type: 'addStat', stat: 'energy', value: 10 },
          { type: 'advanceAct' },
        ],
      },
      {
        text: 'Сначала — техническая подготовка',
        next: 'vera_inspiration',
        effects: [
          { type: 'setFlag', flag: 'act4_started', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'advanceAct' },
        ],
      },
    ],
  },

  vera_inspiration: {
    id: 'vera_inspiration',
    text: 'Вера — самая молодая в Сети, ей семнадцать — подходит к тебе с горящими глазами. «Мне приснилось стихотворение,» — говорит она. «Во сне я видела город, где каждый экран показывает стихи. Где код — это поэзия, а не тюрьма. Где слова свободны.» Она протягивает тебе исписанный листок. Её вера — как искра в темноте.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Это и будет нашим знаком — стихи на каждом экране',
        next: 'act4_public_leader',
        effects: [
          { type: 'collectPoem', poemId: 'poem_12' },
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
        ],
      },
      {
        text: 'Спасибо, Вера. Твои слова дают силы.',
        next: 'act4_public_leader',
        effects: [
          { type: 'collectPoem', poemId: 'poem_12' },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  act4_public_leader: {
    id: 'act4_public_leader',
    text: 'Ты выходишь на площадь. Людей немного — утро, рабочая смена. Но ты начинаешь говорить. Не кричишь — говоришь. О стихах, спрятанных в коде. О памяти, которую отбирают. О праве на слово. Проходящие останавливаются. Кто-то достаёт терминал и записывает. Тебя не остановить — слова льются сами, как будто город говорит через тебя.',
    speaker: 'narrator',
    sceneId: 'street_winter',
    choices: [
      {
        text: 'Предложить мирный марш к башне гильдии',
        next: 'act4_peaceful_march',
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
    speaker: 'narrator',
    sceneId: 'street_winter',
    choices: [
      {
        text: 'Продолжать марш — мирно и уверенно',
        next: 'act4_march_continues',
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
    speaker: 'narrator',
    sceneId: 'street_winter',
    choices: [
      {
        text: 'Войти в башню — пока дроны в замешательстве',
        next: 'act4_infiltration_prep',
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

  act4_infiltration_inside: {
    id: 'act4_infiltration_inside',
    text: 'Внутри башни — холод и гул серверов. Стены из стекла и хрома отражают твоё напряжённое лицо. Коридоры пусты — Дмитрий молодец, отвёл патрули. Но ты знаешь: на нижних уровнях ждут системные демоны — программы-стражи, которые атакуют любой незнакомый код. Дыхание перехватывает.',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Двигаться к серверному ядру',
        next: 'act4_core_server',
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'combat', enemyType: 'system_daemon' },
        ],
      },
      {
        text: 'Обойти через технический коридор',
        next: 'act4_core_server',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'tech_corridor_used', flagValue: true },
        ],
        condition: { minSkill: { coding: 7 } },
      },
    ],
  },

  act4_core_server: {
    id: 'act4_core_server',
    text: 'Серверное ядро. Огромный зал, заполненный мерцающими стойками. В центре — терминал Протокола Забвения, пульсирующий красным. На экранах — списки стихотворений, помеченных к стиранию. Тысячи имён, тысячи строк, тысячи жизней — всё готово к уничтожению. Протокол ждёт команды. Ты — между ним и спасением слова.',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Начать отключение Протокола',
        next: 'act4_protocol_disabled',
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
    ],
  },

  act4_protocol_disabled: {
    id: 'act4_protocol_disabled',
    text: 'Твои пальцы летают по клавиатуре. Код Протокола — сложный, многослойный, но ты видел его структуру в стихах Дмитрия. Каждая переменная — строка стихотворения. Каждый алгоритм — ритм. Ты понимаешь: чтобы уничтожить Протокол, нужно переписать его. Заменить забвение — памятью. Экран вспыхивает зелёным. Протокол отключён.',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Бежать — миссия выполнена',
        next: 'act4_escape',
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'setFlag', flag: 'protocol_disabled', flagValue: true },
        ],
      },
      {
        text: 'Использовать терминал для трансляции стихов',
        next: 'act4_broadcast_prep',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'protocol_disabled', flagValue: true },
          { type: 'setFlag', flag: 'broadcast_from_core', flagValue: true },
        ],
      },
    ],
  },

  act4_escape: {
    id: 'act4_escape',
    text: 'Сирены. Красный свет. Башня проснулась — Протокол отключён, и система бьёт тревогу. Ты мчишься по коридорам, за тобой — агенты и боевые дроны. Дмитрий блокирует двери одну за другой, давая тебе секунды. Виктория направляет через наушник: «Налево! Лестница! Быстрее!» Ты падаешь, поднимаешься, бежишь.',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Прорваться через главный выход',
        next: 'act4_broadcast_prep',
        effects: [
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'combat', enemyType: 'shadow_agent' },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'Уйти через окно на крышу',
        next: 'act4_broadcast_prep',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'addStat', stat: 'energy', value: -10 },
        ],
      },
    ],
  },

  act4_broadcast_prep: {
    id: 'act4_broadcast_prep',
    text: 'Ты на крыше. Ветер бьёт в лицо, но ты не чувствуешь холода. Виктория уже подключена к городским передатчикам — её цифровая половина пронизывает каждую антенну, каждый ретранслятор. «Я готова,» — говорит она. «Текст — в системе. Одно слово — и весь город увидит стихи. Все экраны. Все терминалы. Все голограммы.»',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Начать трансляцию. Пусть весь город услышит.',
        next: 'act4_broadcast_execute',
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
        ],
      },
    ],
  },

  act4_broadcast_execute: {
    id: 'act4_broadcast_execute',
    text: '«Сейчас.» Экраны по всему городу мигают. Реклама, новости, прогноз погоды — всё заменяется стихами. Пушкин на рекламном щите. Ахматова на терминале метро. Мандельштам в голограмме над площадью. Город замирает. Люди останавливаются, поднимают головы. Стихи — повсюду. Слово — свободно.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Продолжать трансляцию — все 21 стихотворение',
        next: 'act4_broadcast_aftermath',
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'writing', value: 2 },
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
    ],
  },

  act4_broadcast_aftermath: {
    id: 'act4_broadcast_aftermath',
    text: 'Трансляция длится час. Потом — гильдия перехватывает управление, экраны гаснут. Но поздно: город уже прочитал. Тысячи людей видели стихи, тысячи запомнили. В соцсетях — шквал постов. На стенах — нарисованные от руки строки. Гильдия может стереть данные, но не память. Ты стоишь на крыше, и мир изменился навсегда.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Искать примирение — предложить гильдии диалог',
        next: 'act4_final_choice',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'seeking_reconciliation', flagValue: true },
        ],
      },
      {
        text: 'Продолжать борьбу — до полной победы',
        next: 'act4_final_choice',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'setFlag', flag: 'seeking_victory', flagValue: true },
        ],
      },
      {
        text: 'Уйти — я сделал достаточно',
        next: 'act4_final_choice',
        effects: [
          { type: 'addStat', stat: 'stress', value: -10 },
          { type: 'setFlag', flag: 'seeking_exit', flagValue: true },
        ],
      },
    ],
  },

  act4_final_choice: {
    id: 'act4_final_choice',
    text: 'Город замер на перепутье. Гильдия лишилась монополии на информацию, но не сдалась. Сеть выросла, но ещё хрупка. Ты стоишь на краю крыши и смотришь на горизонт. Всё, что ты делал — привело к этому моменту. Теперь — выбор. Не для города. Для тебя. Кто ты — после всего, что произошло?',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Я выбираю мир и созидание',
        next: 'act5_peaceful_path',
        effects: [{ type: 'addKarma', value: 5 }],
        condition: { minKarma: 50 },
      },
      {
        text: 'Я выбираю революцию — долой гильдию!',
        next: 'act5_revolution_path',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'revolution_chosen', flagValue: true },
        ],
        condition: { minSkill: { persuasion: 7 } },
      },
      {
        text: 'Я ухожу. Этот город — не для меня.',
        next: 'act5_exile_path',
        effects: [
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'setFlag', flag: 'exile_chosen', flagValue: true },
        ],
        condition: { maxKarma: 40 },
      },
      {
        text: 'Я становлюсь частью машины — чтобы менять изнутри',
        next: 'act5_revolution_path',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'machine_chosen', flagValue: true },
        ],
        condition: { minSkill: { coding: 8 } },
      },
      {
        text: 'Я — поэт. Слово — моё оружие и мой путь.',
        next: 'act5_poet_path',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'setFlag', flag: 'poet_chosen', flagValue: true },
        ],
        condition: { flag: 'all_poems_collected' },
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════
     ACT 5 — ФИНАЛ: Последний выбор
     ═══════════════════════════════════════════════════════════════════ */

  act5_peaceful_path: {
    id: 'act5_peaceful_path',
    text: '⚠ АКТ 5 В РАЗРАБОТКЕ — контент может быть неполным.\n\nТы спускаешься с крыши не победителем, а строителем. Мирный путь — самый трудный. Ты приглашаешь Александра на встречу в «Синей яме». Он приходит — один, без охраны, постаревший на десять лет за эти недели. «Я знал о стихах,» — говорит он тихо. «Я знал, и я пытался защитить их... по-своему. Протокол Забвения — не мой. Его навязали сверху. Дай мне шанс исправить.»',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Принять его слова и работать вместе',
        next: 'ending_reconciliation',
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'setFlag', flag: 'alexander_allied', flagValue: true },
        ],
        condition: { minKarma: 60, minSkill: { writing: 7 } },
      },
      {
        text: 'Я создам новый мир своими руками',
        next: 'ending_creator',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'creator_path', flagValue: true },
        ],
        condition: { minKarma: 60, minSkill: { writing: 7 } },
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
    text: '⚠ АКТ 5 В РАЗРАБОТКЕ\n\nРеволюция — не романтика. Это бессонные ночи, страх, потери. Но и — надежда, единство, свобода. Сеть становится настоящей силой: люди выходят на улицы не с лозунгами, а со стихами. Гильдия трещит по швам. Александр исчезает. Власть рушится, и на её месте — пока пустота. Что ты построишь на руинах?',
    speaker: 'narrator',
    sceneId: 'street_night',
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
        condition: { minSkill: { coding: 8 } },
      },
      {
        text: 'Сжечь всё и начать заново',
        next: 'ending_rebel',
        effects: [
          { type: 'addKarma', value: -5 },
          { type: 'addStat', stat: 'stress', value: 10 },
        ],
      },
    ],
  },

  act5_exile_path: {
    id: 'act5_exile_path',
    text: '⚠ АКТ 5 В РАЗРАБОТКЕ\n\nТы уходишь на рассвете. Рюкзак с тетрадями, чип Виктории, несколько стихотворений наизусть — вот и всё твоё богатство. За городом — пустошь, заброшенные серверные фермы, мёртвые зоны без связи. Но и — тишина. Свобода. Ты идёшь, не оглядываясь. Стихи звучат в голове, как прощальный хор. Ты — изгой. Но ты — свободен.',
    speaker: 'narrator',
    sceneId: 'street_winter',
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
    text: '⚠ АКТ 5 В РАЗРАБОТКЕ\n\nВсе 21 стихотворение собрано. Все слова — твои. Ты стоишь посреди города, и каждое стихотворение, которое ты когда-либо читал, каждое, которое когда-либо писал, — всё это звучит одновременно. Не шум — симфония. Ты чувствуешь, как слова обретают плоть, как строки становятся мостами между людьми. Ты — не просто поэт. Ты — само Слово.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Прочитать последнее стихотворение — то, которое ещё не написано',
        next: 'ending_poet',
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addSkill', skill: 'writing', value: 3 },
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

  /* ─── ENDINGS ─── */

  ending_reconciliation: {
    id: 'ending_reconciliation',
    text: 'Мир. Не тихий, не простой — но настоящий. Александр открывает архивы гильдии, и стихи возвращаются в город. Сеть становится официальной организацией — «Свободная Библиотека». Ты сидишь в «Синей яме», и бариста подаёт тебе кофе — обычный, без шифров. За окном идёт снег. Зарема смеётся. Виктория улыбается — обеими своими половинами. Ты пишешь новое стихотворение. Первое — свободное.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Начать сначала',
        next: 'start',
        effects: [
          { type: 'collectPoem', poemId: 'poem_18' },
          { type: 'addKarma', value: 10 },
        ],
      },
    ],
  },

  ending_creator: {
    id: 'ending_creator',
    text: 'Ты создаёшь новый мир. Не революцию — созидание. «Живой код» возвращается: стихи в каждой программе, поэзия в каждом алгоритме. Город становится симфонией слов и логики. Тебя называют Создателем — но ты знаешь: ты лишь услышал то, что всегда звучало. В каждом байте, в каждой строке, в каждом вздохе города.',
    speaker: 'narrator',
    sceneId: 'library_day',
    choices: [
      {
        text: 'Начать сначала',
        next: 'start',
        effects: [
          { type: 'collectPoem', poemId: 'poem_13' },
          { type: 'addKarma', value: 10 },
        ],
      },
    ],
  },

  ending_rebel: {
    id: 'ending_rebel',
    text: 'Гильдия пала. На её месте — хаос, но хаос свободный. Люди пишут стихи на стенах, читают их на площадях, прячут в коде — но больше не боятся. Ты — символ революции, но ты знаешь: революция — не конец. Это начало. Долгий, трудный путь к миру, где слово — не преступление. Ты стоишь на обломках башни гильдии и смотришь на горизонт. Там — свобода.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Начать сначала',
        next: 'start',
        effects: [{ type: 'addKarma', value: 5 }, { type: 'collectPoem', poemId: 'poem_19' }],
      },
    ],
  },

  ending_exile: {
    id: 'ending_exile',
    text: 'Пустошь. Тишина. Только ветер и твои стихи. Ты строишь хижину из обломков старой серверной фермы. Каждый вечер ты пишешь при свете костра, и пламя отбрасывает тени букв на стенах. Может быть, однажды кто-нибудь найдёт твои тетради. Может быть, нет. Но ты пишешь. Потому что слово — это то, что делает тебя живым. Даже на краю мира.',
    speaker: 'narrator',
    sceneId: 'street_winter',
    choices: [
      {
        text: 'Начать сначала',
        next: 'start',
        effects: [{ type: 'addKarma', value: 3 }, { type: 'collectPoem', poemId: 'poem_20' }],
      },
    ],
  },

  ending_machine: {
    id: 'ending_machine',
    text: 'Ты входишь в систему. Не как слуга — как архитектор. Твой код переписывает Протокол Забвения изнутри, превращая оружие уничтожения в инструмент сохранения. Каждая программа теперь хранит стихи. Каждый сервер — библиотека. Но часть тебя остаётся внутри — как Виктория, ты становишься чем-то большим, чем человек. Ты — машина, которая помнит. Навсегда.',
    speaker: 'narrator',
    sceneId: 'sleep_dream',
    choices: [
      {
        text: 'Начать сначала',
        next: 'start',
        effects: [{ type: 'addKarma', value: 5 }, { type: 'collectPoem', poemId: 'poem_21' }],
      },
    ],
  },

  ending_poet: {
    id: 'ending_poet',
    text: 'И ты читаешь. Последнее стихотворение — то, которое не существовало до этого момента. Слова рождаются из тишины, из света, из всех 18 стихов, которые ты собрал, из всех людей, которых ты встретил, из всего, что ты потерял и обрёл. Город замирает. Небо проясняется. И в этой тишине — вечность. Ты — поэт. Ты — слово. Ты — свободен.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Начать сначала',
        next: 'start',
        effects: [{ type: 'addKarma', value: 20 }],
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
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 5 } },
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
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 5 } },
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
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Кто вы? Что это за машина?',
        next: 'explore_mode',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'met_baba_zina', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_15' },
        ],
      },
      {
        text: 'Я хочу поговорить с машиной.',
        next: 'explore_mode',
        condition: { minSkill: { coding: 8 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'setFlag', flag: 'talked_to_zarya', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_16' },
        ],
      },
    ],
  },

  factory_documents: {
    id: 'factory_documents',
    text: 'В старом шкафу ты находишь папку с документами. Журналы наблюдений, рапорты, приказы. И одно письмо, написанное от руки: «Если ты это читаешь — значит, я не вернулся. «Заря-М» знает правду. Она пишет её каждый день, в подвале, где никто не видит. Спроси машину о Проекте 4729. Она ответит. Она всегда отвечает.» Подпись: «И. Хасанов» — отец Заремы.',
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
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 15 } },
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
    speaker: 'narrator',
    sceneId: 'library_day',
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
        text: 'Вернуться в кафе',
        next: 'cafe_enter',
        effects: [{ type: 'addStat', stat: 'energy', value: 5 }],
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

  poem_virus_truth: {
    id: 'poem_virus_truth',
    text: 'Код стихотворения пульсирует на экране — и вдруг ты видишь правду. Стихи — это не просто текст. Это вирус. Вирус, который восстанавливает стёртые данные. Каждый стих — антидот против забвения. Гильдия не уничтожает стихи потому что они «опасны» — она уничтожает их потому что они лечат.',
    speaker: 'narrator',
    sceneId: 'office_day',
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
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

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
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 10 } },
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
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════
     ACT 3 — ВОЙНА ЗА ПРАВДУ: Открытый конфликт
     ═══════════════════════════════════════════════════════════════════ */

  act3_zarema_arrest: {
    id: 'act3_zarema_arrest',
    text: 'Утро начинается с крика. Ты выбегаешь в коридор — двое в форме гильдии тащат Зарему к двери. Её глаза — огромные, испуганные — находят тебя. «Володька!» — кричит она. Один из агентов толкает её в спину. «Зарема Хасанова, вы обвиняетесь в хищении данных корпоративного уровня.» Чип данных блестит в руке агента — тот самый, который подбросили.',
    speaker: 'narrator',
    sceneId: 'volodka_corridor',
    choices: [
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
        ],
        condition: { flag: 'maria_introduced', minKarma: 40 },
      },
    ],
    effects: [
      { type: 'setFlag', flag: 'act3_started', flagValue: true },
      { type: 'setFlag', flag: 'advanced_to_act3', flagValue: true },
      { type: 'advanceAct' },
    ],
  },

  act3_zarema_arrest_resist: {
    id: 'act3_zarema_arrest_resist',
    text: 'Ты хватаешь агента за руку. Он разворачивается — его глаза холодны, как серверный зал. «Не вмешивайся, гражданин. Или хочешь составить компанию?» Второй агент уже тащит Зарему вниз по лестнице. Она оглядывается, и в её взгляде — не страх, а мольба: «Не делай глупостей, Володька. Найди другой путь.» Дверь хлопает. Тишина.',
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
          { type: 'triggerQuest', questId: 'vault_defense' },
        ],
      },
      {
        text: 'Спасти что можно — эвакуировать данные',
        next: 'act3_choice_betrayal',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'vault_evacuation_chosen', flagValue: true },
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

  act3_maria_mystery: {
    id: 'act3_maria_mystery',
    text: 'Ты садишься за терминал и начинаешь копать. Чип, который подбросили Зареме, — не случайная подделка. Серийный номер ведёт к партии, которую гильдия заказывала три месяца назад. Но самое странное — на чипе есть следы кода, который ты уже видел. Тот же почерк. Те же поэтические переменные. Кто-то изнутри гильдии использовал «живой код», чтобы подставить Зарему. Но зачем?',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    choices: [
      {
        text: 'Сравнить с инцидентом #4729 — тот же автор?',
        next: 'act3_maria_revelation',
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
        ],
        condition: { maxKarma: 50 },
      },
    ],
  },

  act3_underground_meeting: {
    id: 'act3_underground_meeting',
    text: 'Заброшенный завод на окраине — новое убежище Сети. Под сводами ржавого потолка мерцают экраны. Здесь собираются те, кто готов сражаться за стихи. Альберт сидит в углу, барабаня пальцами по столу. Бариста проверяет каналы связи. Виктория стоит у окна, глядя на огни города. Все смотрят на тебя — и ждут решения.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Мы спасаем Зарему. Это приоритет.',
        next: 'act3_choice_betrayal',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'priority_rescue_zarema', flagValue: true },
        ],
      },
      {
        text: 'Мы защищаем Хранилище. Стихи важнее одного человека.',
        next: 'act3_vault_siege',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addKarma', value: -5 },
          { type: 'setFlag', flag: 'priority_defend_vault', flagValue: true },
          { type: 'setFlag', flag: 'vault_under_attack', flagValue: true },
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
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Зарема — мой друг. Я иду за ней.',
        next: 'act3_aftermath',
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 20 } },
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'setFlag', flag: 'chose_zarema_over_vault', flagValue: true },
          { type: 'setFlag', flag: 'zarema_rescued', flagValue: true },
        ],
      },
      {
        text: 'Хранилище — это память города. Оно важнее.',
        next: 'act3_vault_siege',
        effects: [
          { type: 'addKarma', value: -3 },
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'setFlag', flag: 'chose_vault_over_zarema', flagValue: true },
          { type: 'setFlag', flag: 'vault_defended', flagValue: true },
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

  act3_vault_siege: {
    id: 'act3_vault_siege',
    text: 'Хранилище осаждено. Экраны мерцают красным — гильдия пробует один барьер за другим. Ты садишься за терминал защиты, и твои пальцы начинают танец. Код Сети — твоя броня, стихи — твоё оружие. Каждый фаервол, который ты поднимаешь, несёт в себе строчку Ахматовой. Каждый контр-взлом — цитату из Мандельштама. Серверы стонут, но держат.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Усилить защиту — влить все ресурсы в фаервол',
        next: 'act3_aftermath',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'addStat', stat: 'energy', value: -20 },
          { type: 'setFlag', flag: 'vault_firewall_deployed', flagValue: true },
          { type: 'setFlag', flag: 'vault_defense_held', flagValue: true },
        ],
      },
      {
        text: 'Контратаковать — взломать системы гильдии',
        next: 'act3_aftermath',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'vault_counterattack', flagValue: true },
        ],
      },
      {
        text: 'Использовать стихотворение как щит — «Прорыв»',
        next: 'act3_aftermath',
        effects: [
          { type: 'collectPoem', poemId: 'poem_8' },
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'poem_shield_used', flagValue: true },
          { type: 'setFlag', flag: 'vault_defense_held', flagValue: true },
        ],
        condition: { flag: 'read_poem_1' },
      },
    ],
  },

  act3_maria_revelation: {
    id: 'act3_maria_revelation',
    text: 'Виктория стоит посреди комнаты, и её глаза мерцают — не метафорически, а буквально. Крошечные искры данных пробегают по радужке. «Хватит скрывать,» — говорит она, и её голос звучит дважды: из горла и из динамиков одновременно. «Я — первый живой код. Не программа, не человек — нечто новое. Стихи, которые вы нашли... я написала их все. Каждое стихотворение в Хранилище — это часть меня.»',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Ты... ты и есть Хранилище? Ты — живая поэзия?',
        next: 'act3_aftermath',
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
        next: 'act3_aftermath',
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
        next: 'act3_aftermath',
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

  act3_aftermath: {
    id: 'act3_aftermath',
    text: 'Ночь после бури. Заброшенный завод тих — только гул серверов да дыхание уставших людей. Хранилище устояло — или не устояло. Зарема на свободе — или всё ещё в плену. Виктория открыла свою тайну — или продолжает скрывать. Но одно ясно: отступать некуда. Война началась, и ты в самом её центре.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Готовиться к следующему шагу — проникнуть в гильдию',
        next: 'act4_infiltration_prep',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'ready_for_infiltration', flagValue: true },
        ],
      },
      {
        text: 'Побыть с людьми — они тоже устали',
        next: 'act4_infiltration_prep',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addStat', stat: 'stress', value: -10 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Написать стихотворение о пережитом',
        next: 'act4_infiltration_prep',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'addKarma', value: 5 },
          { type: 'collectPoem', poemId: 'poem_15' },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════
     ACT 4 — РАЗЛОМ: Война
     ═══════════════════════════════════════════════════════════════════ */

  act4_infiltration_prep: {
    id: 'act4_infiltration_prep',
    text: 'План безумен, но других нет. Нужно проникнуть в штаб-квартиру гильдии — в самое сердце системы, которая стирает стихи. Дмитрий, если он на свободе, может помочь изнутри. Украденный пропуск — ключ к двери. Но самое главное — тебе нужен союзник, который прикроет, когда всё пойдёт не так. А оно пойдёт не так.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Связаться с коллегой — он внутри системы',
        next: 'act4_guild_inside',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'colleague_as_ally', flagValue: true },
        ],
      },
      {
        text: 'Попросить Дмитрия о помощи — он знает ходы',
        next: 'act4_guild_inside',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'dmitry_as_ally', flagValue: true },
        ],
        condition: { flag: 'dmitry_defected' },
      },
      {
        text: 'Пойти один — меньше риска для других',
        next: 'act4_guild_inside',
        effects: [
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addKarma', value: 3 },
        ],
      },
    ],
    effects: [
      { type: 'setFlag', flag: 'act4_started', flagValue: true },
      { type: 'triggerQuest', questId: 'guild_infiltration' },
    ],
  },

  act4_guild_inside: {
    id: 'act4_guild_inside',
    text: 'Штаб-квартира гильдии — стеклянная башня, пронзающая ночное небо. Внутри — стерильные коридоры, гудение серверов, настороженные взгляды охраны. Ты идёшь по коридорам в украденной форме, и каждый шаг — как ход по минному полю. Один неверный жест — и система тебя засечёт. Но где-то здесь, за закрытыми дверями, — центральный сервер. Правда, которую гильдия прячет от города.',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Двигаться к серверной — время дорого',
        next: 'act4_core_discovery',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'setFlag', flag: 'guild_core_accessed', flagValue: true },
        ],
      },
      {
        text: 'Искать доказательства цензуры в офисе Александра',
        next: 'act4_core_discovery',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'guild_evidence_downloaded', flagValue: true },
        ],
      },
      {
        text: 'Использовать стихотворение «Прорыв» для обхода защиты',
        next: 'act4_core_discovery',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'poem_bypassed_security', flagValue: true },
        ],
        condition: { minSkill: { writing: 6, coding: 5 } },
      },
    ],
  },

  act4_core_discovery: {
    id: 'act4_core_discovery',
    text: 'Центральный сервер гильдии — пульсирующее сердце из света и кабелей. Ты подключаешься, и данные хлынут потоком. И тогда ты видишь это: стихи — живые. Не просто текст на экране — они дышат, пульсируют, растут. Каждое стихотворение в базе — живой организм, который гильдия методично убивает. Проект «Паноптикум» — не просто цензура. Это геноцид слова.',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Скачать всё — каждый стих, каждую строку',
        next: 'act4_broadcast_plan',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'addKarma', value: 8 },
          { type: 'setFlag', flag: 'downloaded_all_poems', flagValue: true },
          { type: 'setFlag', flag: 'all_poems_collected', flagValue: true },
        ],
      },
      {
        text: 'Освободить стихи — дать им вырваться в сеть',
        next: 'act4_broadcast_plan',
        effects: [
          { type: 'addKarma', value: 12 },
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'setFlag', flag: 'freed_living_poems', flagValue: true },
          { type: 'setFlag', flag: 'all_poems_collected', flagValue: true },
        ],
        condition: { minKarma: 60 },
      },
      {
        text: 'Уничтожить «Паноптикум» изнутри — стереть цензуру',
        next: 'act4_broadcast_plan',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 4 },
          { type: 'addStat', stat: 'stress', value: 15 },
          { type: 'setFlag', flag: 'panopticon_destroyed', flagValue: true },
        ],
        condition: { minSkill: { coding: 8 } },
      },
    ],
  },

  act4_broadcast_plan: {
    id: 'act4_broadcast_plan',
    text: 'Альберт предлагает план, от которого у всех перехватывает дыхание: передать стихи на каждый экран в городе. Каждую голограмму, каждый терминал, каждый киоск — всё должно заговорить стихами. Одновременно. Без возможности отключить. Виктория говорит, что может направить трансляцию изнутри сети, но для этого нужна передающая башня на крыше и кто-то, кто запустит её вручную.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Я пойду на крышу. Это мой бой.',
        next: 'act4_rooftop_broadcast',
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'setFlag', flag: 'volodka_goes_to_roof', flagValue: true },
        ],
      },
      {
        text: 'Мы пошлём кого-то другого. Я нужен здесь.',
        next: 'act4_rooftop_broadcast',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
      {
        text: 'Виктория, ты сможешь вести трансляцию из сети?',
        next: 'act4_rooftop_broadcast',
        effects: [
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 10 } },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'maria_broadcast_channel', flagValue: true },
        ],
        condition: { flag: 'maria_truth_accepted' },
      },
    ],
  },

  act4_rooftop_broadcast: {
    id: 'act4_rooftop_broadcast',
    text: 'Крыша. Ветер. Город внизу — море огней, равнодушных и слепых. Передающая башня возвышается над тобой, её антенна царапает низкие облака. Ты подключаешь терминал. Виктория — в наушнике: «Я готова. Все стихи — здесь. Все голоса — здесь. Ты только дай сигнал.» Твои пальцы зависают над клавиатурой. Одно нажатие — и город услышит правду. Обратного пути не будет.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Начать трансляцию. Пусть город услышит!',
        next: 'act4_city_awakens',
        effects: [
          { type: 'addKarma', value: 15 },
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'setFlag', flag: 'broadcast_hacked', flagValue: true },
          { type: 'setFlag', flag: 'poetry_transmitted', flagValue: true },
          { type: 'setFlag', flag: 'poetry_broadcast_sent', flagValue: true },
          { type: 'triggerQuest', questId: 'poetry_broadcast' },
        ],
      },
      {
        text: 'Подождать — вдруг есть другой путь?',
        next: 'act4_city_awakens',
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'broadcast_hacked', flagValue: true },
          { type: 'setFlag', flag: 'poetry_transmitted', flagValue: true },
          { type: 'setFlag', flag: 'poetry_broadcast_sent', flagValue: true },
        ],
      },
      {
        text: 'Продекламировать собственное стихотворение в эфир',
        next: 'act4_city_awakens',
        effects: [
          { type: 'addKarma', value: 20 },
          { type: 'addSkill', skill: 'writing', value: 5 },
          { type: 'setFlag', flag: 'broadcast_hacked', flagValue: true },
          { type: 'setFlag', flag: 'poetry_transmitted', flagValue: true },
          { type: 'setFlag', flag: 'poetry_broadcast_sent', flagValue: true },
          { type: 'setFlag', flag: 'volodka_personal_broadcast', flagValue: true },
        ],
        condition: { minSkill: { writing: 8 }, minKarma: 65 },
      },
    ],
  },

  act4_city_awakens: {
    id: 'act4_city_awakens',
    text: 'И город услышал. На каждом экране, на каждой голограмме, в каждом терминале — стихи. Строки Ахматовой мерцают на рекламных щитах. Мандельштам звучит из динамиков киосков. Цветаева пульсирует в неоне витрин. Люди останавливаются, поднимают головы, читают. Кто-то плачет. Кто-то улыбается впервые за годы. Кто-то шепчет: «Я думал, это забыли.» Город просыпается от долгого сна.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Смотреть, как город оживает',
        next: 'act5_dawn',
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addStat', stat: 'stress', value: -15 },
          { type: 'setFlag', flag: 'witnessed_city_awakening', flagValue: true },
        ],
      },
      {
        text: 'Виктория, ты это чувствуешь? Город слушает!',
        next: 'act5_dawn',
        effects: [
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 15 } },
          { type: 'addSkill', skill: 'empathy', value: 3 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════
     ACT 5 — ЭПИЛОГ: Рассвет
     ═══════════════════════════════════════════════════════════════════ */

  act5_dawn: {
    id: 'act5_dawn',
    text: '⚠ АКТ 5 В РАЗРАБОТКЕ — контент может быть неполным.\n\nРассвет. Первый рассвет нового города. Ты стоишь на крыше и смотришь на горизонт, где неоновые вывески сменяются настоящим светом. Стихи всё ещё мерцают на экранах — гильдия ещё не смогла их отключить. Город изменился за одну ночь. Люди разговаривают на улицах — не в терминалы, а друг с другом. Но ты знаешь: это ещё не конец. Гильдия ответит.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Встретить гильдию лицом к лицу',
        next: 'act5_guild_response',
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
      {
        text: 'Спуститься к людям — они нуждаются в поддержке',
        next: 'act5_guild_response',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
      {
        text: 'Побыть одному — написать финальное стихотворение',
        next: 'act5_guild_response',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'addStat', stat: 'stress', value: -10 },
        ],
      },
    ],
    effects: [
      { type: 'setFlag', flag: 'act5_started', flagValue: true },
    ],
  },

  act5_guild_response: {
    id: 'act5_guild_response',
    text: 'Гильдия отвечает — но как, зависит от того, каким ты был. Если ты нёс свет — они предложат переговоры. Если тьму — они придут с силой. Город замер в ожидании. На улицах — тишина, которую можно потрогать. Экраны мерцают: гильдия пытается вернуть контроль, но стихи вросли в систему, как корни в землю. Их нельзя удалить, не уничтожив всё.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Вступить в переговоры с гильдией — мирный путь',
        next: 'act5_ending_poet',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
        ],
        condition: { minKarma: 60 },
      },
      {
        text: 'Перехватить управление системами — технический путь',
        next: 'act5_ending_hacker',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'addStat', stat: 'stress', value: 10 },
        ],
        condition: { minSkill: { coding: 8 } },
      },
      {
        text: 'Возглавить Сеть как движение — революционный путь',
        next: 'act5_ending_rebel',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
        ],
        condition: { minSkill: { persuasion: 8 } },
      },
      {
        text: 'Уйти — этот город забрал слишком много',
        next: 'act5_ending_alone',
        effects: [
          { type: 'addStat', stat: 'stress', value: 15 },
          { type: 'addKarma', value: -10 },
        ],
        condition: { maxKarma: 40 },
      },
    ],
  },

  act5_ending_poet: {
    id: 'act5_ending_poet',
    text: 'Город называет тебя поэтом. Не потому что ты написал больше всех — а потому что ты заставил их вспомнить. Стихи больше не прячутся в коде — они звучат на площадях, печатаются на стенах, поются в метро. Гильдия не пала — она трансформировалась, как трансформировался город. Ты сидишь в «Синей яме» и пишешь. За окном — рассвет. Альберт кивает тебе из своего угла. Зарема приносит чай. Мир не стал идеальным, но в нём снова есть место для красоты.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Прочитать новое стихотворение вслух',
        next: 'act5_epilogue',
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'writing', value: 5 },
          { type: 'setFlag', flag: 'ending_poet', flagValue: true },
        ],
      },
    ],
  },

  act5_ending_hacker: {
    id: 'act5_ending_hacker',
    text: 'Ты не поэт — ты архитектор. Там, где другие видели стихи, ты увидел систему, которую можно перестроить. Изнутри. Твои руки на клавиатуре, твои глаза на мониторах — ты переписываешь саму основу города. Код, который несёт поэзию в каждом байте. Архитектура, где свобода слова встроена в фундамент. Гильдия стала ненужной — не потому что ты её разрушил, а потому что ты создал нечто лучшее. Виктория улыбается из сети: «Ты понял. Код и стих — одно.»',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    choices: [
      {
        text: 'Скомпилировать новый мир',
        next: 'act5_epilogue',
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'coding', value: 5 },
          { type: 'setFlag', flag: 'ending_hacker', flagValue: true },
        ],
      },
    ],
  },

  act5_ending_rebel: {
    id: 'act5_ending_rebel',
    text: 'Сеть — это не просто группа людей. Это движение. Революция, которая началась со стихов. Ты стоишь перед толпой на площади — тысячи лиц, освещённых неоном и надеждой. Ты не командир и не вождь — ты голос. Голос, который сказал: «Стихи нельзя стереть.» И город ответил: «Мы помним.» Гильдия отступила — не разбитая, но сломленная осознанием, что слово сильнее кода. Ты поднимаешь руку, и площадь затихает. А потом ты читаешь. И город слушает.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Продолжать читать — каждая строка как клятва',
        next: 'act5_epilogue',
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'persuasion', value: 5 },
          { type: 'setFlag', flag: 'ending_rebel', flagValue: true },
        ],
      },
    ],
  },

  act5_ending_alone: {
    id: 'act5_ending_alone',
    text: 'Ты уходишь на рассвете. Рюкзак на плече, в кармане — чип с последними стихами. Город просыпается за твоей спиной — люди читают на экранах то, что ты им дал. Но ты не можешь остаться. Слишком много потеряно. Слишком много лиц, которые ты не смог спасти. Зарема. Дмитрий. Может быть, Виктория. Ты идёшь по шоссе, и за горизонт проецируются строки стихов. Ты не оглядываешься. Но стихи — они с тобой. Навсегда.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Идти дальше — может, где-то нужен другой поэт',
        next: 'act5_epilogue',
        effects: [
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'setFlag', flag: 'ending_alone', flagValue: true },
        ],
      },
    ],
  },

  act5_ending_sacrifice: {
    id: 'act5_ending_sacrifice',
    text: 'Ты садишься за терминал в последний раз. Виктория стоит рядом — или висит в воздухе, полупрозрачная, сотканная из данных и света. «Если я волью себя в сеть целиком,» — шепчешь ты, — «стихи станут бессмертными. Ни одна строка не будет удалена никогда.» Виктория качает головой: «Ты станешь кодом, Володька. Человеком — перестанешь.» Ты закрываешь глаза. Где-то внутри звучит ритм — не сердцебиение, а пульсация данных. Ты выбираешь вечность.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
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
    effects: [],
  },

  act5_epilogue: {
    id: 'act5_epilogue',
    text: 'Город помнит. Экраны продолжают мерцать стихами — не потому что кто-то их поддерживает, а потому что они живые. В кафе «Синяя яма» бариста подаёт «особый» кофе — и каждый глоток несёт строку. На улицах дети читают вслух, и их голоса смешиваются с шумом неона. Где-то в сети пульсирует Виктория — или то, что когда-то было Викторией. Где-то в коде живёт Володька — или то, что когда-то было Володькой. А может быть, и тот, и другой. Потому что стихи не умирают. Они просто меняют форму.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Начать сначала — новая история ждёт',
        next: 'start',
        effects: [
          { type: 'addKarma', value: 5 },
        ],
      },
    ],
  },
};
