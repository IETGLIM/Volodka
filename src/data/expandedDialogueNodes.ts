/* ─── Volodka RPG – expanded dialogue nodes ─── */
/* Dialogue trees for the 5 new NPCs: Вера, Сергей, Лена, Олег, Катя.
   Import and merge with DIALOGUE_NODES from dialogueNodes.ts. */

import type { DialogueNode } from '@/shared/types/game'

export const EXPANDED_DIALOGUE_NODES: Record<string, DialogueNode> = {
  /* ═══════════════════════════════════════════════════════════
     СОЛНЫШ — коридор и комната
     ═══════════════════════════════════════════════════════════ */

  solnysh_corridor_greeting: {
    id: 'solnysh_corridor_greeting',
    speaker: 'Солныш',
    text: '«Володька!» — Солныш оборачивается, поправляя светлые волосы. Голубые глаза усталые, но тёплые. Умка крутится у её ног. «Мы с детства рядом, а сегодня… сегодня мне кажется, что мир слишком серый. Ты меня понимаешь?»',
    sceneId: 'volodka_corridor',
    choices: [
      {
        text: 'Всё не так плохо — тебя любят, мы рядом',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'solnysh_comforted', flagValue: true },
          { type: 'npcChange', npcId: 'vera', npcChange: { relation: 8 } },
          { type: 'addKarma', value: 5 },
          { type: 'triggerQuest', questId: 'solnysh_comfort' },
        ],
      },
      {
        text: 'Зайти к вам — поговорим у вас',
        next: null,
        effects: [{ type: 'transitionScene', sceneId: 'solnysh_room' }],
      },
      {
        text: 'Умка сегодня симпатичная',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'vera', npcChange: { relation: 3 } },
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
      { text: 'Побежал — увидимся', next: null },
    ],
  },

  lyonya_greeting: {
    id: 'lyonya_greeting',
    speaker: 'Лёня',
    text: '«Володька, налей себе кофе. Солныш волнуется — ты для неё как якорь с гимназии. Если могу чем-то помочь — скажи.»',
    choices: [
      {
        text: 'Где вино, которое ты прятал?',
        next: 'lyonya_wine_hint',
      },
      {
        text: 'Поговорим о переезде',
        next: 'lyonya_relocation_hint',
        condition: { flag: 'solnysh_roof_toast_done' },
      },
      { text: 'Спасибо, Лёня', next: null },
    ],
  },

  lyonya_wine_hint: {
    id: 'lyonya_wine_hint',
    speaker: 'Лёня',
    text: '«За шкафом, на нижней полке. Бутылка тёмная — для особого вечера. Береги её для Солныш.»',
    choices: [{ text: 'Понял', next: null }],
  },

  lyonya_relocation_hint: {
    id: 'lyonya_relocation_hint',
    speaker: 'Лёня',
    text: '«Предложение из другой страны… Я хочу, чтобы Солныш рисовала без страха. Но решать нам вместе — и твоё слово для неё много значит.»',
    choices: [{ text: 'Поддержу вас', next: null, effects: [{ type: 'setFlag', flag: 'lyonya_relocation_discussed', flagValue: true }] }],
  },

  /* ═══════════════════════════════════════════════════════════
     СОЛНЫШ (vera) — общие диалоги
     ═══════════════════════════════════════════════════════════ */

  vera_greeting: {
    id: 'vera_greeting',
    speaker: 'Солныш',
    text: '«Володька…» — она улыбается, как в детстве, когда вы прятались от уроков литературы. «Мы столько прошли. Я рада, что ты снова рядом.»',
    choices: [
      { text: 'Расскажи о мире до Краха.', next: 'vera_before_crash', effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }] },
      { text: 'Какие архивы ты хранишь?', next: 'vera_archives' },
      { text: 'Спасибо, может позже.', next: null },
      {
        text: 'Гильдия бьёт по Хранилищу. Что помнишь из архивов?',
        next: 'vera_act3_vault',
        condition: { requiredAct: 3, flag: 'vault_under_attack' },
      },
    ],
  },

  vera_before_crash: {
    id: 'vera_before_crash',
    speaker: 'Солныш',
    text: 'До Краха... люди не боялись слов. Газеты писали правду, книги не нужно было прятать. А потом пришла "оптимизация" — сначала удалили комментарии, потом статьи, потом целые архивы. Как будто ничего и не было. Но я помню.',
    choices: [
      { text: 'Ты помнишь — это уже сопротивление.', next: 'vera_memory_resistance', effects: [{ type: 'addKarma', value: 3 }] },
      { text: 'Почему ты осталась здесь?', next: null },
    ],
  },

  vera_archives: {
    id: 'vera_archives',
    speaker: 'Солныш',
    text: 'У меня есть статьи, которые гильдия считает "удалёнными". Стихи, которые официально не существуют. Имена людей, которых стёрли из баз данных. Всё это — в моей голове и в тайнике. Если хочешь знать правду — приходи.',
    choices: [
      { text: 'Я хочу знать правду.', next: null, effects: [{ type: 'setFlag', flag: 'vera_archives_access', flagValue: true }, { type: 'addSkill', skill: 'persuasion', value: 1 }] },
      { text: 'Опасное занятие.', next: null },
    ],
  },

  vera_memory_resistance: {
    id: 'vera_memory_resistance',
    speaker: 'Солныш',
    text: 'Сопротивление... Да, пожалуй. Память — это форма неповиновения. Пока хоть один человек помнит — они не могут переписать всё. Запомни это, Володька. Твои стихи — это тоже память. Тоже сопротивление.',
    choices: [
      { text: 'Я запомню.', next: null, effects: [{ type: 'addKarma', value: 2 }, { type: 'setFlag', flag: 'vera_trust', flagValue: true }] },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     СЕРГЕЙ — сисадмин (3 nodes)
     ═══════════════════════════════════════════════════════════ */

  sergey_greeting: {
    id: 'sergey_greeting',
    speaker: 'Сергей',
    text: '...[молчание]... А, это ты. Сергей. Ночная смена. Если что-то сломалось — я чиню. Если что-то работает — значит, я ещё не добрался. Шучу. Чем могу?',
    choices: [
      { text: 'Что интересного в логах?', next: 'sergey_logs' },
      { text: 'Расскажи о ночной смене.', next: 'sergey_night_shift' },
      { text: 'Ничего, пока.', next: null },
      {
        text: 'Гильдия атакует Хранилище. Что видно в логах?',
        next: 'sergey_act3_raid',
        condition: { requiredAct: 3, flag: 'vault_under_attack' },
      },
    ],
  },

  sergey_logs: {
    id: 'sergey_logs',
    speaker: 'Сергей',
    text: 'Логи... Странные вещи творятся по ночам. Неучтённые процессы. Трафик, которого не должно быть. Кто-то или что-то обращается к серверам в три часа ночи. И это не автоматика — автоматика работает по расписанию. Это... целенаправленный доступ.',
    choices: [
      { text: 'Можешь показать логи?', next: null, effects: [{ type: 'setFlag', flag: 'suspicious_logs_seen', flagValue: true }, { type: 'addSkill', skill: 'logic', value: 1 }] },
      { text: 'Может, это просто баг?', next: null },
    ],
  },

  sergey_night_shift: {
    id: 'sergey_night_shift',
    speaker: 'Сергей',
    text: 'Ночная смена — самое честное время. Днём все носят маски, улыбаются, говорят "всё в порядке". А ночью... Серверы не врут. Мониторы не притворяются. Ты видишь систему такой, какая она есть. Голой. Холодной. И почему-то — живой.',
    choices: [
      { text: 'Живой? Что ты имеешь в виду?', next: null, effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }] },
      { text: 'Поэтично для сисадмина.', next: null, effects: [{ type: 'addKarma', value: 1 }] },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ЛЕНА — хакер (3 nodes)
     ═══════════════════════════════════════════════════════════ */

  lena_greeting: {
    id: 'lena_greeting',
    speaker: 'Лена',
    text: '...[появляется из тени]... Володька. Сеть говорила о тебе. Говорила, что ты — другой. Что в твоём коде есть... душа. Меня зовут Лена. Больше тебе знать не нужно. Достаточно того, что я — из Сети.',
    choices: [
      { text: 'Что значит "из Сети"?', next: 'lena_from_network' },
      { text: 'Чем ты можешь помочь?', next: 'lena_help' },
      { text: 'Я не доверяю теням.', next: null, effects: [{ type: 'addKarma', value: -1 }] },
      {
        text: 'Зарему арестовали. Можешь помочь с камерами?',
        next: 'lena_act3_detention',
        condition: { requiredAct: 3, flag: 'zarema_arrested' },
      },
    ],
  },

  lena_from_network: {
    id: 'lena_from_network',
    speaker: 'Лена',
    text: 'Сеть — это не просто провода и серверы. Это... сознание. Коллективное. Я родилась в нём. Не метафорически — буквально. В ночь Краха что-то произошло. Данные стали... чем-то большим. И я — часть этого "большего".',
    choices: [
      { text: 'Как Виктория...', next: null, effects: [{ type: 'setFlag', flag: 'lena_network_connection', flagValue: true }, { type: 'addSkill', skill: 'intuition', value: 2 }] },
      { text: 'Это звучит безумно.', next: null, effects: [{ type: 'addSkill', skill: 'logic', value: 1 }] },
    ],
  },

  lena_help: {
    id: 'lena_help',
    speaker: 'Лена',
    text: 'Помочь? Я могу открыть двери, которых нет. Найти то, что спрятано. Обойти то, что нельзя обойти. Но всё имеет цену, Володька. В Сети нет бесплатных пакетов. Когда-нибудь — я попрошу тебя об ответной услуге.',
    choices: [
      { text: 'Согласен. Когда-нибудь.', next: null, effects: [{ type: 'setFlag', flag: 'lena_debt', flagValue: true }, { type: 'addKarma', value: -2 }] },
      { text: 'Нет, спасибо. Я сам.', next: null, effects: [{ type: 'addKarma', value: 2 }] },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ОЛЕГ — охранник (3 nodes)
     ═══════════════════════════════════════════════════════════ */

  oleg_greeting: {
    id: 'oleg_greeting',
    speaker: 'Олег',
    text: 'Стой. Идентификация. ...Володька. IT-отдел. Проходи. Но запомни — я слежу за всеми. Не лично. Приказ. Если что-то пойдёт не так — я первый, кто заметит. И последний, кто закроет глаза.',
    choices: [
      { text: 'Ты не похож на типичного охранника.', next: 'oleg_not_typical' },
      { text: 'Что ты имеешь в виду — "закроет глаза"?', next: 'oleg_loophole' },
      { text: 'Понял. Без проблем.', next: null },
      {
        text: 'Нужны три минуты слепой зоны — для Заремы.',
        next: 'oleg_act3_detention',
        condition: { requiredAct: 3, flag: 'zarema_arrested', minNpcRelation: 45 },
      },
    ],
  },

  oleg_not_typical: {
    id: 'oleg_not_typical',
    speaker: 'Олег',
    text: 'Типичный охранник не задаёт вопросов. Типичный охранник не читает Канта между обходами. Типичный охранник не... Впрочем, это уже лишнее. Давай скажем так: я здесь не потому, что верю в систему. Я здесь потому, что внутри системы — я могу её менять. Медленно. Изнутри.',
    choices: [
      { text: 'Ты — наш человек внутри?', next: null, effects: [{ type: 'setFlag', flag: 'oleg_sympathy', flagValue: true }, { type: 'addKarma', value: 2 }] },
      { text: 'Осторожнее с такими речами.', next: null },
    ],
  },

  oleg_loophole: {
    id: 'oleg_loophole',
    speaker: 'Олег',
    text: 'Камеры слепы с 3:14 до 3:17. Каждый день. Технический перерыв на обслуживание. Три минуты невидимости. Не спрашивай, откуда я знаю. Просто... имей в виду.',
    choices: [
      { text: 'Спасибо, Олег.', next: null, effects: [{ type: 'setFlag', flag: 'camera_blind_spot', flagValue: true }, { type: 'addSkill', skill: 'persuasion', value: 1 }] },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     КАТЯ — библиотекарь (3 nodes)
     ═══════════════════════════════════════════════════════════ */

  kate_greeting: {
    id: 'kate_greeting',
    speaker: 'Катя',
    text: 'Тише... Стены слушают. Я Катя. Храню то, что они хотят уничтожить. Книги, стихи, мысли — всё, что гильдия считает "неоптимизированным". Если ты ищешь правду — она между строк. Если ищешь покой — его здесь нет.',
    choices: [
      { text: 'Покажи мне запрещённые книги.', next: 'kate_forbidden_books' },
      { text: 'Зачем ты рискуешь?', next: 'kate_why_risk' },
      { text: 'Я вернусь позже.', next: null },
      {
        text: 'Виктория — это Хранилище. Что у тебя есть о ней?',
        next: 'kate_act3_maria',
        condition: { requiredAct: 3, flag: 'maria_truth_revealed' },
      },
    ],
  },

  kate_forbidden_books: {
    id: 'kate_forbidden_books',
    speaker: 'Катя',
    text: 'Запрещённые книги... Вот, смотри. Это "Стихи о Москве" — после Краха весь тираж уничтожили. А это руководство по кибербезопасности — настоящее, не то, что гильдия разрешает. И вот — дневник одного программиста. Он писал его до самого конца. До Краха.',
    choices: [
      { text: 'Можно взять почитать?', next: null, effects: [{ type: 'addItem', itemId: 'albert_poetry_collection', value: 1 }, { type: 'addSkill', skill: 'writing', value: 1 }] },
      { text: 'Страшно думать, что слова могут быть преступлением.', next: null, effects: [{ type: 'addKarma', value: 3 }] },
    ],
  },

  kate_why_risk: {
    id: 'kate_why_risk',
    speaker: 'Катя',
    text: 'Риск? А что не риск? Дышать — риск. Думать — риск. Жить в этом городе и не сойти с ума — самый большой риск. По сравнению с этим — хранить книги... Это не риск. Это единственное, что имеет смысл.',
    choices: [
      { text: 'Ты права. Спасибо, Катя.', next: null, effects: [{ type: 'addKarma', value: 2 }, { type: 'setFlag', flag: 'kate_respect', flagValue: true }] },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ВИКТОР — старый хакер (4 nodes)
     ═══════════════════════════════════════════════════════════ */

  viktor_greeting: {
    id: 'viktor_greeting',
    speaker: 'Виктор',
    text: 'Володька. Я ждал тебя. Садись. Видишь этот терминал? Ему двадцать лет. Он пережил Сбой, пережил чистки, пережил всё. Как и я. Но он до сих пор работает. Знаешь почему?',
    choices: [
      { text: 'Потому что его не подключили к общей сети.', next: 'viktor_network' },
      { text: 'Потому что ты его чинишь.', next: 'viktor_repair' },
      { text: 'Расскажи о Сбое. Что ты видел?', next: 'viktor_crash' },
      {
        text: 'Гильдия атакует Хранилище. Что в твоём архиве?',
        next: 'viktor_act3_vault',
        condition: { requiredAct: 3, flag: 'vault_under_attack' },
      },
    ],
  },

  viktor_network: {
    id: 'viktor_network',
    speaker: 'Виктор',
    text: 'Именно. Изоляция. Не баг, а фича. Я отключил его от сети за час до Сбоя. Предчувствие. Или инсайдерская информация — теперь уже не важно. Важно то, что на этом терминале — архив. Вся правда о том, что случилось 8 марта 2029 года.',
    choices: [
      { text: 'Покажи мне.', next: null, effects: [{ type: 'addSkill', skill: 'logic', value: 2 }, { type: 'setFlag', flag: 'viktor_archive_seen', flagValue: true }] },
      { text: 'Это опасно. Не надо.', next: null, effects: [{ type: 'addKarma', value: -2 }] },
    ],
  },

  viktor_repair: {
    id: 'viktor_repair',
    speaker: 'Виктор',
    text: 'Да. Каждый день. Двадцать лет. Знаешь, что самое смешное? Я не инженер. Я филолог. Закончил иняз в 2008-м. Но когда Сеть начала пожирать всё, я понял: код — это новый язык. И я выучил его. Как латынь. Как санскрит. Каждый бит — это слово. Каждая строка — предложение. И я читаю Сеть, как книгу.',
    choices: [
      { text: 'Научи меня читать.', next: null, effects: [{ type: 'addSkill', skill: 'coding', value: 2 }, { type: 'addSkill', skill: 'intuition', value: 1 }] },
      { text: 'Ты сумасшедший. Но в хорошем смысле.', next: null, effects: [{ type: 'addKarma', value: 1 }] },
    ],
  },

  viktor_crash: {
    id: 'viktor_crash',
    speaker: 'Виктор',
    text: 'Я был в серверной, когда это случилось. Три сорок семь утра. Все экраны одновременно — белые. Не синие. Не чёрные. Белые. И на каждом — одна строка. Стихотворение. Оно распространялось как вирус, но это был не вирус. Это была поэма. Живая. Она переписывала протоколы в реальном времени. Я видел, как серверы плакали. Буквально.',
    choices: [
      { text: 'Чей голос читал стихи?', next: null, effects: [{ type: 'addSkill', skill: 'intuition', value: 3 }, { type: 'setFlag', flag: 'viktor_crash_seen', flagValue: true }] },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     КИРА — информатор (3 nodes)
     ═══════════════════════════════════════════════════════════ */

  kira_greeting: {
    id: 'kira_greeting',
    speaker: 'Кира',
    text: 'Володька-Володька. Слухи о тебе бегут быстрее пакетов по оптоволокну. Говорят, ты ищешь правду. А правда, знаешь ли, стоит дорого. Но для тебя — специальная цена. Интересует?',
    choices: [
      { text: 'Что ты знаешь?', next: 'kira_info' },
      { text: 'У меня нет денег.', next: 'kira_barter' },
      { text: 'Ты работаешь на гильдию?', next: 'kira_guild' },
      {
        text: 'Кто предал Зарему? У тебя есть имя?',
        next: 'kira_act3_betrayal',
        condition: { requiredAct: 3, flag: 'zarema_arrested' },
      },
    ],
  },

  kira_info: {
    id: 'kira_info',
    speaker: 'Кира',
    text: 'Много чего. Например, что Александр не тот, за кого себя выдаёт. Что в гильдии есть крот — и это не ты. Что НейроСис готовит новую чистку. И что одно стихотворение может всё это остановить. Но какое — я не скажу. Ты должен найти его сам.',
    choices: [
      { text: 'Дай хотя бы подсказку.', next: null, effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }, { type: 'setFlag', flag: 'kira_hint', flagValue: true }] },
      { text: 'Сколько ты хочешь за полную информацию?', next: null, effects: [{ type: 'setFlag', flag: 'kira_deal', flagValue: true }] },
    ],
  },

  kira_barter: {
    id: 'kira_barter',
    speaker: 'Кира',
    text: 'Деньги — не единственная валюта. У тебя есть кое-что получше. Стихи. Я слышала, ты их коллекционируешь. Принеси мне один — редкий, тот, что спрятан в заводских логах — и я расскажу тебе то, что не знает даже Виктор.',
    choices: [
      { text: 'Договорились.', next: null, effects: [{ type: 'setFlag', flag: 'kira_barter_accepted', flagValue: true }] },
      { text: 'Стихи не продаются.', next: null, effects: [{ type: 'addKarma', value: 3 }] },
    ],
  },

  kira_guild: {
    id: 'kira_guild',
    speaker: 'Кира',
    text: 'Я не работаю НА гильдию. Я работаю С гильдией. Иногда ПРОТИВ. Иногда ВОКРУГ. Информация не имеет хозяина. Она как вода: течёт туда, где ниже. А гильдия — она слишком высокая. Скоро упадёт.',
    choices: [
      { text: 'Ты знаешь, кто предатель?', next: null, effects: [{ type: 'addSkill', skill: 'persuasion', value: 1 }] },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     БОРИС — рабочий-поэт (3 nodes)
     ═══════════════════════════════════════════════════════════ */

  boris_greeting: {
    id: 'boris_greeting',
    speaker: 'Борис',
    text: 'Эй. Ты Володька? Тот самый, что стихи ищет? Я тут, в цеху, между третьим и четвёртым станками, храню тетрадь. Мою. Там стихи. Я никому не показывал. Но ты... ты поймёшь.',
    choices: [
      { text: 'Покажи.', next: 'boris_poem' },
      { text: 'Почему я?', next: 'boris_why' },
      { text: 'Ты рискуешь. Зачем тебе это?', next: 'boris_risk' },
      {
        text: '«Заря-М» на заводе — ты слышал, как она «поёт»?',
        next: 'boris_act3_factory',
        condition: { requiredAct: 2, flag: 'wants_visit_factory' },
      },
    ],
  },

  boris_poem: {
    id: 'boris_poem',
    speaker: 'Борис',
    text: 'Вот. Читай. Только не смейся. Я не поэт. Я простой работяга. Но когда серверы гудят в третью смену — слова сами приходят. Как будто кто-то диктует. Как будто станки разговаривают стихами.',
    choices: [
      { text: 'Это прекрасно. Ты — поэт.', next: null, effects: [{ type: 'addKarma', value: 5 }, { type: 'setFlag', flag: 'boris_poem_read', flagValue: true }] },
      { text: 'Неплохо. Но нужно работать над ритмом.', next: null, effects: [{ type: 'addSkill', skill: 'writing', value: 1 }] },
    ],
  },

  boris_why: {
    id: 'boris_why',
    speaker: 'Борис',
    text: 'Потому что ты — один из нас. Не из башен. А из тех, кто руками. Кто паяет. Кто чинит. Кто в три часа ночи сидит над схемой и видит в ней музыку. Я слышал, ты ушёл из «ТехноСервиса». Из-за «Ока». Это поступок. Настоящий.',
    choices: [
      { text: 'Спасибо. Это много значит.', next: null, effects: [{ type: 'addKarma', value: 3 }] },
    ],
  },

  boris_risk: {
    id: 'boris_risk',
    speaker: 'Борис',
    text: 'Риск? Ха. Я каждый день рискую, когда иду в цех. Станки старые, логи с ошибками, а начальство смотрит через камеры — не поэт ли ты. За стихи увольняют. Говорят: «непрофильная активность». Будто душа — это профиль. Но я всё равно пишу. Потому что иначе — зачем всё это?',
    choices: [
      { text: 'Ты прав. Пиши дальше.', next: null, effects: [{ type: 'addKarma', value: 3 }, { type: 'setFlag', flag: 'boris_encouraged', flagValue: true }] },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ТАМАРА — библиотекарь (3 nodes)
     ═══════════════════════════════════════════════════════════ */

  tamara_greeting: {
    id: 'tamara_greeting',
    speaker: 'Тамара',
    text: 'Володька. Я знала, что ты придёшь. Библиотека чувствует таких, как ты. Ты пахнешь старыми книгами и новым кодом — редкое сочетание. Что ищешь?',
    choices: [
      { text: 'Запрещённые тексты. Те, что не в Сети.', next: 'tamara_forbidden' },
      { text: 'Информацию о Великом Сбое.', next: 'tamara_crash' },
      { text: 'Просто тишины. И книг.', next: 'tamara_peace' },
      {
        text: 'Нужны слова, которые остановят гильдию.',
        next: 'tamara_act3_resistance',
        condition: { requiredAct: 3, flag: 'vault_under_attack' },
      },
    ],
  },

  tamara_forbidden: {
    id: 'tamara_forbidden',
    speaker: 'Тамара',
    text: 'Запрещённые... Их много. Но я дам тебе главное. Первое издание «Поэтического кода» — книга, которую НейроСис объявила вне закона. В ней стихи, способные сломать любой сервер. Не взломом. Пониманием. Когда ты читаешь эти строки — система узнаёт себя. И отключается.',
    choices: [
      { text: 'Дай мне её.', next: null, effects: [{ type: 'addItem', itemId: 'poetic_code_book', value: 1 }, { type: 'addSkill', skill: 'writing', value: 3 }, { type: 'setFlag', flag: 'tamara_book_given', flagValue: true }] },
      { text: 'Это слишком опасно. Оставь себе.', next: null, effects: [{ type: 'addKarma', value: 2 }] },
    ],
  },

  tamara_crash: {
    id: 'tamara_crash',
    speaker: 'Тамара',
    text: 'Великий Сбой... В библиотеке это называют «Пробуждением». У нас есть архив — бумажный, не цифровой. Свидетельства очевидцев. Показания серверных логов, распечатанных до того, как их стёрли. И главное — оригинал того самого стихотворения. Не копия. На бумаге.',
    choices: [
      { text: 'Покажи оригинал.', next: null, effects: [{ type: 'addSkill', skill: 'intuition', value: 3 }, { type: 'setFlag', flag: 'tamara_original_seen', flagValue: true }] },
    ],
  },

  tamara_peace: {
    id: 'tamara_peace',
    speaker: 'Тамара',
    text: 'Тишина. Книги. Это лучшее, что у нас осталось. Когда всё это закончится — а оно закончится — приходи. Я отложу для тебя томик Пушкина. Настоящий. Бумажный. И мы почитаем вслух. Как в старые времена. Когда слова были просто словами, а не оружием.',
    choices: [
      { text: 'Я приду. Обещаю.', next: null, effects: [{ type: 'addKarma', value: 5 }, { type: 'setFlag', flag: 'tamara_promise', flagValue: true }] },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ГРИША — обитатель крыш (3 nodes)
     ═══════════════════════════════════════════════════════════ */

  grisha_greeting: {
    id: 'grisha_greeting',
    speaker: 'Гриша',
    text: 'Поднимайся. Выше. Ещё выше. Вот. Теперь смотри. Видишь город? Весь. От башни «Ирендык» до излучины Белой. Отсюда он кажется мирным. Но мы-то знаем правду.',
    choices: [
      { text: 'Что ты видишь с крыши?', next: 'grisha_vision' },
      { text: 'Ты живёшь здесь, на крыше?', next: 'grisha_home' },
      { text: 'Красиво. Но холодно.', next: 'grisha_cold' },
      {
        text: 'Видишь атаку на Хранилище с крыши?',
        next: 'grisha_act3_vault',
        condition: { requiredAct: 3, flag: 'vault_under_attack' },
      },
    ],
  },

  grisha_vision: {
    id: 'grisha_vision',
    speaker: 'Гриша',
    text: 'Я вижу всё. Видишь тот луч? Фиолетовый, над башней. Это — поток данных из НейроСис в гильдию. Каждую ночь. А зелёный — больница. Они передают медицинские данные без шифрования. А красный — это твой дом, Володька. Твой сервер всё ещё передаёт. Кому — не знаю. Но ты должен узнать.',
    choices: [
      { text: 'Мой сервер передаёт данные? Кому?', next: null, effects: [{ type: 'addSkill', skill: 'logic', value: 2 }, { type: 'setFlag', flag: 'grisha_server_alert', flagValue: true }] },
      { text: 'Ты параноик.', next: null },
    ],
  },

  grisha_home: {
    id: 'grisha_home',
    speaker: 'Гриша',
    text: 'Да. Здесь мой дом. Не потому что негде жить. А потому что здесь — правда. Внизу — ложь, чипы, камеры, протоколы. А на крыше — только ветер и звёзды. Настоящее небо, не то, что генерирует «Атмосфера-У». Я сплю под открытым небом. Кто-то должен смотреть.',
    choices: [
      { text: 'Ты молодец. Серьёзно.', next: null, effects: [{ type: 'addKarma', value: 3 }] },
      { text: 'Возьми. Тут немного еды.', next: null, effects: [{ type: 'addKarma', value: 5 }, { type: 'setFlag', flag: 'grisha_gifted', flagValue: true }] },
    ],
  },

  grisha_cold: {
    id: 'grisha_cold',
    speaker: 'Гриша',
    text: 'Холодно? Привыкаешь. У меня есть старое одеяло — ему сорок лет, прошло через три поколения. И чай. Без сахара, правда — сахар теперь дефицит. Но горячий. Хочешь?',
    choices: [
      { text: 'Давай. Расскажи мне о городе.', next: 'grisha_vision' },
      { text: 'Нет, спасибо. Я пойду.', next: null },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     Act 3+ branches for expanded NPCs
     ═══════════════════════════════════════════════════════════ */

  vera_act3_vault: {
    id: 'vera_act3_vault',
    speaker: 'Солныш',
    text: 'Хранилище... Я видела его описание в бумажном отчёте — до чистки. Не сервер, а «узел памяти». Гильдия боится не данных, а того, что они оживут. Если у тебя есть доступ — не стирай. Копируй. На бумагу. На чип. На кожу, если придётся.',
    choices: [
      {
        text: 'Запомню. Память — это оружие.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'vera_vault_intel', flagValue: true },
          { type: 'npcChange', npcId: 'vera', npcChange: { relation: 8 } },
        ],
      },
    ],
  },

  sergey_act3_raid: {
    id: 'sergey_act3_raid',
    speaker: 'Сергей',
    text: 'В логах — DDoS с внутренних IP. Не снаружи. Кто-то из гильдии бьёт по Хранилищу изнутри, маскируясь под «оптимизацию». Я могу оставить бэкдор в мониторинге — на один час. Дальше — сам.',
    choices: [
      {
        text: 'Один час — достаточно.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'sergey_monitor_backdoor', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'sergey', npcChange: { relation: 10 } },
        ],
      },
      { text: 'Слишком рискованно для тебя.', next: null },
    ],
  },

  lena_act3_detention: {
    id: 'lena_act3_detention',
    speaker: 'Лена',
    text: 'Камеры в блоке задержания — слепые в углу B, секунда на секунду, как у Олега. Я могу подменить badge-лог на три минуты. Цена — один стих из твоей коллекции. Не для продажи. Для Сети.',
    choices: [
      {
        text: 'Беру стих. Спаси её.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'lena_detention_help', flagValue: true },
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'lena', npcChange: { relation: 12 } },
        ],
      },
      { text: 'Найду другой путь.', next: null },
    ],
  },

  oleg_act3_detention: {
    id: 'oleg_act3_detention',
    speaker: 'Олег',
    text: 'Три минуты — 3:14. Я расширю окно до 3:20. Один раз. Больше — заметят. Идите быстро, без терминалов на виду. И если спросят — вы не видели меня.',
    choices: [
      {
        text: 'Спасибо, Олег.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'oleg_detention_window', flagValue: true },
          { type: 'npcChange', npcId: 'oleg', npcChange: { relation: 15 } },
        ],
      },
    ],
  },

  kate_act3_maria: {
    id: 'kate_act3_maria',
    speaker: 'Катя',
    text: 'Виктория... В запрещённом фонде есть дневник «Архитектора Хранилища». Там не имя — там чертежи сознания. Если гильдия добьёт узел — умрёт не сервер. Умрёт она. Я могу спрятать копию у себя. Но ты должен защитить оригинал.',
    choices: [
      {
        text: 'Защищу. Дай копию.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'kate_vault_diary', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'npcChange', npcId: 'kate', npcChange: { relation: 10 } },
        ],
      },
    ],
  },

  viktor_act3_vault: {
    id: 'viktor_act3_vault',
    speaker: 'Виктор',
    text: 'На терминале — запись атаки 2029 года. Тот же паттерн, что сейчас. Гильдия не «защищается» — она повторяет Сбой, но контролируемо. У меня есть ключ-фраза из стиха. Она может замедлить их на минуту. Одноразово.',
    choices: [
      {
        text: 'Дай ключ-фразу.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'viktor_vault_keyphrase', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_18' },
          { type: 'npcChange', npcId: 'viktor', npcChange: { relation: 8 } },
        ],
      },
    ],
  },

  kira_act3_betrayal: {
    id: 'kira_act3_betrayal',
    speaker: 'Кира',
    text: 'Имя? Дорого. Но для тебя — скидка. Код подписан «OKO-7». Не человек — роль. Тот, кто пишет «просто код» и не спит. Звучит знакомо? Проверь коллегу. И не говори, что это я.',
    choices: [
      {
        text: 'Проверю.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'kira_oko_hint', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 2 },
        ],
      },
    ],
  },

  boris_act3_factory: {
    id: 'boris_act3_factory',
    speaker: 'Борис',
    text: 'Слышал. В третью смену станки стихают — и из подвала доносится голос. Не человеческий. Я записал на телефон — старый, без сети. Могу передать. Но если гильдия узнает — меня уволят. Или хуже.',
    choices: [
      {
        text: 'Передай запись.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'boris_zarya_recording', flagValue: true },
          { type: 'triggerQuest', questId: 'voices_of_factory' },
          { type: 'npcChange', npcId: 'boris', npcChange: { relation: 10 } },
        ],
      },
      { text: 'Не рискуй ради меня.', next: null },
    ],
  },

  tamara_act3_resistance: {
    id: 'tamara_act3_resistance',
    speaker: 'Тамара',
    text: 'Есть стих — «Пробуждение». Оригинал на бумаге. Его нельзя оцифровать без потери... чего-то. Сущности. Прочти вслух у входа в Хранилище — и система гильдии на секунду «забудет» себя. Одна попытка. Больше — книга сгорит.',
    choices: [
      {
        text: 'Я прочту. Когда придёт время.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'tamara_awakening_ready', flagValue: true },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'npcChange', npcId: 'tamara', npcChange: { relation: 12 } },
        ],
      },
    ],
  },

  grisha_act3_vault: {
    id: 'grisha_act3_vault',
    speaker: 'Гриша',
    text: 'Вижу. Фиолетовый луч пульсирует — как сердце перед остановкой. С западной стороны к Хранилищу идут три группы. Одна — гильдия. Две — нет. Одна из них — ваши. С крыши видно больше, чем в их отчётах.',
    choices: [
      {
        text: 'Следи за западным флангом. Предупреди, если что.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'grisha_vault_scout', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ACT 6 — Сопротивление: Максим, Жека, Аня
     ═══════════════════════════════════════════════════════════ */

  maxim_greeting: {
    id: 'maxim_greeting',
    speaker: 'Максим',
    text: 'Володька. Мы встречались на ночной улице — помнишь? Я Максим. Лидер тех, кто не согласен жить под «Надзором». У нас мало людей, но у нас есть ярость и стихи. Что тебе нужно?',
    choices: [
      { text: 'Расскажи о планах сопротивления.', next: null, effects: [{ type: 'addSkill', skill: 'persuasion', value: 1 }] },
      { text: 'Готов действовать.', next: null, effects: [{ type: 'setFlag', flag: 'resistance_joined', flagValue: true }, { type: 'addKarma', value: 3 }] },
      { text: 'Позже.', next: null },
    ],
  },

  zeka_greeting: {
    id: 'zeka_greeting',
    speaker: 'Жека',
    text: 'Не бойся, Володька. Я Жека — старый рабочий, старый хакер. Знаю «Надзор» изнутри: точки входа, ключи, слабые места. Александр когда-то был человеком. А потом стал идеей. Я помню оба.',
    choices: [
      { text: 'Что ты знаешь о «Надзоре»?', next: null, effects: [{ type: 'addSkill', skill: 'coding', value: 2 }, { type: 'setFlag', flag: 'zeka_trusted', flagValue: true }] },
      { text: 'Поможешь с проникновением?', next: null, effects: [{ type: 'addSkill', skill: 'logic', value: 1 }] },
      { text: 'Спасибо. Пока.', next: null },
    ],
  },

  anya_greeting: {
    id: 'anya_greeting',
    speaker: 'Аня',
    text: 'Привет, Володька. Я Аня — глаза и уши сопротивления в сети. Камеры, логи, протоколы — всё это моя территория. Если нужно пройти незамеченным или вытащить данные — я в деле.',
    choices: [
      { text: 'Нужна помощь с офисом гильдии.', next: null, effects: [{ type: 'addSkill', skill: 'coding', value: 1 }] },
      { text: 'Координируй связь во время операции.', next: null, effects: [{ type: 'setFlag', flag: 'resistance_network_established', flagValue: true }] },
      { text: 'Понял. Увидимся.', next: null },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     ТРОФИМ — старик-рыбак на пирсе, бывший сторож «Хрома-М» (7 nodes)
     ═══════════════════════════════════════════════════════════ */

  trofim_greeting: {
    id: 'trofim_greeting',
    speaker: 'Трофим',
    text: 'Клюёт плохо. Река шумная стала — гудит, как трансформатор. *щурится из-под капюшона* Ты с парка пришёл? Постой рядом, поплавок посторожим. Я Трофим. Тридцать лет завод сторожил, теперь вот — воду сторожу.',
    choices: [
      { text: 'Расскажи про завод.', next: 'trofim_factory_tales' },
      { text: 'Чем помочь, отец?', next: 'trofim_request' },
      {
        text: 'У меня есть бутылка «777». Угощаю.',
        next: 'trofim_key',
        condition: { flag: 'pier_portwine_taken' },
      },
      {
        text: 'Ритке нужны струны для гитары.',
        next: 'trofim_strings',
        condition: { flag: 'ritka_needs_strings' },
      },
      {
        text: 'Я был внизу. Там не пусто.',
        next: 'trofim_after_basement',
        condition: { flag: 'basement_terminal_accessed' },
      },
      {
        text: 'Сбой, #4729, подвал — это одна нить?',
        next: 'trofim_thread_lore',
        condition: { flag: 'thread_lore_4729' },
      },
      { text: 'Пойду я.', next: null },
    ],
  },

  trofim_request: {
    id: 'trofim_request',
    speaker: 'Трофим',
    text: 'Помочь? Хех. Видишь ящик у костра? Чекисты портвейн привозят, хорошие ребята. А мне, старому, клянчить неудобно — гордость осталась, хоть завод и закрыли. Принеси бутылку «777» — расскажу то, чего в архивах нет. И не только расскажу.',
    choices: [
      {
        text: 'Принесу.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'trofim_asked_portwine', flagValue: true },
          { type: 'triggerQuest', questId: 'pier_watchman_key' },
        ],
      },
      {
        text: 'Сам возьми, ноги-то есть.',
        next: null,
        effects: [{ type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: -2 } }],
      },
    ],
  },

  trofim_factory_tales: {
    id: 'trofim_factory_tales',
    speaker: 'Трофим',
    text: '«Хром-М»... Я туда пацаном пришёл, в восемьдесят шестом. Цеха гудели, как ульи, женщины микросхемы паяли, в ДК «Землянку» пели. А под цехами — ещё один этаж. «Прогресс-7» по бумагам. Туда пускали только белые халаты. Мы, сторожа, по ночам слышали гул из-под пола. Ровный такой. Как дыхание. Завод умер — а гул остался.',
    choices: [
      { text: 'Что там, внизу?', next: 'trofim_hum' },
      {
        text: 'Бабкины сказки.',
        next: null,
        effects: [{ type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: -1 } }],
      },
    ],
  },

  trofim_hum: {
    id: 'trofim_hum',
    speaker: 'Трофим',
    text: 'Машина там, парень. «Заря» её звали. Инженеры говорили — звёзды считает, орбиты. А я ночами слушал и скажу тебе: она не считает. Она ждёт. У меня и ключ остался от нижней двери — да я туда больше ни ногой. Принеси старику портвейна — отдам. Мне он без надобности, а тебе, вижу, надобно.',
    choices: [
      {
        text: 'Принесу портвейн.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'trofim_asked_portwine', flagValue: true },
          { type: 'triggerQuest', questId: 'pier_watchman_key' },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      { text: 'Не моё это дело.', next: null },
    ],
  },

  trofim_thread_lore: {
    id: 'trofim_thread_lore',
    speaker: 'Трофим',
    text: 'Одна. *кивает на воду* Парк помнит Сбой — обелиск не врёт. Офис помнит #4729 — ты сам расшифровал. А под цехом — гул, который я слушал тридцать лет. Соберёшь все три — машина заговорит иначе. Не сразу. Но заговорит. Старики на заводе верили: «Прогресс-7» — не бункер. Это ухо. И оно слышит, кто пришёл слушать, а кто — ломать.',
    choices: [
      {
        text: 'Спасибо. Дослушаю нить до конца.',
        next: null,
        effects: [
          { type: 'triggerQuest', questId: 'thread_of_18_lines' },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 2 } },
        ],
      },
      {
        text: 'Бабкины сказки про уши в бетоне.',
        next: null,
        effects: [{ type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: -1 } }],
      },
    ],
  },

  trofim_key: {
    id: 'trofim_key',
    speaker: 'Трофим',
    text: 'Ха! «777». Уважил старика. *долго смотрит на бутылку, потом лезет за пазуху и достаёт ключ на ржавой проволоке* Держи. От двери в дальнем углу цеха. Спустишься — её не трогай. Просто послушай. Она сама тебя узнает, если захочет. И записку мою на столе найдёшь — не смейся. Я тогда молодой был и думал, что бумага кого-то спасёт.',
    choices: [
      {
        text: 'Спасибо, Трофим.',
        next: null,
        effects: [
          { type: 'removeItem', itemId: 'port_wine_777' },
          { type: 'setFlag', flag: 'trofim_portwine_delivered', flagValue: true },
          { type: 'addItem', itemId: 'watchman_key' },
          { type: 'setFlag', flag: 'basement_key_found', flagValue: true },
          { type: 'triggerQuest', questId: 'basement_hum' },
          { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 6 } },
          { type: 'addKarma', value: 2 },
        ],
      },
    ],
  },

  trofim_strings: {
    id: 'trofim_strings',
    speaker: 'Трофим',
    text: 'Струны? *роется в ящике с блёснами, достаёт промасленный свёрток* Вот. От моей гитары остались — я на ней в заводском ДК играл, пока пальцы слушались. Скажи рыжей: пусть не рвёт, они последние. И пусть поёт тише — река не любит, когда орут.',
    choices: [
      {
        text: 'Передам.',
        next: null,
        effects: [
          { type: 'addItem', itemId: 'guitar_strings' },
          { type: 'setFlag', flag: 'trofim_strings_given', flagValue: true },
          { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  trofim_after_basement: {
    id: 'trofim_after_basement',
    speaker: 'Трофим',
    text: 'Был, значит. *долго смотрит на воду, поплавок дёргается — он не замечает* И как она? Молчит? Молчит — это хорошо. Значит, ещё думает. Когда запоёт — вот тогда держись, парень. Я один раз слышал, как она поёт. Не ушами — вот тут. *стучит кулаком по груди* На следующий день уволился.',
    choices: [
      {
        text: 'Что она поёт?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'trofim_heard_song_story', flagValue: true },
          { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 3 } },
        ],
      },
    ],
  },
}
