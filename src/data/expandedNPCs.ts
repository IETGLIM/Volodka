/* ─── Volodka RPG – expanded NPC definitions ─── */
/* Additional NPCs that expand the world beyond the original 7.
   Import and merge with NPC_DEFINITIONS from npcDefinitions.ts.
   Linked quest IDs are in a separate record for reference. */

import type { NPCDefinition } from '@/shared/types/game'

/* ── NPC-to-quest links (for quest assignment logic) ── */
export const EXPANDED_NPC_QUEST_LINKS: Record<string, string[]> = {
  vera: ['voice_of_the_past'],
  sergey: ['night_shift_mystery', 'night_watch'],
  lena: ['digital_ghost', 'secrets_of_old_code'],
  oleg: ['guild_infiltration'],
  kate: ['poetry_smuggling', 'poetry_collection'],
}

/* ── All bark text variants (hostile/neutral/friendly arrays) ── */
export const EXPANDED_NPC_BARK_TEXTS: Record<string, {
  hostile: string[]
  neutral: string[]
  friendly: string[]
}> = {
  vera: {
    hostile: ['Уходи. Мне нечего тебе сказать.'],
    neutral: ['Новые лица... Редкость в наши дни.', 'Архивы хранят больше, чем серверы.'],
    friendly: ['Володька! Заходи, есть кое-что интересное.', 'Я нашла старую статью... Времён до цензуры.'],
  },
  sergey: {
    hostile: ['Не мешай работе.'],
    neutral: ['Ночная смена... Как всегда.', 'Серверная — мой дом.'],
    friendly: ['Володька, у меня есть доступ к старым логам.', 'Слушай, тут кое-что странное в логах...'],
  },
  lena: {
    hostile: ['Ты не тот, за кого себя выдаёшь.'],
    neutral: ['...[тишина]...', 'Сеть говорила о тебе.'],
    friendly: ['Володька, у меня есть кое-что для тебя. Из Сети.', 'Я нашла бэкдор в их системе.'],
  },
  oleg: {
    hostile: ['Стой. Доступ запрещён.'],
    neutral: ['Пропуск есть? Нет — проходи мимо.', 'Приказ есть приказ.'],
    friendly: ['Володька... Будь осторожен. Они за тобой следят.', 'Я закрою глаза на этот раз.'],
  },
  kate: {
    hostile: ['Эта секция закрыта.'],
    neutral: ['Тише... Стены слушают.', 'Книги — последний убежище.'],
    friendly: ['Володька, я припрятала кое-что для тебя.', 'Между строк — больше правды, чем в новостях.'],
  },
}

/* ── Expanded NPC definitions (compatible with NPCDefinition type) ── */

