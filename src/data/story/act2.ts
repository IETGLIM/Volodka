import type { StoryNode } from '@/shared/types/game';

export const STORY_NODES_ACT2: Record<string, StoryNode> = {
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
        next: 'act2_albert_hint', goldenPath: true,
        effects: [{ type: 'setFlag', flag: 'act2_started', flagValue: true }, { type: 'setFlag', flag: 'advanced_to_act2', flagValue: true }],
      },
      {
        text: 'Искать Викторию — она знает больше',
        next: 'act2_maria_search',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'act2_started', flagValue: true },
          { type: 'setFlag', flag: 'advanced_to_act2', flagValue: true },
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
        next: 'act2_albert_network_hint', goldenPath: true,
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
        next: 'act2_maria_search', goldenPath: true,
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
        next: 'maria_introduction',
        goldenPath: true,
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
        next: 'act2_network_initiation', goldenPath: true,
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
          { type: 'setFlag', flag: 'recited_poem_initiation', flagValue: true },
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
          { type: 'setFlag', flag: 'recited_poem_initiation', flagValue: true },
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
        next: 'act2_safehouse_terminal', goldenPath: true,
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
        next: 'act2_safehouse_message', goldenPath: true,
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
        next: 'act2_dmitry_contact', goldenPath: true,
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
        next: 'act2_dmitry_office_meeting', goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'dmitry_defection' },
          { type: 'setFlag', flag: 'dmitry_meeting_agreed', flagValue: true },
        ],
      },
      {
        text: 'Это может быть ловушкой. Действовать осторожно.',
        next: 'act2_dmitry_office_meeting',
        effects: [
          { type: 'triggerQuest', questId: 'dmitry_defection' },
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
        next: 'act2_network_oath', goldenPath: true,
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
        text: 'Послушать, как Сеть читает стихи вслух',
        next: 'reading_reaction',
        goldenPath: true,
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
        next: 'volunteer_read', goldenPath: true,
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
        next: 'act2_bridge', goldenPath: true,
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
        next: 'act2_vault_revealed', goldenPath: true,
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
        text: 'Договориться с баристой о явочной квартире',
        next: 'act2_safehouse_agreed',
        goldenPath: true,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'vault_protect_vowed', flagValue: true },
          { type: 'setFlag', flag: 'vault_access_granted', flagValue: true },
          { type: 'setFlag', flag: 'cafe_safehouse_agreed', flagValue: true },
          { type: 'triggerQuest', questId: 'cafe_safehouse' },
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
        next: 'cafe_evening_end', goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'knows_protocol', flagValue: true },
          { type: 'setFlag', flag: 'heard_dmitry_story', flagValue: true },
          { type: 'setFlag', flag: 'dmitry_escape_planned', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Почему Александр не уничтожил Хранилище сам?',
        next: 'cafe_evening_end',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'alexander_mystery', flagValue: true },
          { type: 'setFlag', flag: 'heard_dmitry_story', flagValue: true },
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
        next: 'act2_closing', goldenPath: true,
        effects: [
          { type: 'collectPoem', poemId: 'poem_5' },
          { type: 'collectPoem', poemId: 'poem_15' },
          { type: 'setFlag', flag: 'dmitry_defected', flagValue: true },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
      {
        text: 'Просто посидеть в тишине',
        next: 'act2_closing',
        effects: [
          { type: 'collectPoem', poemId: 'poem_5' },
          { type: 'setFlag', flag: 'dmitry_defected', flagValue: true },
          { type: 'addStat', stat: 'energy', value: 10 },
        ],
      },
    ],
  },

  pier_arrival: {
    id: 'pier_arrival',
    text: 'Пирс №3 встречает тебя запахом реки и дыма. Костёр в ржавой бочке, струнные огни над чёрной водой — failover ЧК, когда лес на Зорге слишком шумный. Старик с удочкой у перил не оборачивается: он уже знает, что кто-то пришёл. Река помнит больше, чем говорит.',
    speaker: 'narrator',
    sceneId: 'river_pier',
    choices: [
      {
        text: 'Осмотреться у воды',
        next: 'pier_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'visited_river_pier', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  pier_explore_mode: {
    id: 'pier_explore_mode',
    text: 'Пирс у речи — костёр в бочке, лунная дорожка на воде, камыши и старая лодка килем вверх. Трофим сторожит перила, будто поплавок. Здесь ЧК говорит тише, чем в лесу: река слышит всё и хранит молчание.',
    speaker: 'narrator',
    sceneId: 'river_pier',
    choices: [
      {
        text: 'Подойти к Трофиму у перил — [E] у NPC',
        next: 'pier_explore_mode',
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
      {
        text: 'Осмотреть лодку на берегу',
        next: 'pier_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'pier_boat_hint', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Погреться у костра — подумать о ключе от «Хрома-М»',
        next: 'pier_explore_mode',
        condition: { flag: 'visited_river_pier' },
        effects: [{ type: 'addStat', stat: 'stress', value: -2 }],
      },
      {
        text: 'Идти к заброшенному заводу — если ключ уже есть',
        next: 'abandoned_workshop',
        goldenPath: true,
        condition: { flag: 'factory_unlocked' },
        effects: [{ type: 'addStat', stat: 'stress', value: 3 }],
      },
      { text: 'Свободно исследовать пирс', next: 'pier_explore_mode' },
    ],
  },

  zarema_bank_discovery: {
    id: 'zarema_bank_discovery',
    text: 'Ноутбук Заремы на столе — экран не погашен. Банковское приложение пульсирует красным: транзакции уходят странными маршрутами, суммы не сходятся. Зарема ещё не знает, что ты это видишь. Следы ведут к гильдии — и к выбору, который нельзя отложить.',
    speaker: 'narrator',
    sceneId: 'zarema_albert_room',
    choices: [
      {
        text: 'Зафиксировать следы и начать расследование',
        next: 'zarema_room_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'found_zarema_bank', flagValue: true },
          { type: 'triggerQuest', questId: 'bank_transfer' },
          { type: 'addSkill', skill: 'logic', value: 1 },
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
        next: 'act3_transition', goldenPath: true,
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

};
