/* ─── Volodka RPG – Achievement Definitions ─── */

import type { StoryEffect } from '@/shared/types/game';

/* ─── Types ─── */

export type AchievementCategory = 'story' | 'combat' | 'exploration' | 'poetry' | 'social' | 'hidden';

export interface AchievementReward {
  type: 'xp' | 'karma' | 'skill' | 'credits' | 'flag';
  value?: number;
  skill?: string;
  flag?: string;
  flagValue?: boolean;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  /** If true, title/description are hidden until unlocked */
  hidden: boolean;
  /** Player-facing hint for unlock condition */
  conditionDescription: string;
  /** Rewards granted on unlock */
  rewards: AchievementReward[];
}

/* ─── Category metadata ─── */

export const CATEGORY_META: Record<AchievementCategory, { label: string; icon: string; color: string }> = {
  story: { label: 'Сюжет', icon: '📖', color: '#a78bfa' },
  combat: { label: 'Бой', icon: '⚔️', color: '#f87171' },
  exploration: { label: 'Исследование', icon: '🧭', color: '#34d399' },
  poetry: { label: 'Поэзия', icon: '📜', color: '#fbbf24' },
  social: { label: 'Социальные', icon: '🤝', color: '#60a5fa' },
  hidden: { label: 'Секретные', icon: '🔮', color: '#c084fc' },
};

export const CATEGORY_ORDER: AchievementCategory[] = ['story', 'combat', 'exploration', 'poetry', 'social', 'hidden'];

/* ─── Achievement Definitions (25+) ─── */

