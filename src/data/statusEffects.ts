/* ─── Volodka RPG – Status Effect Definitions ─── */
/* Defines all status effects (buffs, debuffs, weather, perk-based)
 * that can appear on the HUD's status effects bar.
 *
 * IMPORTANT: This module is PRESENTATION-ONLY. The entries below describe
 * the player's current derived state for HUD display — they are NOT active
 * gameplay modifiers. The actual mechanical effects live in their respective
 * systems:
 *   - Perk bonuses (night_vision, iron_stomach, counter_strike, poetic_trance):
 *     applied via src/shared/perks/perkModifiers.ts.
 *   - Weather modifiers (rain/snow/fog/storm): applied via
 *     src/data/weatherEffects.ts + src/shared/weather/deriveSceneWeather.ts.
 *   - Vital penalties (exhausted, stressed): applied via combat formulas
 *     (maxHp = energy × 2, stress gates for code_rage / combat_meditation)
 *     and stress_resist perk modifiers.
 *
 * If you add a new status effect here, wire up its mechanical effect in the
 * appropriate system — otherwise the description will mislead players. */

/* ─── Types ─── */

export type StatusEffectType =
  // Buffs
  | 'energy_boost'
  | 'karma_boost'
  | 'skill_boost'
  | 'combat_advantage'
  | 'speed_boost'
  | 'perception_boost'
  // Debuffs
  | 'exhausted'
  | 'stressed'
  | 'injured'
  | 'confused'
  | 'poisoned'
  | 'slowed'
  // Weather
  | 'rain_debuff'
  | 'snow_debuff'
  | 'fog_debuff'
  | 'storm_debuff'
  // Perk-based
  | 'night_vision'
  | 'iron_stomach'
  | 'counter_strike'
  | 'poetic_trance';

export type StatusEffectCategory = 'buff' | 'debuff' | 'weather' | 'perk';

export interface StatusEffectDef {
  id: StatusEffectType;
  name: string;           // Russian name
  description: string;    // Russian description
  icon: string;           // Emoji icon
  category: StatusEffectCategory;
  color: string;          // CSS color string
  duration?: number;      // Duration in game-hours (optional = permanent while active)
  stackable?: boolean;
  maxStacks?: number;
}

/* ─── Status Effect Definitions ─── */

