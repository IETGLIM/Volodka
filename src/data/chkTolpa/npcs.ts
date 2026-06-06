/* ─── ТОЛПА / ЧК — NPC definitions ─── */
/* Тайное Общество Любителей Портвейна Алкоголя (между собой — Чёрная Комната) */

import type { NPCDefinition } from '@/shared/types/game';

export const CHK_NPC_QUEST_LINKS: Record<string, string[]> = {
  chk_ru: ['tolpa_whisper', 'tolpa_first_fire'],
  chk_based: ['tolpa_portwine_oath'],
  chk_smert: ['tolpa_quantum_fire'],
  chk_stalker: ['tolpa_forest_guide'],
  chk_elis: ['tolpa_guitar_night'],
};

export const CHK_NPC_BARK_TEXTS: Record<string, {
  hostile: string[];
  neutral: string[];
  friendly: string[];
}> = {
  chk_ru: {
    hostile: ['Ты не из наших. Уходи, пока лес не стал свидетелем.'],
    neutral: ['Днём — архитектура. Ночью — металл. Так устроена цивилизация.'],
    friendly: ['Володька! Садись ближе к костру. Басед уже наливает.'],
  },
  chk_based: {
    hostile: ['Портвейн не для посторонних.'],
    neutral: ['Система стабильна. Как и должно быть.', 'Ещё один деплой — и можно отдыхать.'],
    friendly: ['Володька, держи бокал. За uptime и за нас.'],
  },
  chk_smert: {
    hostile: ['Квантовая суперпозия: ты здесь и не здесь. Выбери «не здесь».'],
    neutral: ['Смерть — это просто необратимый процесс. Как legacy-код без тестов.'],
    friendly: ['Садись. Обсудим запутанность и quarterly report одновременно.'],
  },
  chk_stalker: {
    hostile: ['Тропа закрыта. Я уже видел твои логи.'],
    neutral: ['Лес помнит каждый шаг. Я — тоже.'],
    friendly: ['Тихо. Слышишь? Это не ветер — это bass line из колонки.'],
  },
  chk_elis: {
    hostile: ['Песня не для чужих ушей.'],
    neutral: ['...*настраивает струны*...', 'Баги днём, баллады ночью.'],
    friendly: ['Володька! Сейчас сыграю то, что не пропустит цензура API.'],
  },
  chk_guest_devops: {
    hostile: ['Я только на одну песню заехал. Не мешай.'],
    neutral: ['Кто-нибудь видел мой термос с портвейном?'],
    friendly: ['О, новое лицо! Расскажи, как у вас с CI на фронте.'],
  },
  chk_guest_analyst: {
    hostile: ['Мне завтра на стендап. Я ухожу.'],
    neutral: ['Графики не горят, если их смотреть у костра.'],
    friendly: ['Присаживайся — у меня есть теория про карму и burndown chart.'],
  },
};