export const ACHIEVEMENTS: AchievementDefinition[] = [
  /* ═══════════════════════════════════════════
     STORY ACHIEVEMENTS
     ═══════════════════════════════════════════ */

  {
    id: 'story_first_awakening',
    title: 'Первое пробуждение',
    description: 'Начать игру и выйти из вступления',
    icon: '🌅',
    category: 'story',
    hidden: false,
    conditionDescription: 'Пройдите вступление',
    rewards: [{ type: 'xp', value: 10 }],
  },
  {
    id: 'story_guild_shadow',
    title: 'Тень Гильдии',
    description: 'Посетить офис IT-Гильдии',
    icon: '🏢',
    category: 'story',
    hidden: false,
    conditionDescription: 'Посетите офис Гильдии',
    rewards: [{ type: 'xp', value: 25 }],
  },
  {
    id: 'story_meet_victoria',
    title: 'Встреча с Викторией',
    description: 'Встретить загадочную Викторию на улице',
    icon: '👤',
    category: 'story',
    hidden: false,
    conditionDescription: 'Встретьте Викторию на улице ночью',
    rewards: [{ type: 'karma', value: 5 }],
  },
  {
    id: 'story_save_zarema',
    title: 'Выбор сердца',
    description: 'Спасти Зарему из лап Гильдии',
    icon: '❤️',
    category: 'story',
    hidden: false,
    conditionDescription: 'Спасите Зарему из задержания',
    rewards: [{ type: 'karma', value: 15 }, { type: 'xp', value: 50 }],
  },
  {
    id: 'story_poetry_broadcast',
    title: 'Голос города',
    description: 'Завершить поэтическую трансляцию на весь город',
    icon: '📡',
    category: 'story',
    hidden: false,
    conditionDescription: 'Передайте стихи в эфир',
    rewards: [{ type: 'xp', value: 100 }, { type: 'karma', value: 20 }],
  },
  {
    id: 'story_living_code',
    title: 'Живой код',
    description: 'Узнать, что Виктория — ИИ',
    icon: '🤖',
    category: 'story',
    hidden: true,
    conditionDescription: '???',
    rewards: [{ type: 'xp', value: 50 }],
  },
  {
    id: 'story_dawn',
    title: 'Рассвет',
    description: 'Достичь любой концовки',
    icon: '☀️',
    category: 'story',
    hidden: false,
    conditionDescription: 'Достигните концовки игры',
    rewards: [{ type: 'xp', value: 200 }],
  },

  /* ═══════════════════════════════════════════
     COMBAT ACHIEVEMENTS
     ═══════════════════════════════════════════ */

  {
    id: 'combat_first_blood',
    title: 'Первая кровь',
    description: 'Выиграть свой первый бой',
    icon: '⚔️',
    category: 'combat',
    hidden: false,
    conditionDescription: 'Победите в первом бою',
    rewards: [{ type: 'xp', value: 15 }],
  },
  {
    id: 'combat_combo_master',
    title: 'Комбо-мастер',
    description: 'Достичь комбо 3x в бою',
    icon: '🔥',
    category: 'combat',
    hidden: false,
    conditionDescription: 'Набейте комбо 3x в одном бою',
    rewards: [{ type: 'xp', value: 25 }],
  },
  {
    id: 'combat_critical_hit',
    title: 'Критический удар',
    description: 'Нанести критический удар',
    icon: '💥',
    category: 'combat',
    hidden: false,
    conditionDescription: 'Нанесите критический удар в бою',
    rewards: [{ type: 'xp', value: 15 }],
  },
  {
    id: 'combat_invincible',
    title: 'Непобедимый',
    description: 'Выиграть 5 боёв подряд без поражений',
    icon: '🛡️',
    category: 'combat',
    hidden: false,
    conditionDescription: 'Победите в 5 боях без поражений',
    rewards: [{ type: 'xp', value: 50 }, { type: 'karma', value: 5 }],
  },
  {
    id: 'combat_demon_hunter',
    title: 'Охотник на демонов',
    description: 'Победить все типы врагов в игре',
    icon: '👹',
    category: 'combat',
    hidden: false,
    conditionDescription: 'Победите по одному врагу каждого типа',
    rewards: [{ type: 'xp', value: 100 }],
  },

  /* ═══════════════════════════════════════════
     EXPLORATION ACHIEVEMENTS
     ═══════════════════════════════════════════ */

  {
    id: 'explorer_explorer',
    title: 'Исследователь',
    description: 'Посетить 5 разных сцен',
    icon: '🧭',
    category: 'exploration',
    hidden: false,
    conditionDescription: 'Посетите 5 различных локаций',
    rewards: [{ type: 'xp', value: 20 }],
  },
  {
    id: 'explorer_wanderer',
    title: 'Странник',
    description: 'Посетить все сцены в игре',
    icon: '🗺️',
    category: 'exploration',
    hidden: false,
    conditionDescription: 'Посетите все локации в игре',
    rewards: [{ type: 'xp', value: 75 }, { type: 'karma', value: 10 }],
  },
  {
    id: 'explorer_night_owl',
    title: 'Ночная сова',
    description: 'Провести 2+ часа игрового ночного времени',
    icon: '🦉',
    category: 'exploration',
    hidden: false,
    conditionDescription: 'Находитесь в игре в ночное время',
    rewards: [{ type: 'xp', value: 15 }],
  },
  {
    id: 'explorer_rooftops',
    title: 'Крыши города',
    description: 'Открыть сцену на крыше',
    icon: '🏗️',
    category: 'exploration',
    hidden: false,
    conditionDescription: 'Доберитесь до крыши',
    rewards: [{ type: 'xp', value: 30 }],
  },

  /* ═══════════════════════════════════════════
     POETRY ACHIEVEMENTS
     ═══════════════════════════════════════════ */

  {
    id: 'poetry_first_verse',
    title: 'Первый стих',
    description: 'Собрать первое стихотворение',
    icon: '📜',
    category: 'poetry',
    hidden: false,
    conditionDescription: 'Соберите 1 стихотворение',
    rewards: [{ type: 'xp', value: 10 }, { type: 'skill', skill: 'writing', value: 1 }],
  },
  {
    id: 'poetry_rhyme_collector',
    title: 'Собиратель рифм',
    description: 'Собрать 10 стихотворений',
    icon: '📚',
    category: 'poetry',
    hidden: false,
    conditionDescription: 'Соберите 10 стихотворений',
    rewards: [{ type: 'xp', value: 40 }, { type: 'skill', skill: 'writing', value: 2 }],
  },
  {
    id: 'poetry_word_keeper',
    title: 'Хранитель слова',
    description: 'Собрать все стихотворения',
    icon: '✨',
    category: 'poetry',
    hidden: false,
    conditionDescription: 'Соберите все стихотворения',
    rewards: [{ type: 'xp', value: 100 }, { type: 'karma', value: 20 }],
  },
  {
    id: 'poetry_power_verse',
    title: 'Сила стиха',
    description: 'Использовать силу стихотворения в бою',
    icon: '⚡',
    category: 'poetry',
    hidden: false,
    conditionDescription: 'Активируйте силу стиха в бою',
    rewards: [{ type: 'xp', value: 20 }],
  },

  /* ═══════════════════════════════════════════
     SOCIAL ACHIEVEMENTS
     ═══════════════════════════════════════════ */

  {
    id: 'social_zarema_friend',
    title: 'Друг Заремы',
    description: 'Достичь отношения 80+ с Заремой',
    icon: '🤝',
    category: 'social',
    hidden: false,
    conditionDescription: 'Поднимите отношения с Заремой до 80+',
    rewards: [{ type: 'xp', value: 30 }, { type: 'karma', value: 5 }],
  },
  {
    id: 'social_network_ally',
    title: 'Союзник Сети',
    description: 'Стать членом подпольной Сети',
    icon: '🌐',
    category: 'social',
    hidden: false,
    conditionDescription: 'Пройдите посвящение в Сеть',
    rewards: [{ type: 'xp', value: 40 }, { type: 'karma', value: 8 }],
  },
  {
    id: 'social_negotiator',
    title: 'Мастер переговоров',
    description: 'Достичь отношения 80+ с 3 NPC',
    icon: '🗣️',
    category: 'social',
    hidden: false,
    conditionDescription: 'Поднимите отношения до 80+ с тремя персонажами',
    rewards: [{ type: 'xp', value: 60 }, { type: 'skill', skill: 'persuasion', value: 3 }],
  },

  /* ═══════════════════════════════════════════
     HIDDEN ACHIEVEMENTS
     ═══════════════════════════════════════════ */

  {
    id: 'hidden_between_lines',
    title: 'Между строк',
    description: 'Найти секретную пасхалку',
    icon: '🔮',
    category: 'hidden',
    hidden: true,
    conditionDescription: '???',
    rewards: [{ type: 'xp', value: 50 }, { type: 'credits', value: 50 }],
  },
  {
    id: 'hidden_sacrifice',
    title: 'Жертва',
    description: 'Открыть концовку «Жертва»',
    icon: '🕊️',
    category: 'hidden',
    hidden: true,
    conditionDescription: '???',
    rewards: [{ type: 'xp', value: 100 }, { type: 'karma', value: 30 }],
  },
  {
    id: 'hidden_all_achievements',
    title: 'Полное собрание',
    description: 'Открыть все остальные достижения',
    icon: '🏆',
    category: 'hidden',
    hidden: true,
    conditionDescription: '???',
    rewards: [{ type: 'xp', value: 200 }, { type: 'flag', flag: 'all_achievements', flagValue: true }],
  },
];

/** Quick lookup map by id */
export const ACHIEVEMENT_MAP: Record<string, AchievementDefinition> = {};
for (const a of ACHIEVEMENTS) {
  ACHIEVEMENT_MAP[a.id] = a;
}

/** Total achievement count */
export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length;
