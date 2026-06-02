/* ─── Volodka RPG – expanded dialogue nodes ─── */
/* Dialogue trees for the 5 new NPCs: Вера, Сергей, Лена, Олег, Катя.
   Import and merge with DIALOGUE_NODES from dialogueNodes.ts. */

import type { DialogueNode } from '@/shared/types/game'

export const EXPANDED_DIALOGUE_NODES: Record<string, DialogueNode> = {
  /* ═══════════════════════════════════════════════════════════
     ВЕРА — бывшая журналистка (4 nodes)
     ═══════════════════════════════════════════════════════════ */

  vera_greeting: {
    id: 'vera_greeting',
    speaker: 'Вера',
    text: 'А, newcomer. Редко вижу новые лица в этих краях. Я Вера — храню архивы того, что было до Краха. Не всё стёрли. Кое-что уцелело. В памяти и на бумаге.',
    choices: [
      { text: 'Расскажи о мире до Краха.', next: 'vera_before_crash', effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }] },
      { text: 'Какие архивы ты хранишь?', next: 'vera_archives' },
      { text: 'Спасибо, может позже.', next: null },
    ],
  },

  vera_before_crash: {
    id: 'vera_before_crash',
    speaker: 'Вера',
    text: 'До Краха... люди не боялись слов. Газеты писали правду, книги не нужно было прятать. А потом пришла "оптимизация" — сначала удалили комментарии, потом статьи, потом целые архивы. Как будто ничего и не было. Но я помню.',
    choices: [
      { text: 'Ты помнишь — это уже сопротивление.', next: 'vera_memory_resistance', effects: [{ type: 'addKarma', value: 3 }] },
      { text: 'Почему ты осталась здесь?', next: null },
    ],
  },

  vera_archives: {
    id: 'vera_archives',
    speaker: 'Вера',
    text: 'У меня есть статьи, которые гильдия считает "удалёнными". Стихи, которые официально не существуют. Имена людей, которых стёрли из баз данных. Всё это — в моей голове и в тайнике. Если хочешь знать правду — приходи.',
    choices: [
      { text: 'Я хочу знать правду.', next: null, effects: [{ type: 'setFlag', flag: 'vera_archives_access', flagValue: true }, { type: 'addSkill', skill: 'persuasion', value: 1 }] },
      { text: 'Опасное занятие.', next: null },
    ],
  },

  vera_memory_resistance: {
    id: 'vera_memory_resistance',
    speaker: 'Вера',
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
}