export const STATUS_EFFECTS: Record<StatusEffectType, StatusEffectDef> = {
  /* ═══ BUFFS ═══ */
  energy_boost: {
    id: 'energy_boost',
    name: 'Прилив сил',
    description: 'Энергия восстанавливается быстрее. Поставленный чай и хороший сон.',
    icon: '⚡',
    category: 'buff',
    color: '#34d399', // emerald
    duration: 3,
    stackable: true,
    maxStacks: 3,
  },
  karma_boost: {
    id: 'karma_boost',
    name: 'Светлая полоса',
    description: 'Карма растёт быстрее. Мир отвечает добром на добро.',
    icon: '✨',
    category: 'buff',
    color: 'var(--cyber-cyan)', // cyan
    duration: 4,
  },
  skill_boost: {
    id: 'skill_boost',
    name: 'Прозрение',
    description: 'Навыки временно усилены. Муза шепчет решение.',
    icon: '🧠',
    category: 'buff',
    color: '#a78bfa', // violet
    duration: 2,
  },
  combat_advantage: {
    id: 'combat_advantage',
    name: 'Перехват',
    description: 'Преимущество в бою. Враг не готов к твоей атаке.',
    icon: '⚔️',
    category: 'buff',
    color: '#f87171', // red
    duration: 2,
  },
  speed_boost: {
    id: 'speed_boost',
    name: 'Ускорение',
    description: 'Скорость передвижения увеличена. Город мелькает за окном.',
    icon: '💨',
    category: 'buff',
    color: '#fbbf24', // amber
    duration: 3,
  },
  perception_boost: {
    id: 'perception_boost',
    name: 'Обострение',
    description: 'Восприятие мира усилено. Ты замечаешь то, что другие не видят.',
    icon: '👁️',
    category: 'buff',
    color: 'var(--cyber-cyan)', // cyan
    duration: 2,
  },

  /* ═══ DEBUFFS ═══ */
  exhausted: {
    id: 'exhausted',
    name: 'Истощение',
    description: 'Энергия ниже 25. Макс. здоровье (энергия × 2) снижено.',
    icon: '😩',
    category: 'debuff',
    color: '#6b7280', // gray
  },
  stressed: {
    id: 'stressed',
    name: 'Стресс',
    description: 'Стресс выше 70. В бою открывается бонус «Ярость кода». При стрессе выше 80 — штраф к защите (-2).',
    icon: '😰',
    category: 'debuff',
    color: '#f87171', // red
  },
  injured: {
    id: 'injured',
    name: 'Рана',
    description: 'Получен урон. Действия замедлены, боль отвлекает.',
    icon: '🩸',
    category: 'debuff',
    color: '#ef4444', // red-500
    duration: 5,
  },
  confused: {
    id: 'confused',
    name: 'Замешательство',
    description: 'Разум затуманен. Выборы даются тяжелее.',
    icon: '😵‍💫',
    category: 'debuff',
    color: '#a78bfa', // violet
    duration: 3,
  },
  poisoned: {
    id: 'poisoned',
    name: 'Отравление',
    description: 'Токсины в крови. Энергия медленно убывает.',
    icon: '🤢',
    category: 'debuff',
    color: '#84cc16', // lime
    duration: 4,
    stackable: true,
    maxStacks: 3,
  },
  slowed: {
    id: 'slowed',
    name: 'Замедление',
    description: 'Передвижение замедлено. Тяжесть в ногах.',
    icon: '🐌',
    category: 'debuff',
    color: '#94a3b8', // slate
    duration: 3,
  },

  /* ═══ WEATHER ═══ */
  rain_debuff: {
    id: 'rain_debuff',
    name: 'Дождь',
    description: 'Дождь. Энергия убывает, но эмпатия и письмо растут.',
    icon: '🌧️',
    category: 'weather',
    color: '#5588bb',
  },
  snow_debuff: {
    id: 'snow_debuff',
    name: 'Снегопад',
    description: 'Снегопад. Город замедляется, интуиция обостряется.',
    icon: '❄️',
    category: 'weather',
    color: '#c8d8f0',
  },
  fog_debuff: {
    id: 'fog_debuff',
    name: 'Туман',
    description: 'Туман. Видимость почти нулевая, интуиция усиливается.',
    icon: '🌫️',
    category: 'weather',
    color: '#a0a8b8',
  },
  storm_debuff: {
    id: 'storm_debuff',
    name: 'Гроза',
    description: 'Гроза. Энергия убывает быстро, стресс растёт. Код пишется лучше.',
    icon: '⛈️',
    category: 'weather',
    color: '#cc4444',
  },

  /* ═══ PERK-BASED ═══ */
  night_vision: {
    id: 'night_vision',
    name: 'Ночное зрение',
    description: 'Активна способность «Ночной дозор»: ночью макс. энергии повышен.',
    icon: '🌙',
    category: 'perk',
    color: '#34d399', // emerald
  },
  iron_stomach: {
    id: 'iron_stomach',
    name: 'Желудок стали',
    description: 'Активна способность «Желудок стали»: входящий стресс снижен.',
    icon: '🛡️',
    category: 'perk',
    color: '#34d399', // emerald
  },
  counter_strike: {
    id: 'counter_strike',
    name: 'Контратака',
    description: 'Активна способность «Контратака»: шанс контрудара при защите.',
    icon: '↩️',
    category: 'perk',
    color: '#f87171', // red
  },
  poetic_trance: {
    id: 'poetic_trance',
    name: 'Поэтический транс',
    description: 'Активна способность «Поэтический транс»: бонус интуиции при стихах.',
    icon: '🎭',
    category: 'perk',
    color: '#fbbf24', // amber
  },
};

/* ─── Helper ─── */

/** Get a status effect definition by its ID. */
export function getStatusEffectById(id: StatusEffectType): StatusEffectDef {
  return STATUS_EFFECTS[id];
}
