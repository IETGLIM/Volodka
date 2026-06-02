/* ─── Volodka RPG – NPC definitions ─── */

import type { NPCDefinition } from '@/shared/types/game';

export const NPC_DEFINITIONS: NPCDefinition[] = [
  /* ─────────────── ALBERT – philosopher at the cafe ─────────────── */
  {
    id: 'albert',
    name: 'Альберт',
    modelPath: '',
    scale: 1.0,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [-2.5, 0, -3.0],
    defaultRotation: Math.PI * 0.25,
    patrolRadius: 1.5,
    dialogueNodeId: 'albert_greeting',
    description: 'Философ-затворник, постоянный гость кафе «Синяя яма». Видит в коде и стихах одну природу.',
    barkTexts: {
      hostile: 'Уходи. Мне не о чем говорить с тем, кто не видит глубины.',
      neutral: 'Привет. Присядешь? Тут есть о чём подумать.',
      friendly: 'Володька! Я как раз размышлял о том, что ты сказал в прошлый раз...',
    },
    appearance: {
      bodyColor: '#8b6914',
      accentColor: '#d4a030',
      headAccessory: 'glasses',
      height: 1.0,
      glowColor: '#d4920a',
      silhouette: 'average',
    },
  },

  /* ─────────────── ZAREMA – caring friend ─────────────── */
  {
    id: 'zarema',
    name: 'Зарема',
    modelPath: '',
    scale: 0.95,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [1.5, 0, 2.0],
    defaultRotation: Math.PI,
    patrolRadius: 2.0,
    dialogueNodeId: 'zarema_greeting',
    description: 'Тёплая, заботливая соседка по коммуналке. Единственный человек, который по-настоящему переживает за Володьку.',
    barkTexts: {
      hostile: 'Ты опять... Ладно. Как хочешь.',
      neutral: 'Володька, ты ел сегодня?',
      friendly: 'Я приготовила твой любимый суп! Иди скорее!',
    },
    appearance: {
      bodyColor: '#3d2b50',
      accentColor: '#1a8a7a',
      headAccessory: 'scarf',
      height: 0.95,
      glowColor: '#e87a9f',
      silhouette: 'slim',
    },
  },

  /* ─────────────── CAFE BARISTA ─────────────── */
  {
    id: 'cafe_barista',
    name: 'Бариста',
    modelPath: '',
    scale: 1.0,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [0, 0, -4.0],
    defaultRotation: 0,
    patrolRadius: 0.5,
    dialogueNodeId: 'cafe_barista_dialogue',
    description: 'Бариста кафе «Синяя яма» с кибернетическим протезом руки. Знает больше, чем говорит.',
    barkTexts: {
      hostile: 'Мы закрыты.',
      neutral: 'Что будем пить?',
      friendly: 'Для тебя — особый рецепт.',
    },
    appearance: {
      bodyColor: '#a05a2c',
      accentColor: '#e8822a',
      headAccessory: 'none',
      height: 1.0,
      glowColor: '#f0c040',
      silhouette: 'average',
    },
  },

  /* ─────────────── ALEXANDER – IT guild leader ─────────────── */
  {
    id: 'office_alexander',
    name: 'Александр',
    modelPath: '',
    scale: 1.05,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [3.0, 0, -2.0],
    defaultRotation: Math.PI * 0.5,
    patrolRadius: 1.0,
    patrolWaypoints: [
      [3.0, 0, -2.0],
      [4.0, 0, -1.0],
      [3.5, 0, 0.5],
      [2.0, 0, -0.5],
    ],
    dialogueNodeId: 'office_alexander_dialogue',
    description: 'Лидер IT-гильдии. Спокоен, профессионален, но скрывает усталость. Обратился к Володьке из-за инцидента #4729.',
    barkTexts: {
      hostile: 'Нам не о чем говорить.',
      neutral: 'Следующий.',
      friendly: 'Ты заслуживаешь внимания.',
    },
    appearance: {
      bodyColor: '#1c1c2a',
      accentColor: '#3a3a50',
      headAccessory: 'hat',
      height: 1.05,
      glowColor: '#cc2020',
      silhouette: 'average',
    },
  },

  /* ─────────────── COLLEAGUE – office worker ─────────────── */
  {
    id: 'office_colleague',
    name: 'Коллега',
    modelPath: '',
    scale: 0.95,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [1.0, 0, 0.5],
    defaultRotation: Math.PI * 1.25,
    patrolRadius: 0.8,
    dialogueNodeId: 'office_colleague_dialogue',
    description: 'Нервный коллега в офисе гильдии. Знает о связи между кодом и стихами, но боится говорить.',
    barkTexts: {
      hostile: 'Я тебя не знаю.',
      neutral: 'Привет... *оглядывается*',
      friendly: 'Слушай, у меня есть кое-что...',
    },
    appearance: {
      bodyColor: '#6b6b78',
      accentColor: '#8a8a98',
      headAccessory: 'glasses',
      height: 0.92,
      glowColor: '#d0d0e0',
      silhouette: 'slim',
    },
  },

  /* ─────────────── MARIA – mysterious stranger ─────────────── */
  {
    id: 'maria',
    name: 'Виктория',
    modelPath: '',
    scale: 0.8,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [-3.0, 0, 2.0],
    defaultRotation: Math.PI * 0.5,
    patrolRadius: 2.0,
    patrolWaypoints: [
      [-3.0, 0, 2.0],
      [-1.5, 0, 3.0],
      [0.0, 0, 1.5],
      [-2.0, 0, 0.5],
    ],
    dialogueNodeId: 'maria_dialogue',
    description: 'Таинственная незнакомка, появляющаяся в тени города. Знает о коде и стихах больше, чем кто-либо. Её прошлое — загадка, а мотивы — неясны.',
    barkTexts: {
      hostile: 'Уходи.',
      neutral: 'Ищешь что-то? Стихи… они повсюду.',
      friendly: 'Рада тебя видеть, Володька. Прислушайся к словам между строк.',
    },
    appearance: {
      bodyColor: '#4a5e80',
      accentColor: '#a0b8d8',
      headAccessory: 'earring',
      height: 0.9,
      glowColor: '#40d0e0',
      silhouette: 'slim',
    },
  },

  /* ─────────────── DMITRY – senior developer ─────────────── */
  {
    id: 'office_dmitry',
    name: 'Дмитрий',
    modelPath: '',
    scale: 1.1,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [-2.0, 0, 1.5],
    defaultRotation: Math.PI * 0.75,
    patrolRadius: 1.2,
    patrolWaypoints: [
      [-2.0, 0, 1.5],
      [-1.0, 0, 2.5],
      [0.0, 0, 1.0],
      [-1.5, 0, 0.0],
    ],
    dialogueNodeId: 'dmitry_greeting',
    description: 'Старший разработчик IT-гильдии. Много знает о старых архивах, но предпочитает молчать. Ментор, который мог бы стать другом.',
    barkTexts: {
      hostile: 'Тебе здесь нечего делать. Уходи.',
      neutral: 'Если нужны документы — обратись к Александру.',
      friendly: 'Володька, зайди. Я кое-что нашёл в старых логах. Думаю, тебе будет интересно.',
    },
    appearance: {
      bodyColor: '#2d4a2a',
      accentColor: '#4a7040',
      headAccessory: 'none',
      height: 1.15,
      glowColor: '#6a8a30',
      silhouette: 'heavy',
    },
  },
];
