import type { StoryNode } from '@/shared/types/game';

/** Пост-финальный контент Act 7 — письма, памятник, эпилог. */
export const STORY_NODES_EPILOGUE: Record<string, StoryNode> = {
  epilogue_hub: {
    id: 'epilogue_hub',
    text: 'Город дышит иначе — не идеально, но честно. На коммуникаторе накапливаются сообщения: от тех, кто остался, кто ушёл, кто помнит. Есть места, куда стоит зайти ещё раз — не ради сюжета, ради прощания.',
    contextNote: 'Эпилог. Сообщения от NPC, места для прощания.',
    accessibilityAnnounce: 'Эпилог. Можно читать письма и посещать памятник.',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    condition: { flag: 'volodka_legacy_complete' },
    guidanceHint: 'Письма от всех или памятник поэтам в парке.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Прочитать письма от всех',
        next: 'epilogue_letters_start',
        condition: { missingFlag: 'epilogue_letters_started' },
        effects: [{ type: 'triggerQuest', questId: 'epilogue_letters' }],
      },
      {
        text: 'Тетрадь с письмами — дочитать',
        next: 'epilogue_letters_done',
        condition: {
          flag: 'epilogue_letters_started',
          missingFlag: 'epilogue_letters_done',
        },
      },
      {
        text: 'Пойти к памятнику поэтам',
        next: 'epilogue_monument_start',
        condition: { missingFlag: 'epilogue_monument_started' },
        effects: [{ type: 'triggerQuest', questId: 'epilogue_monument' }],
      },
      {
        text: 'У камня — одно имя ещё ждёт',
        next: 'epilogue_monument_done',
        condition: {
          flag: 'epilogue_monument_started',
          missingFlag: 'epilogue_monument_done',
        },
      },
      { text: 'Остаться в комнате', next: 'explore_mode' },
    ],
  },

  epilogue_letters_start: {
    id: 'epilogue_letters_start',
    text: 'Письма приходят не по порядку — как воспоминания. Зарема пишет о чае. Альберт — о кофе, который ещё не остыл. Солныш — четыре строки без подписи. Дмитрий — одно слово: «Держись.» Трофим — «Клюёт. Жду на пирсе.» Катя — список имён, которые вернули в каталог.',
    contextNote: 'Письма от NPC после финала.',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    choices: [
      {
        text: 'Сложить письма в тетрадь',
        next: 'epilogue_letters_done',
        effects: [{ type: 'setFlag', flag: 'epilogue_letters_started', flagValue: true }],
      },
      {
        text: 'Отойти от стола',
        next: 'explore_mode',
        condition: { missingFlag: 'epilogue_letters_done' },
      },
    ],
  },

  epilogue_letters_done: {
    id: 'epilogue_letters_done',
    text: 'Тетрадь тяжелеет — не страницами, смыслом. Ты понимаешь: это не награда, а сеть. Нити между людьми, которые не дали себя стереть. Комната тиха. Город за окном гудит на 50 герц — но теперь это не угроза, а пульс.',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    choices: [
      {
        text: 'Закрыть тетрадь',
        next: 'explore_mode',
        effects: [
          { type: 'setFlag', flag: 'epilogue_letters_done', flagValue: true },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Оставить тетрадь открытой',
        next: 'explore_mode',
        condition: { missingFlag: 'epilogue_letters_done' },
      },
    ],
  },

  epilogue_monument_start: {
    id: 'epilogue_monument_start',
    text: 'Памятник поэтам стоит в парке — без гильдейской таблички, только имена, вырезанные руками. Кто-то оставил цветы. Кто-то — стих на бумаге под камнем. Ветер читает его за тебя.',
    contextNote: 'Памятник поэтам в парке.',
    accessibilityAnnounce: 'Парк. Памятник поэтам с именами, вырезанными вручную.',
    speaker: 'narrator',
    sceneId: 'park_day',
    choices: [
      {
        text: 'Постоять в молчании',
        next: 'epilogue_monument_done',
        goldenPath: true,
        effects: [{ type: 'setFlag', flag: 'epilogue_monument_started', flagValue: true }],
      },
      {
        text: 'Отойти от обелиска',
        next: 'park_explore_mode',
        condition: { missingFlag: 'epilogue_monument_done' },
      },
    ],
  },

  epilogue_monument_done: {
    id: 'epilogue_monument_done',
    text: 'Ты добавляешь одно имя — то, которое помнил только ты. Камень принимает. Парк не отвечает — и это правильно. Некоторые вещи не нуждаются в одобрении системы.',
    speaker: 'narrator',
    sceneId: 'park_day',
    choices: [
      {
        text: 'Уйти',
        next: 'park_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'epilogue_monument_done', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_17' },
        ],
      },
      {
        text: 'Постоять ещё',
        next: 'park_explore_mode',
        condition: { missingFlag: 'epilogue_monument_done' },
      },
    ],
  },
};