export const CHK_NPCS: NPCDefinition[] = [
  {
    id: 'chk_ru',
    name: 'Ру',
    modelPath: '',
    scale: 1.05,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [-1.8, 0, 0.5],
    defaultRotation: Math.PI / 4,
    patrolRadius: 0.8,
    dialogueNodeId: 'chk_ru_greeting',
    description: 'Lead-архitect по будням, организатор ЧК по ночам. Любит тяжёлый металл и честный разговор у костра.',
    barkTexts: {
      hostile: CHK_NPC_BARK_TEXTS.chk_ru.hostile[0],
      neutral: CHK_NPC_BARK_TEXTS.chk_ru.neutral[0],
      friendly: CHK_NPC_BARK_TEXTS.chk_ru.friendly[0],
    },
    appearance: {
      bodyColor: '#2a2a35',
      accentColor: '#cc2244',
      headAccessory: 'hat',
      height: 1.05,
      glowColor: '#cc2244',
      silhouette: 'heavy',
    },
  },
  {
    id: 'chk_based',
    name: 'Басед',
    modelPath: '',
    scale: 1.0,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [1.5, 0, 1.2],
    defaultRotation: -Math.PI / 3,
    patrolRadius: 0.5,
    dialogueNodeId: 'chk_based_greeting',
    description: 'Системный администратор. Хранитель портвейна и морали ЧК.',
    barkTexts: {
      hostile: CHK_NPC_BARK_TEXTS.chk_based.hostile[0],
      neutral: CHK_NPC_BARK_TEXTS.chk_based.neutral[0],
      friendly: CHK_NPC_BARK_TEXTS.chk_based.friendly[0],
    },
    appearance: {
      bodyColor: '#3a3530',
      accentColor: '#8B4513',
      headAccessory: 'scarf',
      height: 1.0,
      glowColor: '#aa6633',
      silhouette: 'heavy',
    },
  },
  {
    id: 'chk_smert',
    name: 'Смерть',
    modelPath: '',
    scale: 0.95,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [0.3, 0, -1.8],
    defaultRotation: Math.PI,
    patrolRadius: 0.4,
    dialogueNodeId: 'chk_smert_greeting',
    description: 'Бухгалтер-философ. Обсуждает квантовую физику так, будто это sprint review.',
    barkTexts: {
      hostile: CHK_NPC_BARK_TEXTS.chk_smert.hostile[0],
      neutral: CHK_NPC_BARK_TEXTS.chk_smert.neutral[0],
      friendly: CHK_NPC_BARK_TEXTS.chk_smert.friendly[0],
    },
    appearance: {
      bodyColor: '#1a1a22',
      accentColor: '#8899cc',
      headAccessory: 'glasses',
      height: 0.95,
      glowColor: '#6677aa',
      silhouette: 'slim',
    },
  },
  {
    id: 'chk_stalker',
    name: 'Сталкер',
    modelPath: '',
    scale: 1.0,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [-2.5, 0, -2.0],
    defaultRotation: 0.6,
    patrolRadius: 1.2,
    patrolWaypoints: [
      [-2.5, 0, -2.0],
      [2.8, 0, -2.5],
      [2.5, 0, 2.0],
      [-2.5, 0, -2.0],
    ],
    dialogueNodeId: 'chk_stalker_greeting',
    description: 'Специалист по безопасности. Знает каждую тропу к поляне на Зорге.',
    barkTexts: {
      hostile: CHK_NPC_BARK_TEXTS.chk_stalker.hostile[0],
      neutral: CHK_NPC_BARK_TEXTS.chk_stalker.neutral[0],
      friendly: CHK_NPC_BARK_TEXTS.chk_stalker.friendly[0],
    },
    appearance: {
      bodyColor: '#2a3a28',
      accentColor: '#556644',
      headAccessory: 'scarf',
      height: 1.0,
      glowColor: '#445533',
      silhouette: 'slim',
    },
  },
  {
    id: 'chk_elis',
    name: 'Элис',
    modelPath: '',
    scale: 0.92,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [-1.4, 0, -1.0],
    defaultRotation: 0.2,
    patrolRadius: 0.6,
    dialogueNodeId: 'chk_elis_greeting',
    description: 'QA-инженер и бард ЧК. Песни под гитару — после code review.',
    barkTexts: {
      hostile: CHK_NPC_BARK_TEXTS.chk_elis.hostile[0],
      neutral: CHK_NPC_BARK_TEXTS.chk_elis.neutral[0],
      friendly: CHK_NPC_BARK_TEXTS.chk_elis.friendly[0],
    },
    appearance: {
      bodyColor: '#4a3040',
      accentColor: '#cc88aa',
      headAccessory: 'scarf',
      height: 0.92,
      glowColor: '#bb7799',
      silhouette: 'slim',
    },
  },
  /* ── Rotating guests (different hours on the same clearing) ── */
  {
    id: 'chk_guest_devops',
    name: 'Гость (DevOps)',
    modelPath: '',
    scale: 1.0,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [2.0, 0, 0.5],
    defaultRotation: -0.5,
    patrolRadius: 0.5,
    dialogueNodeId: 'chk_guest_devops_greeting',
    description: 'Периодический гость ЧК — инженер из соседнего деплоя.',
    barkTexts: {
      hostile: CHK_NPC_BARK_TEXTS.chk_guest_devops.hostile[0],
      neutral: CHK_NPC_BARK_TEXTS.chk_guest_devops.neutral[0],
      friendly: CHK_NPC_BARK_TEXTS.chk_guest_devops.friendly[0],
    },
    appearance: {
      bodyColor: '#334455',
      accentColor: '#44aacc',
      headAccessory: 'hat',
      height: 1.0,
      glowColor: '#3399bb',
      silhouette: 'slim',
    },
  },
  {
    id: 'chk_guest_analyst',
    name: 'Гость (Аналитик)',
    modelPath: '',
    scale: 0.98,
    animations: { idle: 'idle', walk: 'walk', talk: 'talk' },
    defaultPosition: [2.0, 0, 0.5],
    defaultRotation: -0.5,
    patrolRadius: 0.5,
    dialogueNodeId: 'chk_guest_analyst_greeting',
    description: 'Периодический гость ЧК — аналитик с теориями о жизни и метриках.',
    barkTexts: {
      hostile: CHK_NPC_BARK_TEXTS.chk_guest_analyst.hostile[0],
      neutral: CHK_NPC_BARK_TEXTS.chk_guest_analyst.neutral[0],
      friendly: CHK_NPC_BARK_TEXTS.chk_guest_analyst.friendly[0],
    },
    appearance: {
      bodyColor: '#443355',
      accentColor: '#9977cc',
      headAccessory: 'glasses',
      height: 0.98,
      glowColor: '#8866bb',
      silhouette: 'slim',
    },
  },
];