export const EXPANDED_NPCS: NPCDefinition[] = [
  /* ─────────────── ВЕРА – archive keeper ─────────────── */
  {
    id: 'vera',
    name: 'Вера',
    modelPath: '',
    scale: 0.9,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [-1.0, 0, 3.0],
    patrolRadius: 1.5,
    patrolWaypoints: [
      [-1.0, 0, 3.0],
      [-0.5, 0, 2.5],
      [-1.5, 0, 2.0],
      [-1.0, 0, 3.0],
    ],
    dialogueNodeId: 'vera_greeting',
    description: 'Бывшая журналистка, хранительница архивов. Единственный человек, который помнит мир до Краха.',
    barkTexts: {
      hostile: 'Уходи. Мне нечего тебе сказать.',
      neutral: 'Новые лица... Редкость в наши дни.',
      friendly: 'Володька! Заходи, есть кое-что интересное.',
    },
    appearance: {
      bodyColor: '#e8e0a0',
      accentColor: '#e8e0a0',
      headAccessory: 'scarf',
      height: 0.9,
      glowColor: '#e8e0a0',
      silhouette: 'slim',
    },
  },

  /* ─────────────── СЕРГЕЙ – sysadmin ─────────────── */
  {
    id: 'sergey',
    name: 'Сергей',
    modelPath: '',
    scale: 1.05,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [2.5, 0, -1.0],
    patrolRadius: 1.0,
    patrolWaypoints: [
      [2.5, 0, -1.0],
      [3.0, 0, -0.5],
      [2.0, 0, -1.5],
      [2.5, 0, -1.0],
    ],
    dialogueNodeId: 'sergey_greeting',
    description: 'Сисадмин ночного смены. Молчаливый, но надёжный. Знает каждый кабель в серверной.',
    barkTexts: {
      hostile: 'Не мешай работе.',
      neutral: 'Ночная смена... Как всегда.',
      friendly: 'Володька, у меня есть доступ к старым логам.',
    },
    appearance: {
      bodyColor: '#40a0c0',
      accentColor: '#40a0c0',
      headAccessory: 'none',
      height: 1.05,
      glowColor: '#40a0c0',
      silhouette: 'average',
    },
  },

  /* ─────────────── ЛЕНА – hacker from the Network ─────────────── */
  {
    id: 'lena',
    name: 'Лена',
    modelPath: '',
    scale: 0.85,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [0, 0, 3.5],
    patrolRadius: 2.0,
    patrolWaypoints: [
      [0, 0, 3.5],
      [1.0, 0, 3.0],
      [-1.0, 0, 2.5],
      [0, 0, 3.5],
    ],
    dialogueNodeId: 'lena_greeting',
    description: 'Хакер из Сети. Никто не знает её настоящего имени. Она — тень в цифровом мире.',
    barkTexts: {
      hostile: 'Ты не тот, за кого себя выдаёшь.',
      neutral: '...[тишина]...',
      friendly: 'Володька, у меня есть кое-что для тебя. Из Сети.',
    },
    appearance: {
      bodyColor: '#d040d0',
      accentColor: '#d040d0',
      headAccessory: 'earring',
      height: 0.85,
      glowColor: '#d040d0',
      silhouette: 'slim',
    },
  },

  /* ─────────────── ОЛЕГ – guild guard ─────────────── */
  {
    id: 'oleg',
    name: 'Олег',
    modelPath: '',
    scale: 1.1,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [4.0, 0, 0],
    patrolRadius: 1.0,
    patrolWaypoints: [
      [4.0, 0, 0],
      [4.5, 0, -0.5],
      [3.5, 0, 0.5],
      [4.0, 0, 0],
    ],
    dialogueNodeId: 'oleg_greeting',
    description: 'Охранник гильдии. Бывший военный. Выполняет приказы, но сомневается.',
    barkTexts: {
      hostile: 'Стой. Доступ запрещён.',
      neutral: 'Пропуск есть? Нет — проходи мимо.',
      friendly: 'Володька... Будь осторожен. Они за тобой следят.',
    },
    appearance: {
      bodyColor: '#a0a0a0',
      accentColor: '#a0a0a0',
      headAccessory: 'hat',
      height: 1.1,
      glowColor: '#a0a0a0',
      silhouette: 'heavy',
    },
  },

  /* ─────────────── КАТЯ – librarian ─────────────── */
  {
    id: 'kate',
    name: 'Катя',
    modelPath: '',
    scale: 0.9,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [-2.0, 0, -2.0],
    patrolRadius: 1.5,
    patrolWaypoints: [
      [-2.0, 0, -2.0],
      [-2.5, 0, -2.5],
      [-1.5, 0, -1.5],
      [-2.0, 0, -2.0],
    ],
    dialogueNodeId: 'kate_greeting',
    description: 'Библиотекарь. Хранительница запрещённых книг. Тихая, но опасная.',
    barkTexts: {
      hostile: 'Эта секция закрыта.',
      neutral: 'Тише... Стены слушают.',
      friendly: 'Володька, я припрятала кое-что для тебя.',
    },
    appearance: {
      bodyColor: '#60c060',
      accentColor: '#60c060',
      headAccessory: 'glasses',
      height: 0.9,
      glowColor: '#60c060',
      silhouette: 'slim',
    },
  },
]
