import type { StoryNode } from './types';

/** Точка входа для демо главы 1 (вертикальный слайс). Полная история начинается с узла `start`. */
export const VERTICAL_SLICE_ENTRY_NODE_ID = 'vs_slice_intro' as const;

/** Упорядоченный spine демо для тестов `arcadeSlicePath.test.ts`. */
export const ARCADE_SLICE_STORY_SPINE = [
  'vs_slice_intro',
  'vs_slice_explore_free',
  'vs_slice_conflict',
  'vs_arcade_drill_qte',
  'vs_slice_albert_beat',
  'vs_end_warm',
  'vs_arcade_chat_spam',
  'vs_arcade_incident',
  'vs_end_cold',
  'vs_slice_outro',
] as const;

/**
 * Вертикальный слайс: глава 1 — ночная смена без оформления.
 * Аркада: wire-hack (exploration), drill QTE, chat spam, battle shards.
 */
export const VERTICAL_SLICE_STORY_NODES: Record<string, StoryNode> = {
  vs_slice_intro: {
    id: 'vs_slice_intro',
    type: 'narration',
    scene: 'volodka_room',
    act: 1,
    timeOfDay: 'night',
    text:
      'Глава 1 · демо. Ночь в панельке: снег за окном как статика, телефон мигает, снизу режет дрель.\n\n' +
      '**Управление:** WASD · Shift бег · **E** действие · Space в QTE · на телефоне — панель внизу.\n\n' +
      'Сначала **стойка** в комнате (мониторы, E у подсказки). Потом соседи, чат и выбор.',
    autoNext: 'vs_slice_explore_free',
  },

  vs_slice_explore_free: {
    id: 'vs_slice_explore_free',
    type: 'narration',
    scene: 'volodka_room',
    act: 1,
    timeOfDay: 'night',
  },

  vs_slice_conflict: {
    id: 'vs_slice_conflict',
    type: 'dialogue',
    scene: 'kitchen_night',
    act: 1,
    timeOfDay: 'night',
    speaker: 'Внутренний голос',
    text:
      'Стойка стихла — на секунду город перестал орать в Kibana. Дрель снова ударила.\n\n' +
      '**Альберт** — живой сосед, не тикет. **Александр** — зелёный статус в Slack. Третий путь — выключить звук и лечь.',
    choices: [
      {
        text: 'Спуститься к Альберту',
        next: 'vs_arcade_drill_qte',
        effect: { stress: -2 },
      },
      {
        text: 'Ответить Александру в чате',
        next: 'vs_arcade_chat_spam',
        effect: { stress: 3 },
      },
      {
        text: 'Выключить звук и лечь',
        next: 'vs_end_cold',
        effect: { stress: 5, stability: -3 },
      },
    ],
  },

  vs_arcade_drill_qte: {
    id: 'vs_arcade_drill_qte',
    type: 'minigame',
    scene: 'kitchen_night',
    act: 1,
    timeOfDay: 'night',
    text: 'Лестница. Дрель снова. Поймай паузу — не крик, а договорённость.',
    minigame: {
      type: 'drill_qte',
      difficulty: 2,
      successThreshold: 2,
      successNext: 'vs_slice_albert_beat',
      failNext: 'vs_end_cold',
      successEffect: { stress: -4, setFlag: 'vs_drill_qte_ok' },
      failEffect: { stress: 6 },
    },
  },

  vs_slice_albert_beat: {
    id: 'vs_slice_albert_beat',
    type: 'dialogue',
    scene: 'kitchen_night',
    act: 1,
    timeOfDay: 'night',
    speaker: 'Альберт',
    text: '«Я поговорю с бригадой. Ты не доносчик — ты сосед, которому нужен сон.»',
    autoNext: 'vs_end_warm',
  },

  vs_arcade_chat_spam: {
    id: 'vs_arcade_chat_spam',
    type: 'minigame',
    scene: 'kitchen_night',
    act: 1,
    timeOfDay: 'night',
    text: 'Slack орёт. Не бери ночную смену — выбери границу быстрее таймера.',
    minigame: {
      type: 'chat_spam',
      difficulty: 2,
      successThreshold: 2,
      successNext: 'vs_arcade_incident',
      failNext: 'vs_end_cold',
      successEffect: { stress: 2 },
      failEffect: { stress: 8, stability: -4 },
    },
  },

  vs_arcade_incident: {
    id: 'vs_arcade_incident',
    type: 'minigame',
    scene: 'battle',
    act: 1,
    timeOfDay: 'night',
    text: 'Инцидент размножился в shard-целях. Сними волну — и вернись на кухню.',
    minigame: {
      type: 'battle_shards',
      difficulty: 2,
      successThreshold: 1,
      successNext: 'vs_end_cold',
      failNext: 'vs_end_cold',
      successEffect: { stress: 4, skillGains: { logic: 1 } },
    },
  },

  vs_end_warm: {
    id: 'vs_end_warm',
    type: 'narration',
    scene: 'kitchen_night',
    act: 1,
    timeOfDay: 'night',
    text:
      'Дрель стихает. Ты сказал «стоп» там, где можно было промолчать — и это не делает тебя плохим сотрудником.',
    effect: { mood: 8, karma: 5, setFlag: 'vs_slice_outcome_warm' },
    autoNext: 'vs_slice_outro',
  },

  vs_end_cold: {
    id: 'vs_end_cold',
    type: 'narration',
    scene: 'kitchen_night',
    act: 1,
    timeOfDay: 'night',
    text:
      'Ночь не стала твоей: либо смена без оформления, либо тишина-наказание в наушниках. Утром — тот же чат, только краснее.',
    effect: { stress: 5, selfEsteem: -4, setFlag: 'vs_slice_outcome_cold' },
    autoNext: 'vs_slice_outro',
  },

  vs_slice_outro: {
    id: 'vs_slice_outro',
    type: 'narration',
    scene: 'kitchen_night',
    act: 1,
    timeOfDay: 'night',
    text:
      '**Демо завершено.** Это одна ночь из жизни Володьки — стойка, подъезд, чат.\n\n' +
      'Ниже — полная история: офис, «Синяя Яма», акты 2–3 и финал «Создатель».',
    choices: [
      {
        text: 'Начать полную историю (офис, акт 1)',
        next: 'start',
        effect: { mood: 2 },
      },
      {
        text: 'Ещё раз демо',
        next: 'vs_slice_intro',
        effect: { mood: 1 },
      },
    ],
  },
};
