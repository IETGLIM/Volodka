/* ─── Volodka RPG – NPC definitions ─── */

import type { NPCDefinition } from '@/shared/types/game';
import {
  NPC_MODEL_ASSETS,
  NPC_PROCEDURAL_MODEL_PLACEHOLDER,
  resolveNpcModelUrl,
} from '@/config/npcModelRegistry';
import { DEFAULT_NPC_ANIMATION_CLIPS } from '@/config/npcAnimationDefaults';

export const NPC_DEFINITIONS: NPCDefinition[] = [
  /* ─────────────── ALBERT – philosopher at the cafe ─────────────── */
  {
    id: 'albert',
    name: 'Альберт',
    modelPath: '/models/npcs/albert.glb',
    scale: 1.0,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [-2.5, 0, -3.0],
    defaultRotation: Math.PI * 0.25,
    patrolRadius: 1.5,
    dialogueNodeId: 'albert_greeting',
    npcSplashProfile: 'albert_cafe',
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
    modelPath: '/models/npcs/zarema.glb',
    scale: 0.95,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [1.5, 0, 2.0],
    defaultRotation: Math.PI,
    patrolRadius: 2.0,
    dialogueNodeId: 'zarema_greeting',
    npcSplashProfile: 'zarema_kitchen',
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
    modelPath: '/models/npcs/cafe_barista.glb',
    scale: 1.0,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [0, 0, -4.0],
    defaultRotation: 0,
    patrolRadius: 0.5,
    dialogueNodeId: 'cafe_barista_dialogue',
    npcSplashProfile: 'barista_counter',
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
    modelPath: '/models/npcs/office_alexander.glb',
    scale: 1.05,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
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
    npcSplashProfile: 'npc_office_alexander',
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
    modelPath: '/models/npcs/office_colleague.glb',
    scale: 0.95,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [1.0, 0, 0.5],
    defaultRotation: Math.PI * 1.25,
    patrolRadius: 0.8,
    dialogueNodeId: 'office_colleague_dialogue',
    npcSplashProfile: 'npc_office_colleague',
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
    modelPath: '/models/npcs/maria.glb',
    scale: 0.8,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
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
    npcSplashProfile: 'npc_maria',
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
    modelPath: '/models/npcs/office_dmitry.glb',
    scale: 1.1,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
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
    npcSplashProfile: 'npc_office_dmitry',
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

  /* ─────────────── VIKTOR — old hacker, mentor figure ─────────────── */
  {
    id: 'viktor',
    name: 'Виктор',
    modelPath: '/models/npcs/viktor.glb',
    scale: 1.0,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [-4.0, 0, 2.0],
    defaultRotation: Math.PI * 0.5,
    patrolRadius: 1.0,
    patrolWaypoints: [
      [-4.0, 0, 2.0],
      [-3.0, 0, 1.0],
      [-4.0, 0, -1.0],
      [-5.0, 0, 0.0],
    ],
    dialogueNodeId: 'viktor_greeting',
    npcSplashProfile: 'npc_viktor',
    description: 'Старый хакер, переживший Великий Сбой. Знает тайны Сети, которые никому не рассказывает. Наставник, потерявший всё — кроме памяти.',
    barkTexts: {
      hostile: 'Я уже видел таких, как ты. Все сгорели.',
      neutral: 'Терминал мигает — значит, кто-то ищет. Будь осторожен.',
      friendly: 'Володька! Смотри, что я нашёл в старых логах. Это перевернёт твоё представление о Сети.',
    },
    appearance: {
      bodyColor: '#3d3d5c',
      accentColor: '#6a6a8a',
      headAccessory: 'glasses',
      height: 0.95,
      glowColor: '#5a5aff',
      silhouette: 'slim',
    },
  },

  /* ─────────────── KIRA — street informant, data trader ─────────────── */
  {
    id: 'kira',
    name: 'Кира',
    modelPath: '/models/npcs/kira.glb',
    scale: 1.0,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [3.0, 0, -4.0],
    defaultRotation: Math.PI * 1.5,
    patrolRadius: 2.5,
    patrolWaypoints: [
      [3.0, 0, -4.0],
      [4.0, 0, -3.0],
      [5.0, 0, -4.0],
      [4.0, 0, -5.0],
    ],
    dialogueNodeId: 'kira_greeting',
    npcSplashProfile: 'npc_kira',
    description: 'Молодая информаторка с улиц. Торгует данными, слухами и секретами. Знает всё обо всех — за правильную цену.',
    barkTexts: {
      hostile: 'Информация не для тебя. Потеряешь — не верну.',
      neutral: 'Есть свежие данные. Интересует? Недорого.',
      friendly: 'Володька! Для тебя — скидка. Сорок процентов. Потому что ты ещё не продался.',
    },
    appearance: {
      bodyColor: '#4a2040',
      accentColor: '#c04080',
      headAccessory: 'earring',
      height: 0.9,
      glowColor: '#ff4080',
      silhouette: 'slim',
    },
  },

  /* ─────────────── BORIS — factory worker, hidden poet ─────────────── */
  {
    id: 'boris',
    name: 'Борис',
    modelPath: '/models/npcs/boris.glb',
    scale: 1.1,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [0.0, 0, -5.0],
    defaultRotation: 0,
    patrolRadius: 2.0,
    dialogueNodeId: 'boris_greeting',
    npcSplashProfile: 'npc_boris',
    description: 'Рабочий с заброшенного завода. В тайне пишет стихи, которые никому не показывает. Его руки помнят тяжесть металла, а душа — лёгкость слова.',
    barkTexts: {
      hostile: 'Не мешай работать. Тут и так всё разваливается.',
      neutral: 'Смена длинная. Но мы привыкли.',
      friendly: 'Володька... я тут написал кое-что. Может, посмотришь? Только никому не говори.',
    },
    appearance: {
      bodyColor: '#5a4a3a',
      accentColor: '#8a7a5a',
      headAccessory: 'hat',
      height: 1.15,
      glowColor: '#8a6a30',
      silhouette: 'heavy',
    },
  },

  /* ─────────────── TAMARA — librarian, keeper of forbidden texts ─────────────── */
  {
    id: 'tamara',
    name: 'Тамара',
    modelPath: '/models/npcs/tamara.glb',
    scale: 0.95,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [2.0, 0, 3.0],
    defaultRotation: Math.PI * 0.75,
    patrolRadius: 1.5,
    patrolWaypoints: [
      [2.0, 0, 3.0],
      [1.0, 0, 2.0],
      [3.0, 0, 1.0],
      [2.0, 0, 2.5],
    ],
    dialogueNodeId: 'tamara_greeting',
    npcSplashProfile: 'npc_tamara',
    description: 'Библиотекарь, хранящая запрещённые тексты в цифровом и бумажном виде. Верит, что слова сильнее любого кода. Последний оплот докиберпанковой культуры.',
    barkTexts: {
      hostile: 'Эти книги не для тебя. Ты не готов.',
      neutral: 'Библиотека открыта. Но не все книги доступны.',
      friendly: 'Володька! Я нашла то, что ты искал. Первое издание, бумажное. Ему сто лет.',
    },
    appearance: {
      bodyColor: '#3a2a2a',
      accentColor: '#8a4a4a',
      headAccessory: 'glasses',
      height: 0.95,
      glowColor: '#c06040',
      silhouette: 'average',
    },
  },

  /* ─────────────── GRISHA — rooftop dweller, sky watcher ─────────────── */
  {
    id: 'grisha',
    name: 'Гриша',
    modelPath: '/models/npcs/grisha.glb',
    scale: 1.05,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [-3.0, 0, -5.0],
    defaultRotation: Math.PI * 0.25,
    patrolRadius: 3.0,
    dialogueNodeId: 'grisha_greeting',
    npcSplashProfile: 'npc_grisha',
    description: 'Обитатель крыш. Смотрит на город сверху и видит то, что другие не замечают. Знает каждый неоновый луч и каждую тень.',
    barkTexts: {
      hostile: 'С крыши видно всё. Даже то, что ты пытаешься скрыть.',
      neutral: 'Красивый закат сегодня. Неон особенно яркий.',
      friendly: 'Володька! Поднимайся. Сверху город выглядит почти живым. Почти свободным.',
    },
    appearance: {
      bodyColor: '#2a3a5a',
      accentColor: '#5a8aca',
      headAccessory: 'scarf',
      height: 1.05,
      glowColor: '#4a7aff',
      silhouette: 'slim',
    },
  },
];

/** Dev/CI: flag NPCs with missing or inconsistent modelPath assignments. */
export function validateNpcDefinitionModelPaths(
  npcs: readonly NPCDefinition[] = NPC_DEFINITIONS,
): Array<{ npcId: string; message: string }> {
  const problems: Array<{ npcId: string; message: string }> = [];

  for (const npc of npcs) {
    const path = npc.modelPath ?? '';

    if (path === '') {
      problems.push({
        npcId: npc.id,
        message: `modelPath is empty — set a shipped GLB path or "${NPC_PROCEDURAL_MODEL_PLACEHOLDER}"`,
      });
      continue;
    }

    if (path === NPC_PROCEDURAL_MODEL_PLACEHOLDER) {
      if (NPC_MODEL_ASSETS[npc.id]?.url) {
        problems.push({
          npcId: npc.id,
          message: 'has shipped GLB in npcModelRegistry but modelPath is procedural placeholder',
        });
      }
      continue;
    }

    if (!resolveNpcModelUrl(npc.id, path)) {
      problems.push({
        npcId: npc.id,
        message: `modelPath "${path}" is not a shipped GLB — renderer will use procedural fallback`,
      });
    }
  }

  return problems;
}
