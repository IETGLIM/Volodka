import type { BuffEffect } from '@/engine/combat/types';

/** Exploration/combat consumer metadata for poem-power TTL flags. */
export interface PoemTTLConsumerMeta {
  flagKey: string;
  icon: string;
  color: string;
  /** Short HUD label when poem power name is unavailable. */
  fallbackLabel: string;
  /** Player-facing effect summary for tooltips. */
  effectSummary: string;
  /** Halve incoming positive stress while live (stone_skin). */
  stressIncomingMultiplier?: number;
  /** Reveal trigger zones gated by this flag (child_gaze). */
  revealsHiddenZones?: boolean;
  /** Opening combat buff when encounter starts from exploration. */
  combatBridge?: {
    name: string;
    source: string;
    kind: 'buff' | 'debuff';
    target: 'player' | 'enemy';
    duration: number;
    effect: BuffEffect;
    logText: string;
  };
}

export const POEM_TTL_CONSUMERS: Record<string, PoemTTLConsumerMeta> = {
  truth_voice_active: {
    flagKey: 'truth_voice_active',
    icon: '✦',
    color: '#a8e6ff',
    fallbackLabel: 'Правда Глас',
    effectSummary: 'Следующая проверка убеждения проходит автоматически.',
    combatBridge: {
      name: 'Правда Глас',
      source: 'explore_truth_voice',
      kind: 'debuff',
      target: 'enemy',
      duration: 1,
      effect: { type: 'defense_reduction', value: 0.35 },
      logText: '✦ Эхо «Правды Глас» обнажает слабость врага!',
    },
  },
  guiding_star_active: {
    flagKey: 'guiding_star_active',
    icon: '⭐',
    color: '#ffd866',
    fallbackLabel: 'Путеводная Звезда',
    effectSummary: 'Скрытые пути и ослабленное зрение крипов.',
  },
  storm_wind_active: {
    flagKey: 'storm_wind_active',
    icon: '🌪',
    color: '#ff8c42',
    fallbackLabel: 'Штормовой Ветер',
    effectSummary: '+5 к интуиции и логике.',
    combatBridge: {
      name: 'Штормовой Ветер',
      source: 'explore_storm_wind',
      kind: 'buff',
      target: 'player',
      duration: 2,
      effect: { type: 'attack_boost', value: 5 },
      logText: '🌪 Штормовой ветер несёт ярость в бой!',
    },
  },
  word_power_active: {
    flagKey: 'word_power_active',
    icon: '📜',
    color: '#f0c878',
    fallbackLabel: 'Слово Мощь',
    effectSummary: '+4 к письму и убеждению.',
  },
  child_gaze_active: {
    flagKey: 'child_gaze_active',
    icon: '👁',
    color: '#b8f0ff',
    fallbackLabel: 'Детский Взгляд',
    effectSummary: 'Раскрывает скрытые стихи в локации.',
    revealsHiddenZones: true,
  },
  breakthrough_active: {
    flagKey: 'breakthrough_active',
    icon: '⚡',
    color: '#66ffcc',
    fallbackLabel: 'Прорыв',
    effectSummary: 'Следующая проверка кодинга проходит автоматически.',
    combatBridge: {
      name: 'Прорыв',
      source: 'explore_breakthrough',
      kind: 'buff',
      target: 'player',
      duration: 1,
      effect: { type: 'attack_boost', value: 6 },
      logText: '⚡ Эхо «Прорыва» заряжает первый удар!',
    },
  },
  jester_word_active: {
    flagKey: 'jester_word_active',
    icon: '🃏',
    color: '#e8a0ff',
    fallbackLabel: 'Шутово Слово',
    effectSummary: 'Враги теряют уверенность.',
    combatBridge: {
      name: 'Шутово Слово',
      source: 'explore_jester_word',
      kind: 'debuff',
      target: 'enemy',
      duration: 2,
      effect: { type: 'defense_reduction', value: 0.25 },
      logText: '🃏 Шутово слово сбивает врага с толку!',
    },
  },
  stone_skin_active: {
    flagKey: 'stone_skin_active',
    icon: '🛡',
    color: '#64a0ff',
    fallbackLabel: 'Каменная Кожа',
    effectSummary: 'Входящий стресс снижен на 50%.',
    stressIncomingMultiplier: 0.5,
    combatBridge: {
      name: 'Каменная Кожа',
      source: 'explore_stone_skin',
      kind: 'buff',
      target: 'player',
      duration: 2,
      effect: { type: 'damage_reduction', value: 0.5 },
      logText: '🛡 Каменная кожа переносится в бой!',
    },
  },
  city_voice_active: {
    flagKey: 'city_voice_active',
    icon: '🌆',
    color: '#c4b5fd',
    fallbackLabel: 'Голос Улиц',
    effectSummary: 'Шёпот города подсказывает квесты.',
  },
  star_path_active: {
    flagKey: 'star_path_active',
    icon: '🌠',
    color: '#fde68a',
    fallbackLabel: 'Звездный Путь',
    effectSummary: 'Путеводная звезда ведёт к цели.',
  },
  deep_thought_active: {
    flagKey: 'deep_thought_active',
    icon: '🧠',
    color: '#93c5fd',
    fallbackLabel: 'Глубокое Размышление',
    effectSummary: '+5 к письму и логике.',
  },
  ironic_whisper_active: {
    flagKey: 'ironic_whisper_active',
    icon: '😏',
    color: '#f9a8d4',
    fallbackLabel: 'Ироничный Шёпот',
    effectSummary: 'Скрытые смыслы в диалогах.',
  },
};

export function getPoemTTLConsumer(flagKey: string): PoemTTLConsumerMeta | undefined {
  return POEM_TTL_CONSUMERS[flagKey];
}
