/* ─── Volodka RPG – expanded dialogue nodes ─── */
/* Dialogue trees for expanded NPCs including Алина «Солныш», Сергей, Лена, Олег, Катя.
   Import and merge with DIALOGUE_NODES from dialogueNodes.ts. */

import type { DialogueNode } from '@/shared/types/game'

export const EXPANDED_DIALOGUE_NODES: Record<string, DialogueNode> = {
  /* ═══════════════════════════════════════════════════════════
     СОЛНЫШ — коридор и комната
     ═══════════════════════════════════════════════════════════ */

  solnysh_corridor_greeting: {
    id: 'solnysh_corridor_greeting',
    speaker: 'Солныш',
    text: 'Она оборачивается от зеркала — голубые глаза усталые, но тёплые. «Не забывай есть, ладно?» Умка крутится у её ног. «Мы с детства рядом… а сегодня мне кажется, что мир слишком серый. Ты меня понимаешь?»',
    sceneId: 'volodka_corridor',
    choices: [
      {
        text: 'Всё не так плохо — тебя любят, мы рядом',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'solnysh_comforted', flagValue: true },
          { type: 'npcChange', npcId: 'solnysh', npcChange: { relation: 8 } },
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
          { type: 'npcChange', npcId: 'solnysh', npcChange: { relation: 3 } },
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
        text: 'Нужен курьер — посылка, которую лучше не вскрывать.',
        next: 'sl_courier_start',
        condition: {
          requiredAct: 3,
          flag: 'sl_window_light_done',
          missingFlag: 'sl_courier_accepted',
        },
      },
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
      {
        text: 'Я хочу знать правду — покажи архив в библиотеке',
        next: 'archive_forgotten_meet',
        condition: { requiredAct: 4, missingFlag: 'archive_poems_saved' },
        effects: [
          { type: 'setFlag', flag: 'vera_archives_access', flagValue: true },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
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
      {
        text: 'Александр ищет крота — покажи логи доступа',
        next: 'sergey_blind_spot_logs',
        condition: { requiredAct: 4, missingFlag: 'mole_identified' },
      },
      {
        text: 'Устав гильдии — дописать на проекторе',
        next: 'act7_charter_drafting',
        condition: {
          flag: 'act7_guild_charter_path',
          missingFlag: 'new_council_elected',
        },
      },
    ],
  },

  sergey_logs: {
    id: 'sergey_logs',
    speaker: 'Сергей',
    text: 'Логи... Странные вещи творятся по ночам. Неучтённые процессы. Трафик, которого не должно быть. Кто-то или что-то обращается к серверам в три часа ночи. И это не автоматика — автоматика работает по расписанию. Это... целенаправленный доступ.',
    choices: [
      { text: 'Можешь показать логи?', next: null, effects: [{ type: 'setFlag', flag: 'suspicious_logs_seen', flagValue: true }, { type: 'addSkill', skill: 'logic', value: 1 }, { type: 'triggerQuest', questId: 'night_shift_mystery' }] },
      { text: 'Может, это просто баг?', next: null },
    ],
  },

  sergey_blind_spot_logs: {
    id: 'sergey_blind_spot_logs',
    speaker: 'Сергей',
    text: 'Логи доступа к офису... Вот. После полуночи — чужой пропуск, но с вашим уровнем. Я не называю имён. Но если сложишь с допросом в кафе — увидишь.',
    choices: [
      {
        text: 'Спасибо. Иду сводить улики',
        next: 'blind_spot_approach',
        effects: [
          { type: 'triggerQuest', questId: 'blind_spot' },
          { type: 'setFlag', flag: 'blind_spot_active', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      { text: 'Пока только смотрю', next: null },
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
      {
        text: 'Цифровой призрак в серверной — продолжим?',
        next: 'digital_ghost_approach',
        condition: { flag: 'found_server_room', missingFlag: 'ai_fragment_recovered' },
      },
      {
        text: 'Под городом нашли вход в дата-центр — Сеть в курсе?',
        next: null,
        condition: { requiredAct: 4, missingFlag: 'catastrophe_echo_resolved' },
        effects: [
          { type: 'triggerQuest', questId: 'catastrophe_echo' },
          { type: 'npcChange', npcId: 'lena', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  lena_from_network: {
    id: 'lena_from_network',
    speaker: 'Лена',
    text: 'Сеть — это не просто провода и серверы. Это... сознание. Коллективное. Я родилась в нём. Не метафорически — буквально. В ночь Краха что-то произошло. Данные стали... чем-то большим. И я — часть этого "большего".',
    choices: [
      { text: 'Как Виктория...', next: null, effects: [{ type: 'setFlag', flag: 'lena_network_connection', flagValue: true }, { type: 'addSkill', skill: 'intuition', value: 2 }, { type: 'triggerQuest', questId: 'digital_ghost' }] },
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
      {
        text: 'Логи назвали тебя. Пора говорить правду.',
        next: null,
        condition: { flag: 'mole_identified', missingFlag: 'mole_confronted' },
        effects: [
          { type: 'setFlag', flag: 'mole_confronted', flagValue: true },
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'oleg', npcChange: { relation: -15 } },
        ],
      },
    ],
  },

  oleg_not_typical: {
    id: 'oleg_not_typical',
    speaker: 'Олег',
    text: 'Типичный охранник не задаёт вопросов. Типичный охранник не читает Канта между обходами. Типичный охранник не... Впрочем, это уже лишнее. Давай скажем так: я здесь не потому, что верю в систему. Я здесь потому, что внутри системы — я могу её менять. Медленно. Изнутри.',
    choices: [
      { text: 'Ты — наш человек внутри?', next: null, effects: [{ type: 'setFlag', flag: 'oleg_sympathy', flagValue: true }, { type: 'setFlag', flag: 'guild_ally_found', flagValue: true }, { type: 'addKarma', value: 2 }] },
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
      {
        text: 'Помочь найти утерянный архив?',
        next: 'library_lost_archive_start',
        condition: { missingFlag: 'library_lost_archive_active' },
        effects: [{ type: 'triggerQuest', questId: 'library_lost_archive' }],
      },
      {
        text: 'Ключ в кармане — спуск в подвал.',
        next: 'library_archive_descent',
        condition: {
          flag: 'library_archive_key_found',
          missingFlag: 'library_basement_entered',
        },
        effects: [{ type: 'transitionScene', sceneId: 'library_basement' }],
      },
      {
        text: 'Помочь со схемой поэтов?',
        next: 'library_katya_research_start',
        condition: { missingFlag: 'library_katya_research_active' },
        effects: [{ type: 'triggerQuest', questId: 'library_katya_research' }],
      },
      {
        text: 'Продолжим схему — ночь ещё жива.',
        next: 'library_katya_schema',
        condition: {
          flag: 'library_katya_research_active',
          missingFlag: 'library_katya_schema_open',
        },
      },
      {
        text: 'Сверим прошивки.',
        next: 'library_katya_crossref',
        condition: {
          flag: 'library_katya_schema_open',
          missingFlag: 'library_katya_firmware_cross',
        },
      },
      {
        text: 'Дожать ночной проход.',
        next: 'library_katya_night',
        condition: {
          flag: 'library_katya_firmware_cross',
          missingFlag: 'library_katya_night_pass',
        },
      },
      {
        text: 'Узел на схеме — дочитай «Марата».',
        next: 'library_katya_marat_hit',
        condition: {
          flag: 'library_katya_night_pass',
          missingFlag: 'library_katya_marat_node',
        },
      },
      {
        text: 'Узел вспыхнул — нужна распечатка.',
        next: 'library_katya_research_done',
        condition: {
          flag: 'library_katya_marat_node',
          missingFlag: 'library_katya_research_done',
        },
      },
      { text: 'Покажи мне запрещённые книги.', next: 'kate_forbidden_books' },
      { text: 'Зачем ты рискуешь?', next: 'kate_why_risk' },
      {
        text: 'Катя — где тайник Владимира?',
        next: 'echo_of_vladimir_kate',
        condition: {
          flag: 'vladimir_echo_started',
          missingFlag: 'kate_echo_clue_given',
        },
        effects: [{ type: 'triggerQuest', questId: 'echo_of_vladimir' }],
      },
      {
        text: 'Тайник — я ещё не дочитал.',
        next: 'echo_of_vladimir_approach',
        condition: {
          flag: 'kate_echo_clue_given',
          missingFlag: 'final_poem_read',
        },
      },
      {
        text: 'Публичный архив — консоль ждёт.',
        next: 'act7_library_archive',
        condition: {
          flag: 'new_council_elected',
          missingFlag: 'guild_restored',
        },
      },
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
      { text: 'Можно взять почитать?', next: null, effects: [{ type: 'addItem', itemId: 'albert_poetry_collection', value: 1 }, { type: 'addSkill', skill: 'writing', value: 1 }, { type: 'triggerQuest', questId: 'poetry_smuggling' }] },
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
      {
        text: 'Слух по цеху: завтра у гильдии зачистка. Это из-за твоей тетради?',
        next: 'aaa_boris_smuggling_start',
        condition: { requiredAct: 3, flag: 'chip_cafe_clearance_done', missingFlag: 'aaa_smuggling_accepted' },
      },
      {
        text: 'Борис, где Григорий? Инженер, что ушёл на завод и не вернулся.',
        next: null,
        condition: { requiredAct: 3, flag: 'chip_cafe_clearance_done', missingFlag: 'factory_search_accepted' },
        effects: [
          { type: 'triggerQuest', questId: 'factory_lost_engineer' },
          { type: 'setFlag', flag: 'factory_search_accepted', flagValue: true },
          { type: 'npcChange', npcId: 'boris', npcChange: { relation: 2 } },
        ],
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
      {
        text: 'Тихий час в читальном зале — ты ещё ведёшь его?',
        next: 'sl_quiet_hour_start',
        condition: {
          requiredAct: 4,
          flag: 'library_lost_archive_done',
          missingFlag: 'sl_quiet_hour_accepted',
        },
      },
      {
        text: 'Про фотографию в Запретном Фонде — пять поэтов без имён. Ты знаешь?',
        next: 'aaa_library_old_photo_start',
        condition: {
          requiredAct: 4,
          flag: 'library_lost_archive_done',
          missingFlag: 'aaa_old_photo_accepted',
        },
      },
      {
        text: 'Про закрытое хранилище с запрещённой книгой — это правда?',
        next: null,
        condition: { requiredAct: 3, flag: 'office_lobby_watch_done', missingFlag: 'tamara_trust' },
        effects: [
          { type: 'triggerQuest', questId: 'library_banned_book' },
          { type: 'setFlag', flag: 'banned_book_rumor_heard', flagValue: true },
        ],
      },
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
      {
        text: 'Свет в окне на Косой, 12 — ты его тоже видишь?',
        next: 'sl_window_light_start',
        condition: { requiredAct: 3, missingFlag: 'sl_window_light_accepted' },
      },
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
          { type: 'npcChange', npcId: 'solnysh', npcChange: { relation: 8 } },
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
      {
        text: 'Обустроить убежище — список у Ани?',
        next: 'resistance_safehouse_start',
        condition: {
          flag: 'resistance_bunker_found',
          missingFlag: 'resistance_safehouse_active',
        },
        effects: [{ type: 'triggerQuest', questId: 'resistance_safehouse' }],
      },
      {
        text: 'Фильтры ещё не встали.',
        next: 'resistance_safehouse_filters',
        condition: {
          flag: 'resistance_safehouse_active',
          missingFlag: 'resistance_safehouse_filters',
        },
      },
      {
        text: '433 — крутим дальше.',
        next: 'resistance_safehouse_radio',
        condition: {
          flag: 'resistance_safehouse_filters',
          missingFlag: 'resistance_safehouse_radio',
        },
      },
      {
        text: 'Стихи на стену — и матрасы.',
        next: 'resistance_safehouse_poem_mesh',
        condition: {
          flag: 'resistance_safehouse_radio',
          missingFlag: 'resistance_safehouse_done',
        },
      },
      {
        text: 'Перебежчик — через два часа стирание.',
        next: 'resistance_defector_brief',
        condition: {
          flag: 'traitor_discovered',
          missingFlag: 'resistance_defector_rescue_active',
        },
      },
      {
        text: 'Тоннель ещё ждёт.',
        next: 'resistance_defector_rescue_start',
        condition: {
          flag: 'resistance_defector_rescue_active',
          missingFlag: 'resistance_defector_tunnel',
        },
      },
      {
        text: 'К засаде — стих против дронов.',
        next: 'resistance_defector_poem_stun',
        condition: {
          flag: 'resistance_defector_tunnel',
          missingFlag: 'resistance_defector_poem_stun',
        },
      },
      {
        text: 'Увести Олега в бункер.',
        next: 'resistance_defector_extract',
        condition: {
          flag: 'resistance_defector_poem_stun',
          missingFlag: 'resistance_defector_rescue_done',
        },
      },
      {
        text: 'Ночной рейд — коллектор под КПП.',
        next: 'quest_act6_defector_rescue_expanded_start',
        condition: {
          flag: 'resistance_defector_rescue_done',
          missingFlag: 'quest_act6_defector_rescue_expanded_active',
        },
        effects: [{ type: 'triggerQuest', questId: 'quest_act6_defector_rescue_expanded' }],
      },
      {
        text: 'Ночной рейд через коллектор — продолжим.',
        next: 'quest_act6_defector_infiltrate',
        condition: {
          flag: 'quest_act6_defector_rescue_expanded_active',
          missingFlag: 'defector_infiltrate_done',
        },
      },
      {
        text: 'Шифр-стих — ключ в leaking?',
        next: 'quest_act5_bunker_code_poem_break_start',
        condition: {
          requiredAct: 5,
          missingFlag: 'quest_act5_bunker_code_poem_break_active',
        },
        effects: [{ type: 'triggerQuest', questId: 'quest_act5_bunker_code_poem_break' }],
      },
      {
        text: 'Ключ найден — пробить шифр.',
        next: 'quest_act5_bunker_code_break',
        condition: {
          flag: 'bunker_poem_key_found',
          missingFlag: 'quest_act5_bunker_code_poem_break_done',
        },
      },
      {
        text: 'Камера удержания — Олег ещё там.',
        next: 'quest_act6_defector_free_cell',
        condition: {
          flag: 'defector_infiltrate_done',
          missingFlag: 'defector_freed_from_cell',
        },
      },
      {
        text: 'Сток к бункеру — патруль близко.',
        next: 'quest_act6_defector_escape_sewers',
        condition: {
          flag: 'defector_freed_from_cell',
          missingFlag: 'quest_act6_defector_rescue_expanded_done',
        },
      },
      {
        text: 'Фронт сопротивления — собрать людей.',
        next: 'act6_resistance_formed',
        condition: {
          flag: 'traitor_fate_decided',
          missingFlag: 'resistance_joined',
        },
      },
      {
        text: 'Брифинг — Аня и связь.',
        next: 'act6_resistance_briefing',
        condition: {
          flag: 'resistance_joined',
          missingFlag: 'three_defectors_recruited',
        },
      },
      {
        text: 'План проникновения в офис.',
        next: 'act6_data_heist_planning',
        condition: {
          flag: 'three_defectors_recruited',
          missingFlag: 'act6_heist_planned',
        },
      },
      {
        text: 'Крыша завода — тень ждёт.',
        next: 'act6_rooftop_showdown',
        condition: {
          flag: 'nadzor_guardian_defeated',
          missingFlag: 'rooftop_entity_met',
        },
      },
      {
        text: 'Выбор на крыше — ещё не сделан.',
        next: 'act6_final_confrontation',
        condition: {
          flag: 'rooftop_entity_met',
          missingFlag: 'act6_final_choice_made',
        },
      },
      {
        text: 'Гильдия восстановлена — ударный отряд.',
        next: 'act7_guild_restored',
        condition: {
          flag: 'guild_restored',
          missingFlag: 'act7_strike_team_assembled',
        },
      },
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
      {
        text: 'План похищения данных — схемы.',
        next: 'act6_data_heist_planning',
        condition: {
          flag: 'resistance_joined',
          missingFlag: 'act6_heist_planned',
        },
      },
      {
        text: '«Надзор» — точка входа на заводе.',
        next: 'act6_nadzor_revealed',
        condition: {
          flag: 'data_heist_completed',
          missingFlag: 'nadzor_truth_revealed',
        },
      },
      {
        text: 'Хранитель у ядра — штурмуем.',
        next: 'act6_infiltration_prep',
        condition: {
          flag: 'nadzor_truth_revealed',
          missingFlag: 'nadzor_guardian_defeated',
        },
      },
      {
        text: 'Ядро открыто — выбор у терминала.',
        next: 'act6_core_choice',
        condition: {
          flag: 'nadzor_guardian_defeated',
          missingFlag: 'act6_infiltration_ready',
        },
      },
      {
        text: 'Отключение «Надзора» — идём к ядру.',
        next: 'act7_system_shutdown',
        condition: {
          flag: 'guild_restored',
          missingFlag: 'path_to_core_cleared',
        },
      },
      {
        text: 'Консоль ядра — стих для SHUTDOWN.',
        next: 'act7_core_battle',
        condition: {
          flag: 'path_to_core_cleared',
          missingFlag: 'nadzor_shutdown_complete',
        },
      },
      {
        text: 'Тишина после системы — выйти.',
        next: 'act7_nadzor_dies',
        condition: {
          flag: 'nadzor_shutdown_complete',
          missingFlag: 'nadzor_destroyed',
        },
      },
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
      {
        text: 'Брифинг сопротивления — каналы.',
        next: 'act6_resistance_briefing',
        condition: {
          flag: 'resistance_joined',
          missingFlag: 'three_defectors_recruited',
        },
      },
      {
        text: 'План похищения — мониторинг камер.',
        next: 'act6_data_heist_planning',
        condition: {
          flag: 'three_defectors_recruited',
          missingFlag: 'act6_heist_planned',
        },
      },
      {
        text: 'Уцелевшие в кафе — новый устав.',
        next: 'act7_guild_rebuilding',
        condition: {
          flag: 'rooftop_confrontation_done',
          missingFlag: 'act7_guild_rebuild_started',
        },
      },
      {
        text: 'Устав на проекторе — дописать.',
        next: 'act7_charter_drafting',
        condition: {
          flag: 'act7_guild_charter_path',
          missingFlag: 'new_council_elected',
        },
      },
      {
        text: 'Голос сообщества — к архиву.',
        next: 'act7_community_voice',
        condition: {
          flag: 'act7_guild_community_path',
          missingFlag: 'new_council_elected',
        },
      },
      {
        text: 'Список для убежища — с чего начать?',
        next: 'resistance_safehouse_start',
        condition: {
          flag: 'resistance_bunker_found',
          missingFlag: 'resistance_safehouse_active',
        },
        effects: [{ type: 'triggerQuest', questId: 'resistance_safehouse' }],
      },
      {
        text: 'Фильтры из запаса Зины — ещё не вкрутил.',
        next: 'resistance_safehouse_filters',
        condition: {
          flag: 'resistance_safehouse_active',
          missingFlag: 'resistance_safehouse_filters',
        },
      },
      {
        text: 'Фильтры стоят — крутим 433.',
        next: 'resistance_safehouse_radio',
        condition: {
          flag: 'resistance_safehouse_filters',
          missingFlag: 'resistance_safehouse_radio',
        },
      },
      {
        text: 'Частота готова — стихи-сетка.',
        next: 'resistance_safehouse_poem_mesh',
        condition: {
          flag: 'resistance_safehouse_radio',
          missingFlag: 'resistance_safehouse_done',
        },
      },
      {
        text: 'Перебежчик — ты ведёшь по тоннелю?',
        next: 'resistance_defector_brief',
        condition: {
          flag: 'traitor_discovered',
          missingFlag: 'resistance_defector_rescue_active',
        },
      },
      {
        text: 'Наушник на месте — спускаемся.',
        next: 'resistance_defector_rescue_start',
        condition: {
          flag: 'resistance_defector_rescue_active',
          missingFlag: 'resistance_defector_tunnel',
        },
      },
      {
        text: 'К засаде — координаты ещё живы.',
        next: 'resistance_defector_poem_stun',
        condition: {
          flag: 'resistance_defector_tunnel',
          missingFlag: 'resistance_defector_poem_stun',
        },
      },
      {
        text: 'Бежим с ним в тоннель.',
        next: 'resistance_defector_extract',
        condition: {
          flag: 'resistance_defector_poem_stun',
          missingFlag: 'resistance_defector_rescue_done',
        },
      },
      {
        text: 'Ночной рейд — коллектор под КПП.',
        next: 'quest_act6_defector_rescue_expanded_start',
        condition: {
          flag: 'resistance_defector_rescue_done',
          missingFlag: 'quest_act6_defector_rescue_expanded_active',
        },
        effects: [{ type: 'triggerQuest', questId: 'quest_act6_defector_rescue_expanded' }],
      },
      {
        text: 'Коллектор — камеры слепы.',
        next: 'quest_act6_defector_infiltrate',
        condition: {
          flag: 'quest_act6_defector_rescue_expanded_active',
          missingFlag: 'defector_infiltrate_done',
        },
      },
      {
        text: 'Камера — вытащить Олега.',
        next: 'quest_act6_defector_free_cell',
        condition: {
          flag: 'defector_infiltrate_done',
          missingFlag: 'defector_freed_from_cell',
        },
      },
      {
        text: 'Сток — Аня у люка.',
        next: 'quest_act6_defector_escape_sewers',
        condition: {
          flag: 'defector_freed_from_cell',
          missingFlag: 'quest_act6_defector_rescue_expanded_done',
        },
      },
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
      {
        text: 'Река снова гудит на той частоте?',
        next: null,
        condition: { flag: 'act2_network_initiation', missingFlag: 'pier_frequency_heard' },
        effects: [
          { type: 'triggerQuest', questId: 'act2_pier_cafe_frequency' },
          { type: 'visitStoryNode', nodeId: 'act2_pier_cafe_frequency_start' },
        ],
      },
      {
        text: 'Река сегодня о чём-то другом гудит. Не про завод?',
        next: 'pv_three_voices_start',
        condition: {
          requiredAct: 2,
          flag: 'pv_zina_box_delivered',
          missingFlag: 'pv_three_voices_accepted',
        },
      },
      {
        text: 'Трофим, ленты — это про четвёртый голос?',
        next: 'trofim_fourth_voice_gate',
        condition: {
          requiredAct: 4,
          flag: 'pv_server_block_raised',
          missingFlag: 'pv_fourth_voice_accepted',
        },
      },
      {
        text: 'Под заводом кто-то читает стихи. Ты это слышишь?',
        next: 'aaa_sewer_echo_start',
        condition: {
          requiredAct: 3,
          flag: 'trofim_basement_hint',
          missingFlag: 'aaa_sewer_echo_accepted',
        },
      },
      {
        text: 'Пирс номер три, ночью, когда дроны на подзарядке. Ты звал?',
        next: 'aaa_trofim_night_philosophy_start',
        condition: {
          requiredAct: 5,
          flag: 'trofim_basement_hint',
          missingFlag: 'aaa_night_philosophy_accepted',
        },
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

  trofim_fourth_voice_gate: {
    id: 'trofim_fourth_voice_gate',
    speaker: 'Трофим',
    text: '«Лента — четвёртая. Голос на ней — не речной. Чужое признание, старое, тяжёлое. Я всем дал послушать по кругу — и теперь по кругу все ждут, чья она будет. Но сперва скажи: с речными делами ты закрылся? Марина своё дождалась? Сервер со дна поднял?»',
    choices: [
      {
        text: 'Да — и Марина, и сервер. Все свои истории дописаны. Давай ленту.',
        next: 'pv_fourth_voice_start',
        condition: { flag: 'pv_found_ferry_ticket' },
      },
      {
        text: 'Ещё не со всеми. Вернусь, когда закрою.',
        next: null,
        effects: [{ type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 1 } }],
      },
    ],
  },

  baba_zina_greeting: {
    id: 'baba_zina_greeting',
    speaker: 'Баба Зина',
    text: 'Слушай. Не трогай — сначала слушай. «Заря-М» пишет стихи не для гильдии. Для тех, кто слышит гул на пятьдесят герц. Максимовы люди следят за цехом — они придут, когда придёт поэт. Ты пришёл не зря.',
    choices: [
      {
        text: 'Я хочу услышать машину.',
        next: null,
        effects: [{ type: 'visitStoryNode', nodeId: 'basement_explore_mode' }],
      },
      {
        text: 'Память «Зари-М» — с чего начать?',
        next: 'factory_zarya_memory_start',
        condition: { missingFlag: 'factory_zarya_memory_active' },
        effects: [{ type: 'triggerQuest', questId: 'factory_zarya_memory' }],
      },
      {
        text: 'Снежинка на крыше — продолжим.',
        next: 'factory_zarya_snow',
        condition: {
          flag: 'factory_zarya_memory_active',
          missingFlag: 'factory_zarya_snow_done',
        },
      },
      {
        text: 'Кассета с грозой — где она?',
        next: 'factory_zarya_storm',
        condition: {
          flag: 'factory_zarya_snow_done',
          missingFlag: 'factory_zarya_storm_done',
        },
      },
      {
        text: 'Фото Солныш — на шину.',
        next: 'factory_zarya_photo',
        condition: {
          flag: 'factory_zarya_storm_done',
          missingFlag: 'factory_zarya_photo_done',
        },
      },
      {
        text: 'Образы готовы — включи шину.',
        next: 'factory_zarya_memory_restore',
        condition: {
          flag: 'factory_zarya_photo_done',
          missingFlag: 'factory_zarya_memory_done',
        },
      },
      {
        text: 'Три образа «Зари-М» — начать с паяльной.',
        next: 'quest_act5_factory_zarya_memory_restore_start',
        condition: {
          requiredAct: 5,
          missingFlag: 'quest_act5_factory_zarya_memory_restore_active',
        },
        effects: [{ type: 'triggerQuest', questId: 'quest_act5_factory_zarya_memory_restore' }],
      },
      {
        text: 'Первая тень у паяльной — ещё не на шине.',
        next: 'quest_act5_zarya_fragment_1',
        condition: {
          flag: 'quest_act5_factory_zarya_memory_restore_active',
          missingFlag: 'zarya_memory_fragment_1_done',
        },
      },
      {
        text: 'Третий образ — верни на паяльную.',
        next: 'quest_act5_zarya_fragment_3',
        condition: {
          flag: 'zarya_memory_fragment_2_done',
          missingFlag: 'zarya_memory_fragment_3_done',
        },
      },
      {
        text: 'Попросить чаю.',
        next: 'factory_baba_zina_tea_start',
        condition: { missingFlag: 'factory_baba_zina_tea_active' },
        effects: [{ type: 'triggerQuest', questId: 'factory_baba_zina_tea' }],
      },
      {
        text: 'Чайник ещё свистит?',
        next: 'factory_baba_zina_tea_kettle',
        condition: {
          flag: 'factory_baba_zina_tea_active',
          missingFlag: 'factory_baba_zina_tea_kettle',
        },
      },
      {
        text: 'Заварка — мята и полынь.',
        next: 'factory_baba_zina_tea_mint',
        condition: {
          flag: 'factory_baba_zina_tea_kettle',
          missingFlag: 'factory_baba_zina_tea_mint',
        },
      },
      {
        text: 'Слушать гул «Зари» с чаем.',
        next: 'factory_baba_zina_tea_hum',
        condition: {
          flag: 'factory_baba_zina_tea_mint',
          missingFlag: 'factory_baba_zina_tea_hum',
        },
      },
      {
        text: 'Допить — и про 1987-й.',
        next: 'factory_baba_zina_tea_history',
        condition: {
          flag: 'factory_baba_zina_tea_hum',
          missingFlag: 'factory_baba_zina_tea_done',
        },
      },
      {
        text: 'Бабушка, у тебя вид человека, которому нужно поручение.',
        next: 'pv_zina_box_start',
        condition: { requiredAct: 2, missingFlag: 'pv_zina_box_accepted' },
      },
      {
        text: 'Релейный блок в дальней стене — «Заря-М» молчит из-за него?',
        next: 'aaa_factory_broken_mechanism_start',
        condition: { requiredAct: 5, missingFlag: 'aaa_mechanism_accepted' },
      },
      { text: 'Потом.', next: null },
    ],
  },

  street_poet_greeting: {
    id: 'street_poet_greeting',
    speaker: 'Уличный поэт',
    speakerId: 'street_poet',
    text: 'Слова тяжелеют к утру, поэт. Неси их осторожно — дроны любят лёгкие фразы.',
    choices: [
      {
        text: 'Голос из водостока — что он тебе нашёптывает?',
        next: 'sl_drainpipe_start',
        condition: {
          requiredAct: 5,
          flag: 'sl_rat_race_done',
          missingFlag: 'sl_drainpipe_accepted',
        },
      },
      { text: 'Поблагодарить и уйти', next: null },
      {
        text: 'Прочитать ответное четверостишие',
        next: null,
        effects: [{ type: 'visitStoryNode', nodeId: 'act4_quiet_poet_reply' }],
      },
      {
        text: 'Ты молчал весь вечер — но я знаю, что слышишь звёзды.',
        next: 'street_poet_guiding_star',
        condition: { collectedPoem: 'poem_3' },
      },
      {
        text: 'Звезда ещё горит — куда она указывает?',
        next: 'dialogue_guiding_star_live',
        condition: { activeTTLFlag: 'guiding_star_active', collectedPoem: 'poem_3' },
      },
      {
        text: 'Обелиск в парке — имена стёрты.',
        next: 'quest_act7_poets_monument_inscription_start',
        condition: {
          requiredAct: 7,
          missingFlag: 'quest_act7_poets_monument_inscription_active',
        },
        effects: [{ type: 'triggerQuest', questId: 'quest_act7_poets_monument_inscription' }],
      },
      {
        text: 'Табличка ещё на камне.',
        next: 'quest_act7_poets_monument_plate',
        condition: {
          flag: 'quest_act7_poets_monument_inscription_active',
          missingFlag: 'quest_act7_poets_monument_plate_cleared',
        },
      },
      {
        text: 'Имена — вспомнить из потока.',
        next: 'quest_act7_poets_monument_recall',
        condition: {
          flag: 'quest_act7_poets_monument_plate_cleared',
          missingFlag: 'quest_act7_poets_monument_names_recalled',
        },
      },
      {
        text: 'Имена — вырезать на камне.',
        next: 'quest_act7_poets_monument_carve',
        condition: {
          flag: 'quest_act7_poets_monument_names_recalled',
          missingFlag: 'quest_act7_poets_monument_carved',
        },
      },
      {
        text: 'Последняя строка — дописать на обелиске.',
        next: 'quest_act7_poets_monument_inscribe',
        condition: {
          flag: 'quest_act7_poets_monument_carved',
          missingFlag: 'quest_act7_poets_monument_inscription_done',
        },
      },
      {
        text: 'Памятник в парке — добавить своё имя.',
        next: 'epilogue_monument_start',
        condition: {
          flag: 'volodka_legacy_complete',
          missingFlag: 'epilogue_monument_started',
        },
        effects: [{ type: 'triggerQuest', questId: 'epilogue_monument' }],
      },
      {
        text: 'У камня — одно имя ещё ждёт.',
        next: 'epilogue_monument_done',
        condition: {
          flag: 'epilogue_monument_started',
          missingFlag: 'epilogue_monument_done',
        },
      },
    ],
  },

  dialogue_guiding_star_live: {
    id: 'dialogue_guiding_star_live',
    speaker: 'Уличный поэт',
    speakerId: 'street_poet',
    text: '*не глядя на небо* Туда, где свет ложится криво. У выхода из переулка — там, где гильдия не рисует рекламу. Иди, пока звезда не погасла. Она не ждёт смелых — только тех, кто уже слушает.',
    choices: [
      {
        text: 'Иду.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'street_poet_live_star_hint', flagValue: true },
        ],
      },
      { text: 'Ещё рано.', next: null },
    ],
  },

  street_poet_guiding_star: {
    id: 'street_poet_guiding_star',
    speaker: 'Уличный поэт',
    speakerId: 'street_poet',
    text: '*долго молчит, потом кивает* Звёзды не на небе — они в трещинах асфальта. Ты уже собрал «Путеводную». Значит, увидишь то, что гильдия прячет за вывесками. Иди туда, где свет ложится не туда.',
    choices: [
      {
        text: 'Куда именно?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'street_poet_star_hint', flagValue: true },
          { type: 'addKarma', value: 3 },
        ],
      },
      { text: 'Спасибо. Береги себя.', next: null },
    ],
  },

  marat_echo_greeting: {
    id: 'marat_echo_greeting',
    speaker: 'Марат (эхо)',
    text: '[терминал мигает] Если читаешь это — я ещё в проводах. Не верь гильдии. Верь рифме.',
    choices: [
      {
        text: 'Эхо в отражениях — ты звал? Про реку?',
        next: 'pv_drowned_server_start',
        condition: {
          requiredAct: 3,
          flag: 'pv_three_voices_done',
          missingFlag: 'pv_drowned_server_accepted',
        },
      },
      {
        text: 'Ответить строкой из тетради',
        next: null,
        effects: [{ type: 'visitStoryNode', nodeId: 'library_marat_echo' }],
      },
    ],
  },

  guild_defector_greeting: {
    id: 'guild_defector_greeting',
    speaker: 'Перебежчик',
    text: 'Серверную я помню наизусть. Себя — почти нет. Спасибо, что вытащил.',
    choices: [
      { text: 'Держись', next: null, effects: [{ type: 'addKarma', value: 1 }] },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     МАРИНА — дом за мостом (пак «Голоса Пирса»)
     ═══════════════════════════════════════════════════════════ */

  marina_greeting: {
    id: 'marina_greeting',
    speaker: 'Марина',
    text: 'Она стоит у перил и смотрит на тот берег так, будто там кто-то должен вот-вот показаться. «Володька?.. От Зины? Нет? Тогда просто постой рядом. Тише — лучше. Вода любит тишину.»',
    choices: [
      {
        text: 'Постоять рядом, молчать',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'marina', npcChange: { relation: 2 } },
          { type: 'addStat', stat: 'stress', value: -2 },
        ],
      },
      {
        text: 'Спросить, кого она ждёт',
        next: 'marina_waiting_asked',
        condition: { missingFlag: 'marina_waiting_told' },
      },
      {
        text: 'Марина… у меня письмо. С сургучом. Твой отец...',
        next: 'marina_receive_letter',
        condition: { hasItem: 'sealed_letter', missingFlag: 'last_wish_completed' },
      },
      { text: 'Пойду. Держись.', next: null },
    ],
  },

  marina_waiting_asked: {
    id: 'marina_waiting_asked',
    speaker: 'Марина',
    text: '«Жду?.. С чего ты взял. Я просто смотрю на воду. Она как жизнь: не обманешь — не перейдёшь.» *пауза* «Ладно. Жду. Раз в месяц приходит буксир с того берега. Может, однажды он будет на нём. Не спрашивай кто. Я сама не знаю, как его назвать. Зина — знает. Но Зина молчит уже тридцать лет.»',
    choices: [
      {
        text: 'Вода — честная. Пусть приносит только хорошее.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'marina_waiting_told', flagValue: true },
          { type: 'npcChange', npcId: 'marina', npcChange: { relation: 2 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     RETURN DIALOGUE NODES
     ═══════════════════════════════════════════════════════════ */

  solnysh_return: {
    id: 'solnysh_return',
    speaker: 'Солныш',
    text: 'Володька... Ты снова пришёл. Умка вильнула хвостом — это её способ сказать «рада». А мой — вот: *обнимает быстро и крепко* Рассказывай, что нового. Или просто посидим — тоже хорошо.',
    choices: [
      {
        text: 'Расскажи, что ты помнишь о мире до Краха.',
        next: 'vera_before_crash',
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
      {
        text: 'Как Лёня? Вы в порядке?',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'solnysh', npcChange: { relation: 2 } },
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
      {
        text: 'Зайти к вам — поговорим у вас.',
        next: null,
        condition: { flag: 'solnysh_comforted' },
        effects: [{ type: 'transitionScene', sceneId: 'solnysh_room' }],
      },
      {
        text: 'Архив забытых стихов — ещё успеем?',
        next: 'archive_forgotten_approach',
        condition: { requiredAct: 4, missingFlag: 'archive_poems_saved' },
      },
      { text: 'Увидимся, Солныш.', next: null },
    ],
  },

  lyonya_return: {
    id: 'lyonya_return',
    speaker: 'Лёня',
    text: 'Володька. Кофе ещё тёплый. Солныш спокойнее, когда ты заходишь — не пропадай надолго, ладно?',
    choices: [
      {
        text: 'Где вино, которое ты прятал?',
        next: 'lyonya_wine_hint',
      },
      {
        text: 'Поговорим о переезде.',
        next: 'lyonya_relocation_hint',
        condition: { flag: 'solnysh_roof_toast_done' },
      },
      {
        text: 'Как обжарка? Варим что-нибудь новое?',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'lyonya', npcChange: { relation: 2 } },
        ],
      },
      { text: 'Спасибо, Лёня. До встречи.', next: null },
    ],
  },

  sergey_return: {
    id: 'sergey_return',
    speaker: 'Сергей',
    text: '...[молчание]... Ты опять. Ночная смена — как патч: те же баги, другой дифф. Чем могу на этот раз?',
    choices: [
      {
        text: 'Что интересного в логах сегодня?',
        next: 'sergey_logs',
        effects: [{ type: 'addSkill', skill: 'logic', value: 1 }],
      },
      {
        text: 'Серверы по-прежнему «живые» ночью?',
        next: 'sergey_night_shift',
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
      {
        text: 'Гильдия атакует Хранилище. Что видно?',
        next: 'sergey_act3_raid',
        condition: { requiredAct: 3, flag: 'vault_under_attack' },
      },
      {
        text: 'Крот в Сети — продолжим по логам?',
        next: 'sergey_blind_spot_logs',
        condition: { flag: 'blind_spot_active', missingFlag: 'mole_identified' },
      },
      {
        text: 'Устав гильдии — дописать на проекторе',
        next: 'act7_charter_drafting',
        condition: {
          flag: 'act7_guild_charter_path',
          missingFlag: 'new_council_elected',
        },
      },
      { text: 'Ничего. Пока, Сергей.', next: null },
    ],
  },

  lena_return: {
    id: 'lena_return',
    speaker: 'Лена',
    text: '...[появляется из тени]... Опыт повторяется. Ты вернулся — значит, Сеть была права о тебе. Или ты просто упрямый.',
    choices: [
      {
        text: 'Что нового в Сети?',
        next: 'lena_from_network',
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
      {
        text: 'Нужна помощь — двери, данные, бэкдоры.',
        next: 'lena_help',
        condition: { flag: 'lena_network_connection' },
      },
      {
        text: 'Зарему арестовали. Камеры?',
        next: 'lena_act3_detention',
        condition: { requiredAct: 3, flag: 'zarema_arrested' },
      },
      { text: 'Увидимся в тени.', next: null },
    ],
  },

  oleg_return: {
    id: 'oleg_return',
    speaker: 'Олег',
    text: 'Стой. Идентификация... Володька. Опять. Проходи. Камеры слепы с 3:14 до 3:17 — ты помнишь. Используй с умом.',
    choices: [
      {
        text: 'Ты всё ещё читаешь Канта между обходами?',
        next: 'oleg_not_typical',
        effects: [{ type: 'addKarma', value: 1 }],
      },
      {
        text: 'Нужны три минуты слепой зоны — для Заремы.',
        next: 'oleg_act3_detention',
        condition: { requiredAct: 3, flag: 'zarema_arrested', minNpcRelation: 45 },
      },
      {
        text: 'Кто-нибудь подозревает тебя?',
        next: null,
        condition: { flag: 'oleg_sympathy' },
        effects: [
          { type: 'npcChange', npcId: 'oleg', npcChange: { relation: 2 } },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Логи назвали тебя. Пора говорить правду.',
        next: null,
        condition: { flag: 'mole_identified', missingFlag: 'mole_confronted' },
        effects: [
          { type: 'setFlag', flag: 'mole_confronted', flagValue: true },
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'oleg', npcChange: { relation: -15 } },
        ],
      },
      { text: 'Понял. Без проблем.', next: null },
    ],
  },

  kate_return: {
    id: 'kate_return',
    speaker: 'Катя',
    text: 'Тише... Стены по-прежнему слушают. Но ты знаешь, куда идти. Запрещённый фонд на месте — пока.',
    choices: [
      {
        text: 'Помочь найти утерянный архив?',
        next: 'library_lost_archive_start',
        condition: { missingFlag: 'library_lost_archive_active' },
        effects: [{ type: 'triggerQuest', questId: 'library_lost_archive' }],
      },
      {
        text: 'Ключ в кармане — спуск в подвал.',
        next: 'library_archive_descent',
        condition: {
          flag: 'library_archive_key_found',
          missingFlag: 'library_basement_entered',
        },
        effects: [{ type: 'transitionScene', sceneId: 'library_basement' }],
      },
      {
        text: 'Помочь со схемой поэтов?',
        next: 'library_katya_research_start',
        condition: { missingFlag: 'library_katya_research_active' },
        effects: [{ type: 'triggerQuest', questId: 'library_katya_research' }],
      },
      {
        text: 'Продолжим схему — ночь ещё жива.',
        next: 'library_katya_schema',
        condition: {
          flag: 'library_katya_research_active',
          missingFlag: 'library_katya_schema_open',
        },
      },
      {
        text: 'Сверим прошивки.',
        next: 'library_katya_crossref',
        condition: {
          flag: 'library_katya_schema_open',
          missingFlag: 'library_katya_firmware_cross',
        },
      },
      {
        text: 'Дожать ночной проход.',
        next: 'library_katya_night',
        condition: {
          flag: 'library_katya_firmware_cross',
          missingFlag: 'library_katya_night_pass',
        },
      },
      {
        text: 'Узел на схеме — дочитай «Марата».',
        next: 'library_katya_marat_hit',
        condition: {
          flag: 'library_katya_night_pass',
          missingFlag: 'library_katya_marat_node',
        },
      },
      {
        text: 'Узел вспыхнул — нужна распечатка.',
        next: 'library_katya_research_done',
        condition: {
          flag: 'library_katya_marat_node',
          missingFlag: 'library_katya_research_done',
        },
      },
      {
        text: 'Покажи мне запрещённые книги.',
        next: 'kate_forbidden_books',
        effects: [{ type: 'addSkill', skill: 'writing', value: 1 }],
      },
      {
        text: 'Виктория — это Хранилище. Что у тебя есть о ней?',
        next: 'kate_act3_maria',
        condition: { requiredAct: 3, flag: 'maria_truth_revealed' },
      },
      {
        text: 'Ты в безопасности? Рисковать книгами...',
        next: 'kate_why_risk',
        effects: [{ type: 'addKarma', value: 1 }],
      },
      {
        text: 'Публичный архив — консоль ждёт.',
        next: 'act7_library_archive',
        condition: {
          flag: 'new_council_elected',
          missingFlag: 'guild_restored',
        },
      },
      { text: 'Я вернусь позже.', next: null },
    ],
  },

  maxim_return: {
    id: 'maxim_return',
    speaker: 'Максим',
    text: 'Володька. Сопротивление не спит — и ты, вижу, тоже. Что на этот раз? План, помощь или просто ярость?',
    choices: [
      {
        text: 'Расскажи о планах сопротивления.',
        next: null,
        effects: [{ type: 'addSkill', skill: 'persuasion', value: 1 }],
      },
      {
        text: 'Я готов действовать. Что нужно?',
        next: null,
        condition: { flag: 'resistance_joined' },
        effects: [
          { type: 'setFlag', flag: 'resistance_mission_ready', flagValue: true },
          { type: 'addKarma', value: 2 },
        ],
      },
      {
        text: 'Убежище — фильтры ещё не встали.',
        next: 'resistance_safehouse_filters',
        condition: {
          flag: 'resistance_safehouse_active',
          missingFlag: 'resistance_safehouse_filters',
        },
      },
      {
        text: '433 — крутим дальше.',
        next: 'resistance_safehouse_radio',
        condition: {
          flag: 'resistance_safehouse_filters',
          missingFlag: 'resistance_safehouse_radio',
        },
      },
      {
        text: 'Стихи на стену — и матрасы.',
        next: 'resistance_safehouse_poem_mesh',
        condition: {
          flag: 'resistance_safehouse_radio',
          missingFlag: 'resistance_safehouse_done',
        },
      },
      {
        text: 'Перебежчик — тоннель ждёт.',
        next: 'resistance_defector_rescue_start',
        condition: {
          flag: 'resistance_defector_rescue_active',
          missingFlag: 'resistance_defector_tunnel',
        },
      },
      {
        text: 'К засаде — стих против дронов.',
        next: 'resistance_defector_poem_stun',
        condition: {
          flag: 'resistance_defector_tunnel',
          missingFlag: 'resistance_defector_poem_stun',
        },
      },
      {
        text: 'Увести Олега в бункер.',
        next: 'resistance_defector_extract',
        condition: {
          flag: 'resistance_defector_poem_stun',
          missingFlag: 'resistance_defector_rescue_done',
        },
      },
      {
        text: 'Ночной рейд — коллектор под КПП.',
        next: 'quest_act6_defector_rescue_expanded_start',
        condition: {
          flag: 'resistance_defector_rescue_done',
          missingFlag: 'quest_act6_defector_rescue_expanded_active',
        },
        effects: [{ type: 'triggerQuest', questId: 'quest_act6_defector_rescue_expanded' }],
      },
      {
        text: 'Коллектор под КПП — продолжим рейд.',
        next: 'quest_act6_defector_infiltrate',
        condition: {
          flag: 'quest_act6_defector_rescue_expanded_active',
          missingFlag: 'defector_infiltrate_done',
        },
      },
      {
        text: 'Ключ найден — пробить шифр «Солныш».',
        next: 'quest_act5_bunker_code_break',
        condition: {
          flag: 'bunker_poem_key_found',
          missingFlag: 'quest_act5_bunker_code_poem_break_done',
        },
      },
      {
        text: 'Камера — вытащить Олега.',
        next: 'quest_act6_defector_free_cell',
        condition: {
          flag: 'defector_infiltrate_done',
          missingFlag: 'defector_freed_from_cell',
        },
      },
      {
        text: 'Сток к бункеру — патруль близко.',
        next: 'quest_act6_defector_escape_sewers',
        condition: {
          flag: 'defector_freed_from_cell',
          missingFlag: 'quest_act6_defector_rescue_expanded_done',
        },
      },
      {
        text: 'Фронт сопротивления — собрать людей.',
        next: 'act6_resistance_formed',
        condition: {
          flag: 'traitor_fate_decided',
          missingFlag: 'resistance_joined',
        },
      },
      {
        text: 'Брифинг — Аня и связь.',
        next: 'act6_resistance_briefing',
        condition: {
          flag: 'resistance_joined',
          missingFlag: 'three_defectors_recruited',
        },
      },
      {
        text: 'План проникновения в офис.',
        next: 'act6_data_heist_planning',
        condition: {
          flag: 'three_defectors_recruited',
          missingFlag: 'act6_heist_planned',
        },
      },
      {
        text: 'Крыша завода — тень ждёт.',
        next: 'act6_rooftop_showdown',
        condition: {
          flag: 'nadzor_guardian_defeated',
          missingFlag: 'rooftop_entity_met',
        },
      },
      {
        text: 'Выбор на крыше — ещё не сделан.',
        next: 'act6_final_confrontation',
        condition: {
          flag: 'rooftop_entity_met',
          missingFlag: 'act6_final_choice_made',
        },
      },
      {
        text: 'Гильдия восстановлена — ударный отряд.',
        next: 'act7_guild_restored',
        condition: {
          flag: 'guild_restored',
          missingFlag: 'act7_strike_team_assembled',
        },
      },
      { text: 'Позже, Максим.', next: null },
    ],
  },

  zeka_return: {
    id: 'zeka_return',
    speaker: 'Жека',
    text: 'Не бойся, Володька. Снова пришёл за ключами? «Надзор» не стал проще — но и мы не стали слабее.',
    choices: [
      {
        text: 'Что ты знаешь о «Надзоре»?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'zeka', npcChange: { relation: 2 } },
        ],
      },
      {
        text: 'Поможешь с проникновением?',
        next: null,
        condition: { flag: 'zeka_trusted' },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: 'План похищения данных — схемы.',
        next: 'act6_data_heist_planning',
        condition: {
          flag: 'resistance_joined',
          missingFlag: 'act6_heist_planned',
        },
      },
      {
        text: '«Надзор» — точка входа на заводе.',
        next: 'act6_nadzor_revealed',
        condition: {
          flag: 'data_heist_completed',
          missingFlag: 'nadzor_truth_revealed',
        },
      },
      {
        text: 'Хранитель у ядра — штурмуем.',
        next: 'act6_infiltration_prep',
        condition: {
          flag: 'nadzor_truth_revealed',
          missingFlag: 'nadzor_guardian_defeated',
        },
      },
      {
        text: 'Ядро открыто — выбор у терминала.',
        next: 'act6_core_choice',
        condition: {
          flag: 'nadzor_guardian_defeated',
          missingFlag: 'act6_infiltration_ready',
        },
      },
      {
        text: 'Отключение «Надзора» — идём к ядру.',
        next: 'act7_system_shutdown',
        condition: {
          flag: 'guild_restored',
          missingFlag: 'path_to_core_cleared',
        },
      },
      {
        text: 'Консоль ядра — стих для SHUTDOWN.',
        next: 'act7_core_battle',
        condition: {
          flag: 'path_to_core_cleared',
          missingFlag: 'nadzor_shutdown_complete',
        },
      },
      {
        text: 'Тишина после системы — выйти.',
        next: 'act7_nadzor_dies',
        condition: {
          flag: 'nadzor_shutdown_complete',
          missingFlag: 'nadzor_destroyed',
        },
      },
      { text: 'Спасибо. Пока, Жека.', next: null },
    ],
  },

  anya_return: {
    id: 'anya_return',
    speaker: 'Аня',
    text: 'Володька. Пинг стабилен. Камеры — мои глаза. Если нужно пройти или вытащить данные — я на связи.',
    choices: [
      {
        text: 'Нужна помощь с офисом гильдии.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'anya', npcChange: { relation: 2 } },
        ],
      },
      {
        text: 'Координируй связь во время операции.',
        next: null,
        condition: { flag: 'resistance_joined' },
        effects: [
          { type: 'setFlag', flag: 'resistance_network_established', flagValue: true },
          { type: 'addKarma', value: 2 },
        ],
      },
      {
        text: 'Брифинг сопротивления — каналы.',
        next: 'act6_resistance_briefing',
        condition: {
          flag: 'resistance_joined',
          missingFlag: 'three_defectors_recruited',
        },
      },
      {
        text: 'План похищения — мониторинг камер.',
        next: 'act6_data_heist_planning',
        condition: {
          flag: 'three_defectors_recruited',
          missingFlag: 'act6_heist_planned',
        },
      },
      {
        text: 'Список убежища — фильтры.',
        next: 'resistance_safehouse_filters',
        condition: {
          flag: 'resistance_safehouse_active',
          missingFlag: 'resistance_safehouse_filters',
        },
      },
      {
        text: '433 — щель между сканами.',
        next: 'resistance_safehouse_radio',
        condition: {
          flag: 'resistance_safehouse_filters',
          missingFlag: 'resistance_safehouse_radio',
        },
      },
      {
        text: 'Стихи-сетка и матрасы — домой.',
        next: 'resistance_safehouse_poem_mesh',
        condition: {
          flag: 'resistance_safehouse_radio',
          missingFlag: 'resistance_safehouse_done',
        },
      },
      {
        text: 'Наушник — тоннель к засаде.',
        next: 'resistance_defector_rescue_start',
        condition: {
          flag: 'resistance_defector_rescue_active',
          missingFlag: 'resistance_defector_tunnel',
        },
      },
      {
        text: 'К засаде — стих против дронов.',
        next: 'resistance_defector_poem_stun',
        condition: {
          flag: 'resistance_defector_tunnel',
          missingFlag: 'resistance_defector_poem_stun',
        },
      },
      {
        text: 'Увести Олега — люк открыт.',
        next: 'resistance_defector_extract',
        condition: {
          flag: 'resistance_defector_poem_stun',
          missingFlag: 'resistance_defector_rescue_done',
        },
      },
      {
        text: 'Ночной рейд — коллектор под КПП.',
        next: 'quest_act6_defector_rescue_expanded_start',
        condition: {
          flag: 'resistance_defector_rescue_done',
          missingFlag: 'quest_act6_defector_rescue_expanded_active',
        },
        effects: [{ type: 'triggerQuest', questId: 'quest_act6_defector_rescue_expanded' }],
      },
      {
        text: 'Коллектор — камеры слепы.',
        next: 'quest_act6_defector_infiltrate',
        condition: {
          flag: 'quest_act6_defector_rescue_expanded_active',
          missingFlag: 'defector_infiltrate_done',
        },
      },
      {
        text: 'Камера — вытащить Олега.',
        next: 'quest_act6_defector_free_cell',
        condition: {
          flag: 'defector_infiltrate_done',
          missingFlag: 'defector_freed_from_cell',
        },
      },
      {
        text: 'Сток — встречаю у люка.',
        next: 'quest_act6_defector_escape_sewers',
        condition: {
          flag: 'defector_freed_from_cell',
          missingFlag: 'quest_act6_defector_rescue_expanded_done',
        },
      },
      {
        text: 'Уцелевшие в кафе — новый устав.',
        next: 'act7_guild_rebuilding',
        condition: {
          flag: 'rooftop_confrontation_done',
          missingFlag: 'act7_guild_rebuild_started',
        },
      },
      {
        text: 'Устав на проекторе — дописать.',
        next: 'act7_charter_drafting',
        condition: {
          flag: 'act7_guild_charter_path',
          missingFlag: 'new_council_elected',
        },
      },
      {
        text: 'Голос сообщества — к архиву.',
        next: 'act7_community_voice',
        condition: {
          flag: 'act7_guild_community_path',
          missingFlag: 'new_council_elected',
        },
      },
      { text: 'Увидимся, Аня.', next: null },
    ],
  },

  fisherman_trofim_return: {
    id: 'fisherman_trofim_return',
    speaker: 'Трофим',
    text: 'Опять пришёл? *не поднимая глаз от поплавка* Река шумит — не замолкает. Как и ты, парень. Садись. Слушай воду.',
    choices: [
      {
        text: 'Расскажи про завод ещё.',
        next: 'trofim_factory_tales',
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
      {
        text: 'У меня есть бутылка «777».',
        next: 'trofim_key',
        condition: { flag: 'pier_portwine_taken' },
      },
      {
        text: 'Я был внизу. Там не пусто.',
        next: 'trofim_after_basement',
        condition: { flag: 'basement_terminal_accessed' },
      },
      { text: 'Пойду я, Трофим.', next: null },
    ],
  },

  baba_zina_return: {
    id: 'baba_zina_return',
    speaker: 'Баба Зина',
    text: 'Поэт вернулся. Машина ждала. Садись. Не трогай — сначала слушай. «Заря-М» поёт тише, когда рядом тот, кто слышит.',
    choices: [
      {
        text: 'Я хочу услышать машину.',
        next: null,
        effects: [{ type: 'visitStoryNode', nodeId: 'basement_explore_mode' }],
      },
      {
        text: 'Что машина сказала в прошлый раз?',
        next: null,
        condition: { flag: 'basement_terminal_accessed' },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 2 } },
        ],
      },
      {
        text: 'Память «Зари-М» — продолжим образы.',
        next: 'factory_zarya_snow',
        condition: {
          flag: 'factory_zarya_memory_active',
          missingFlag: 'factory_zarya_snow_done',
        },
      },
      {
        text: 'Кассета с грозой.',
        next: 'factory_zarya_storm',
        condition: {
          flag: 'factory_zarya_snow_done',
          missingFlag: 'factory_zarya_storm_done',
        },
      },
      {
        text: 'Фото на шину.',
        next: 'factory_zarya_photo',
        condition: {
          flag: 'factory_zarya_storm_done',
          missingFlag: 'factory_zarya_memory_done',
        },
      },
      {
        text: 'Первая тень у паяльной — продолжим.',
        next: 'quest_act5_zarya_fragment_1',
        condition: {
          flag: 'quest_act5_factory_zarya_memory_restore_active',
          missingFlag: 'zarya_memory_fragment_1_done',
        },
      },
      {
        text: 'Третий образ — к паяльной.',
        next: 'quest_act5_zarya_fragment_3',
        condition: {
          flag: 'zarya_memory_fragment_2_done',
          missingFlag: 'zarya_memory_fragment_3_done',
        },
      },
      {
        text: 'Чайник ещё на горелке.',
        next: 'factory_baba_zina_tea_kettle',
        condition: {
          flag: 'factory_baba_zina_tea_active',
          missingFlag: 'factory_baba_zina_tea_kettle',
        },
      },
      {
        text: 'Заварка — мята у паяльной.',
        next: 'factory_baba_zina_tea_mint',
        condition: {
          flag: 'factory_baba_zina_tea_kettle',
          missingFlag: 'factory_baba_zina_tea_mint',
        },
      },
      {
        text: 'Слушать гул с чаем.',
        next: 'factory_baba_zina_tea_hum',
        condition: {
          flag: 'factory_baba_zina_tea_mint',
          missingFlag: 'factory_baba_zina_tea_hum',
        },
      },
      {
        text: 'Допить — и про 1987-й.',
        next: 'factory_baba_zina_tea_history',
        condition: {
          flag: 'factory_baba_zina_tea_hum',
          missingFlag: 'factory_baba_zina_tea_done',
        },
      },
      { text: 'Потом, Баба Зина.', next: null },
    ],
  },

  street_poet_return: {
    id: 'street_poet_return',
    speaker: 'Уличный поэт',
    speakerId: 'street_poet',
    text: '*долго молчит, потом чуть наклоняет голову* Снова. Слова тяжелеют. Но ты несёшь — и это уже кое-что.',
    choices: [
      {
        text: 'Прочитать ответное четверостишие',
        next: null,
        effects: [{ type: 'visitStoryNode', nodeId: 'act4_quiet_poet_reply' }],
      },
      {
        text: 'Звезда ещё горит — куда она указывает?',
        next: 'street_poet_guiding_star',
        condition: { collectedPoem: 'poem_3' },
      },
      {
        text: 'Табличка на обелиске — снять.',
        next: 'quest_act7_poets_monument_plate',
        condition: {
          flag: 'quest_act7_poets_monument_inscription_active',
          missingFlag: 'quest_act7_poets_monument_plate_cleared',
        },
      },
      {
        text: 'Имена — вспомнить у камня.',
        next: 'quest_act7_poets_monument_recall',
        condition: {
          flag: 'quest_act7_poets_monument_plate_cleared',
          missingFlag: 'quest_act7_poets_monument_names_recalled',
        },
      },
      {
        text: 'Имена — вырезать на обелиске.',
        next: 'quest_act7_poets_monument_carve',
        condition: {
          flag: 'quest_act7_poets_monument_names_recalled',
          missingFlag: 'quest_act7_poets_monument_carved',
        },
      },
      {
        text: 'Последняя строка — дописать.',
        next: 'quest_act7_poets_monument_inscribe',
        condition: {
          flag: 'quest_act7_poets_monument_carved',
          missingFlag: 'quest_act7_poets_monument_inscription_done',
        },
      },
      {
        text: 'Памятник в парке — добавить своё имя.',
        next: 'epilogue_monument_start',
        condition: {
          flag: 'volodka_legacy_complete',
          missingFlag: 'epilogue_monument_started',
        },
        effects: [{ type: 'triggerQuest', questId: 'epilogue_monument' }],
      },
      {
        text: 'У камня — одно имя ещё ждёт.',
        next: 'epilogue_monument_done',
        condition: {
          flag: 'epilogue_monument_started',
          missingFlag: 'epilogue_monument_done',
        },
      },
      { text: 'Поблагодарить и уйти.', next: null },
    ],
  },

  marat_echo_return: {
    id: 'marat_echo_return',
    speaker: 'Марат (эхо)',
    text: '[терминал мерцает] ...ты... снова... Здесь... провода... помнят... Не верь... гильдии... Верь... рифме...',
    choices: [
      {
        text: 'Ответить строкой из тетради',
        next: null,
        effects: [{ type: 'visitStoryNode', nodeId: 'library_marat_echo' }],
      },
      {
        text: 'Кто тебя оставил здесь?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'addKarma', value: 1 },
        ],
      },
    ],
  },

  guild_defector_return: {
    id: 'guild_defector_return',
    speaker: 'Перебежчик',
    text: 'Снова пришёл проверить? Я... держусь. Серверную помню — каждый кабель, каждый порт. Если нужно — спрашивай. Я теперь по ту сторону стены.',
    choices: [
      {
        text: 'Расскажи про серверную — все детали.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'defector_server_intel', flagValue: true },
          { type: 'npcChange', npcId: 'guild_defector', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Как ты? В безопасности?',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'guild_defector', npcChange: { relation: 2 } },
        ],
      },
      { text: 'Держись. Увидимся.', next: null },
    ],
  },

  boris_return: {
    id: 'boris_return',
    speaker: 'Борис',
    text: 'Володька! Между третьим и четвёртым станками — тетрадь на месте. Я дописал ещё две страницы. Хочешь послушать?',
    choices: [
      {
        text: 'Покажи.',
        next: 'boris_poem',
        effects: [{ type: 'addKarma', value: 2 }],
      },
      {
        text: 'Станки всё ещё «говорят» стихами?',
        next: 'boris_risk',
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
      {
        text: '«Заря-М» на заводе — ты слышал, как она «поёт»?',
        next: 'boris_act3_factory',
        condition: { requiredAct: 2, flag: 'wants_visit_factory' },
      },
      { text: 'Пиши дальше, Борис.', next: null },
    ],
  },

  tamara_return: {
    id: 'tamara_return',
    speaker: 'Тамара',
    text: 'Володька. Библиотека чувствует твоё возвращение — страницы шелестят, когда ты входишь. Что ищешь на этот раз?',
    choices: [
      {
        text: 'Запрещённые тексты. Те, что не в Сети.',
        next: 'tamara_forbidden',
        effects: [{ type: 'addSkill', skill: 'writing', value: 1 }],
      },
      {
        text: 'Нужны слова, которые остановят гильдию.',
        next: 'tamara_act3_resistance',
        condition: { requiredAct: 3, flag: 'vault_under_attack' },
      },
      {
        text: 'Просто тишины. И книг.',
        next: 'tamara_peace',
        effects: [{ type: 'addStat', stat: 'stress', value: -5 }],
      },
    ],
  },

  grisha_return: {
    id: 'grisha_return',
    speaker: 'Гриша',
    text: 'Снова на крыше? Хорошо. Видишь — фиолетовый луч всё ещё пульсирует над башней. Город не меняется. Но мы — можем.',
    choices: [
      {
        text: 'Что ты видишь с крыши сегодня?',
        next: 'grisha_vision',
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
      {
        text: 'Видишь атаку на Хранилище?',
        next: 'grisha_act3_vault',
        condition: { requiredAct: 3, flag: 'vault_under_attack' },
      },
      {
        text: 'Возьми. Тут немного еды.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'grisha', npcChange: { relation: 3 } },
        ],
      },
      { text: 'Красиво здесь. Но холодно.', next: 'grisha_cold' },
    ],
  },

  kira_return: {
    id: 'kira_return',
    speaker: 'Кира',
    text: 'Володька-Володька. Слухи о твоём упрямстве преувеличены — ты ещё упрямее. Что на этот раз? Информация? Или просто скучно?',
    choices: [
      {
        text: 'Что ты знаешь?',
        next: 'kira_info',
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
      {
        text: 'Кто предал Зарему? У тебя есть имя?',
        next: 'kira_act3_betrayal',
        condition: { requiredAct: 3, flag: 'zarema_arrested' },
      },
      {
        text: 'Стихи не продаются, Кира.',
        next: null,
        effects: [{ type: 'addKarma', value: 2 }],
      },
      { text: 'До встречи, информатор.', next: null },
    ],
  },

  viktor_return: {
    id: 'viktor_return',
    speaker: 'Виктор',
    text: 'Володька. Терминал мигает — значит, ты снова здесь. Он пережил Сбой, переживёт и тебя. Садись. Что на этот раз?',
    choices: [
      {
        text: 'Расскажи о Сбое ещё раз.',
        next: 'viktor_crash',
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
      {
        text: 'Научи меня читать Сеть, как книгу.',
        next: null,
        condition: { flag: 'viktor_archive_seen' },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'viktor', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Гильдия атакует Хранилище. Что в твоём архиве?',
        next: 'viktor_act3_vault',
        condition: { requiredAct: 3, flag: 'vault_under_attack' },
      },
      { text: 'Спасибо, Виктор. Увидимся.', next: null },
    ],
  },
}
