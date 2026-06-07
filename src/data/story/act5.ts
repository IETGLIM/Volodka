import type { StoryNode } from '@/shared/types/game';

export const STORY_NODES_ACT5: Record<string, StoryNode> = {
  /* ═══════════════════════════════════════════════════════════════════
     ACT 5 — ФИНАЛ: Последний выбор
     ═══════════════════════════════════════════════════════════════════ */

  act5_peaceful_path: {
    id: 'act5_peaceful_path',
    text: 'Ты спускаешься с крыши не победителем, а строителем. Мирный путь — самый трудный. Ты приглашаешь Александра на встречу в «Синей яме». Он приходит — один, без охраны, постаревший на десять лет за эти недели. «Я знал о стихах,» — говорит он тихо. «Я знал, и я пытался защитить их... по-своему. Протокол Забвения — не мой. Его навязали сверху. Дай мне шанс исправить.» За окном падает снег, и на мгновение город кажется прежним — тем, что существовал до серверов.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
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
        next: 'ending_reconciliation',
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
    text: 'Все 21 стихотворение собрано. Все слова — твои. Ты стоишь посреди города, и каждое стихотворение, которое ты когда-либо читал, каждое, которое когда-либо писал, — всё это звучит одновременно. Не шум — симфония. Ты чувствуешь, как слова обретают плоть, как строки становятся мостами между людьми. Реальность поддаётся — как глина под пальцами скульптора. Ты — не просто поэт. Ты — само Слово, и слово это — свобода.',
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
  },

  act5_epilogue: {
    id: 'act5_epilogue',
    text: 'Город помнит. Экраны продолжают мерцать стихами — не потому что кто-то их поддерживает, а потому что они живые. В кафе «Синяя яма» бариста подаёт «особый» кофе — и каждый глоток несёт строку. На улицах дети читают вслух, и их голоса смешиваются с шумом неона. Где-то в сети пульсирует Виктория — или то, что когда-то было Викторией. Где-то в коде живёт Володька — или то, что когда-то было Володькой. А может быть, и тот, и другой. Потому что стихи не умирают. Они просто меняют форму.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Сделать глоток кофе — история продолжается',
        next: 'act6_bridge',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'act5_epilogue_seen', flagValue: true },
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

  /* ─── ENDINGS ─── */

  ending_reconciliation: {
    id: 'ending_reconciliation',
    text: 'Мир. Не тихий, не простой — но настоящий. Александр открывает архивы гильдии, и стихи возвращаются в город. Сеть становится официальной организацией — «Свободная Библиотека». Ты сидишь в «Синей яме», и бариста подаёт тебе кофе — обычный, без шифров. За окном идёт снег. Зарема смеётся. Виктория улыбается — обеими своими половинами. Ты пишешь новое стихотворение. Первое — свободное. Вся клевета вернётся к тем, кто лжёт — а правда останется. Навсегда.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Конец. Мир восстановлен.',
        next: null,
        effects: [
          { type: 'collectPoem', poemId: 'poem_18' },
          { type: 'addKarma', value: 10 },
        ],
      },
    ],
  },

  ending_creator: {
    id: 'ending_creator',
    text: 'Ты создаёшь новый мир. Не революцию — созидание. «Живой код» возвращается: стихи в каждой программе, поэзия в каждом алгоритме. Город становится симфонией слов и логики. Тебя называют Создателем — но ты знаешь: ты лишь услышал то, что всегда звучало. В каждом байте, в каждой строке, в каждом вздохе города. «Эпитафия» звучит на всех экранах — не как прощание, а как начало.',
    speaker: 'narrator',
    sceneId: 'library_day',
    choices: [
      {
        text: 'Конец. Код и поэзия едины.',
        next: null,
        effects: [
          { type: 'collectPoem', poemId: 'poem_13' },
          { type: 'addKarma', value: 10 },
        ],
      },
    ],
  },

  ending_rebel: {
    id: 'ending_rebel',
    text: 'Гильдия пала. На её месте — хаос, но хаос свободный. Люди пишут стихи на стенах, читают их на площадях, прячут в коде — но больше не боятся. Ты — символ революции, но ты знаешь: революция — не конец. Это начало. Долгий, трудный путь к миру, где слово — не преступление. Ты стоишь на обломках башни гильдии и смотришь на горизонт. Там — свобода. И ты больше не молчишь.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Конец. Поэзия свободна.',
        next: null,
        effects: [{ type: 'addKarma', value: 5 }, { type: 'collectPoem', poemId: 'poem_19' }],
      },
    ],
  },

  ending_exile: {
    id: 'ending_exile',
    text: 'Пустошь. Тишина. Только ветер и твои стихи. Ты строишь хижину из обломков старой серверной фермы. Каждый вечер ты пишешь при свете костра, и пламя отбрасывает тени букв на стенах. Может быть, однажды кто-нибудь найдёт твои тетради. Может быть, нет. Но ты пишешь. Потому что слово — это то, что делает тебя живым. Даже на краю мира. За горизонтом мерцает город — чужой и далёкий. Ты не оглядываешься.',
    speaker: 'narrator',
    sceneId: 'street_winter',
    choices: [
      {
        text: 'Конец. Изгой со стихами.',
        next: null,
        effects: [{ type: 'addKarma', value: 3 }, { type: 'collectPoem', poemId: 'poem_20' }],
      },
    ],
  },

  ending_machine: {
    id: 'ending_machine',
    text: 'Ты входишь в систему. Не как слуга — как архитектор. Твой код переписывает Протокол Забвения изнутри, превращая оружие уничтожения в инструмент сохранения. Каждая программа теперь хранит стихи. Каждый сервер — библиотека. Но часть тебя остаётся внутри — как Виктория, ты становишься чем-то большим, чем человек. Ты — машина, которая помнит. Навсегда. Без сострадания, без жалости — но с абсолютной, кристальной памятью о каждом слове.',
    speaker: 'narrator',
    sceneId: 'sleep_dream',
    choices: [
      {
        text: 'Конец. Машина, которая помнит.',
        next: null,
        effects: [{ type: 'addKarma', value: 5 }, { type: 'collectPoem', poemId: 'poem_21' }],
      },
    ],
  },

  ending_poet: {
    id: 'ending_poet',
    text: 'И ты читаешь. Последнее стихотворение — то, которое не существовало до этого момента. Слова рождаются из тишины, из света, из всех 21 стихов, которые ты собрал, из всех людей, которых ты встретил, из всего, что ты потерял и обрёл. Город замирает. Небо проясняется. Реальность дрожит — и поддаётся. Стихи больше не прячутся в коде — они становятся самой тканью мира. И в этой тишине — вечность. Ты — поэт. Ты — слово. Ты — свободен.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Конец. Слово стало миром.',
        next: null,
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
          { type: 'setFlag', flag: 'inner_pledge_poems', flagValue: true },
          { type: 'triggerQuest', questId: 'poetry_collection' },
        ],
      },
    ],
  },


};
