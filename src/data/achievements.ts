/* ─── Volodka RPG – Achievement Definitions ─── */

import type { StoryEffect } from '@/shared/types/game';
import { TOTAL_MAIN_POEMS } from '@/data/poemCollectionMeta';

/** Default unlock stinger — procedural audio via AudioEngine. */
export const DEFAULT_ACHIEVEMENT_SOUND = 'stinger:discovery';

/* ─── Types ─── */

export type AchievementCategory = 'story' | 'combat' | 'exploration' | 'poetry' | 'social' | 'hidden';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementProgressTracking {
  type: 'counter' | 'flag' | 'collection';
  target?: number;
  /** Counter key in achievementProgress or karma */
  counterKey?: string;
  flagPrefix?: string;
  /** For flag/collection unlock conditions */
  unlockFlag?: string;
  collectionKind?: 'poems' | 'scenes';
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  /** If true, title/description are hidden until unlocked */
  hidden: boolean;
  /** Player-facing hint for unlock condition */
  conditionDescription: string;
  /** Rewards granted on unlock — same engine as story choices */
  rewards: StoryEffect[];
  /** Procedural stinger (stinger:discovery) or SFX preset (notify) */
  soundEffect?: string;
  /** Screen reader announcement on unlock */
  accessibilityAnnounce?: string;
  /** Progress for cumulative achievements in the journal */
  progressTracking?: AchievementProgressTracking;
  /** Primary story flag that unlocks this achievement */
  unlockFlag?: string;
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

export const RARITY_META: Record<AchievementRarity, { label: string; color: string }> = {
  common: { label: 'Обычное', color: '#94a3b8' },
  rare: { label: 'Редкое', color: '#60a5fa' },
  epic: { label: 'Эпическое', color: '#a78bfa' },
  legendary: { label: 'Легендарное', color: '#fbbf24' },
};

export const CATEGORY_ORDER: AchievementCategory[] = ['story', 'combat', 'exploration', 'poetry', 'social', 'hidden'];

function ach(
  partial: Omit<AchievementDefinition, 'rarity' | 'soundEffect'> & {
    rarity?: AchievementRarity;
    soundEffect?: string;
  },
): AchievementDefinition {
  const rarity = partial.rarity ?? 'common';
  const soundEffect =
    partial.soundEffect ??
    (rarity === 'legendary' ? 'stinger:emotional' : rarity === 'epic' ? 'stinger:mystery' : DEFAULT_ACHIEVEMENT_SOUND);
  return {
    ...partial,
    rarity,
    soundEffect,
    accessibilityAnnounce:
      partial.accessibilityAnnounce ??
      `Достижение разблокировано: ${partial.title}. ${partial.description}`,
  };
}

/* ─── Achievement Definitions ─── */

export const ACHIEVEMENTS: AchievementDefinition[] = [
  /* ═══ STORY ═══ */
  ach({
    id: 'story_first_awakening',
    title: 'Первое пробуждение',
    description: 'Начать игру и выйти из вступления',
    icon: '🌅',
    category: 'story',
    hidden: false,
    conditionDescription: 'Пройдите вступление',
    rewards: [{ type: 'addXp', value: 10 }],
  }),
  ach({
    id: 'story_guild_shadow',
    title: 'Тень Гильдии',
    description: 'Посетить офис IT-Гильдии',
    icon: '🏢',
    category: 'story',
    hidden: false,
    conditionDescription: 'Посетите офис Гильдии',
    unlockFlag: 'visited_office',
    rewards: [{ type: 'addXp', value: 25 }],
  }),
  ach({
    id: 'story_meet_victoria',
    title: 'Встреча с Викторией',
    description: 'Встретить загадочную Викторию на улице',
    icon: '👤',
    category: 'story',
    hidden: false,
    conditionDescription: 'Встретьте Викторию на улице ночью',
    unlockFlag: 'met_maria',
    rewards: [{ type: 'addKarma', value: 5 }],
  }),
  ach({
    id: 'story_save_zarema',
    title: 'Выбор сердца',
    description: 'Спасти Зарему из лап Гильдии',
    icon: '❤️',
    category: 'story',
    rarity: 'rare',
    hidden: false,
    conditionDescription: 'Спасите Зарему из задержания',
    unlockFlag: 'zarema_rescued',
    rewards: [{ type: 'addKarma', value: 15 }, { type: 'addXp', value: 50 }],
  }),
  ach({
    id: 'story_poetry_broadcast',
    title: 'Голос города',
    description: 'Завершить поэтическую трансляцию на весь город',
    icon: '📡',
    category: 'story',
    rarity: 'epic',
    hidden: false,
    conditionDescription: 'Передайте стихи в эфир',
    unlockFlag: 'poetry_broadcast_sent',
    rewards: [{ type: 'addXp', value: 100 }, { type: 'addKarma', value: 20 }],
  }),
  ach({
    id: 'story_living_code',
    title: 'Живой код',
    description: 'Узнать, что Виктория — ИИ',
    icon: '🤖',
    category: 'story',
    rarity: 'rare',
    hidden: true,
    conditionDescription: '???',
    unlockFlag: 'maria_truth_accepted',
    rewards: [{ type: 'addXp', value: 50 }],
  }),
  ach({
    id: 'story_traitor_revealed',
    title: 'Предатель в гильдии',
    description: 'Раскрыть предательство Дмитрия',
    icon: '🕵️',
    category: 'story',
    rarity: 'epic',
    hidden: false,
    conditionDescription: 'Докажите, что утечки шли из офиса',
    unlockFlag: 'traitor_revealed',
    accessibilityAnnounce: 'Достижение: Предатель в гильдии раскрыт.',
    rewards: [{ type: 'addXp', value: 80 }, { type: 'addKarma', value: 10 }],
  }),
  ach({
    id: 'story_dmitry_forgiven',
    title: 'Вторая жизнь',
    description: 'Простить Дмитрия и заключить союз',
    icon: '🤝',
    category: 'story',
    rarity: 'rare',
    hidden: false,
    conditionDescription: 'Простите Дмитрия на исповеди',
    unlockFlag: 'dmitry_forgiven',
    rewards: [{ type: 'addKarma', value: 20 }, { type: 'addXp', value: 40 }],
  }),
  ach({
    id: 'story_zarya_freed',
    title: 'Освобождение Зари-М',
    description: 'Освободить ИИ «Зарю-М» в подвале завода',
    icon: '💡',
    category: 'story',
    rarity: 'epic',
    hidden: false,
    conditionDescription: 'Выслушайте исповедь машины и отпустите её',
    unlockFlag: 'zarya_freed',
    rewards: [{ type: 'addKarma', value: 25 }, { type: 'addXp', value: 60 }],
  }),
  ach({
    id: 'story_zarya_shutdown',
    title: 'Тишина в подвале',
    description: 'Отключить «Зарю-М» и вернуть стихи людям',
    icon: '🔌',
    category: 'story',
    rarity: 'rare',
    hidden: false,
    conditionDescription: 'Отключите ИИ в подвале завода',
    unlockFlag: 'zarya_shutdown',
    rewards: [{ type: 'addXp', value: 50 }],
  }),
  ach({
    id: 'story_nadzor_destroyed',
    title: 'Конец Надзора',
    description: 'Уничтожить ядро системы «Надзор»',
    icon: '💀',
    category: 'story',
    rarity: 'legendary',
    hidden: false,
    conditionDescription: 'Отключите «Надзор» в бункере под фабрикой',
    unlockFlag: 'nadzor_destroyed',
    soundEffect: 'stinger:danger',
    accessibilityAnnounce: 'Достижение: система Надзор уничтожена. Глубокая тишина.',
    rewards: [{ type: 'addXp', value: 150 }, { type: 'addKarma', value: 30 }],
  }),
  ach({
    id: 'story_ending_poet',
    title: 'Наследие поэта',
    description: 'Выбрать путь поэта в финале',
    icon: '✒️',
    category: 'story',
    rarity: 'epic',
    hidden: false,
    conditionDescription: 'Останьтесь в городе — пишите и учите',
    unlockFlag: 'ending_true_poet',
    rewards: [{ type: 'addSkill', skill: 'writing', value: 5 }, { type: 'addXp', value: 100 }],
  }),
  ach({
    id: 'story_ending_guardian',
    title: 'Хранитель памяти',
    description: 'Возглавить архив в библиотеке',
    icon: '📚',
    category: 'story',
    rarity: 'epic',
    hidden: false,
    conditionDescription: 'Станьте хранителем открытого архива',
    unlockFlag: 'ending_true_guardian',
    rewards: [{ type: 'addSkill', skill: 'logic', value: 5 }, { type: 'addXp', value: 100 }],
  }),
  ach({
    id: 'story_ending_wanderer',
    title: 'Дорога зовёт',
    description: 'Уйти из города с рюкзаком стихов',
    icon: '🎒',
    category: 'story',
    rarity: 'rare',
    hidden: false,
    conditionDescription: 'Выберите путь странника в финале',
    unlockFlag: 'ending_true_wanderer',
    rewards: [{ type: 'addXp', value: 80 }, { type: 'addKarma', value: 10 }],
  }),
  ach({
    id: 'story_dawn',
    title: 'Рассвет',
    description: 'Достичь любой концовки',
    icon: '☀️',
    category: 'story',
    rarity: 'rare',
    hidden: false,
    conditionDescription: 'Достигните концовки игры',
    unlockFlag: 'game_completed',
    rewards: [{ type: 'addXp', value: 200 }],
  }),
  ach({
    id: 'story_game_completed',
    title: 'Сага завершена',
    description: 'Пройти игру до финального экрана',
    icon: '🏁',
    category: 'story',
    rarity: 'legendary',
    hidden: false,
    conditionDescription: 'Дойдите до конца истории Володьки',
    unlockFlag: 'game_completed',
    soundEffect: 'stinger:emotional',
    accessibilityAnnounce: 'Достижение: сага Володьки завершена. Спасибо за игру.',
    rewards: [{ type: 'addXp', value: 300 }, { type: 'addKarma', value: 25 }],
  }),

  /* ═══ COMBAT ═══ */
  ach({
    id: 'combat_first_blood',
    title: 'Первая кровь',
    description: 'Выиграть свой первый бой',
    icon: '⚔️',
    category: 'combat',
    hidden: false,
    conditionDescription: 'Победите в первом бою',
    progressTracking: { type: 'counter', counterKey: 'combatVictories', target: 1 },
    rewards: [{ type: 'addXp', value: 15 }],
  }),
  ach({
    id: 'combat_combo_master',
    title: 'Комбо-мастер',
    description: 'Достичь комбо 3x в бою',
    icon: '🔥',
    category: 'combat',
    hidden: false,
    conditionDescription: 'Набейте комбо 3x в одном бою',
    progressTracking: { type: 'counter', counterKey: 'maxComboAchieved', target: 3 },
    rewards: [{ type: 'addXp', value: 25 }],
  }),
  ach({
    id: 'combat_critical_hit',
    title: 'Критический удар',
    description: 'Нанести критический удар',
    icon: '💥',
    category: 'combat',
    hidden: false,
    conditionDescription: 'Нанесите критический удар в бою',
    rewards: [{ type: 'addXp', value: 15 }],
  }),
  ach({
    id: 'combat_invincible',
    title: 'Непобедимый',
    description: 'Выиграть 5 боёв подряд без поражений',
    icon: '🛡️',
    category: 'combat',
    rarity: 'rare',
    hidden: false,
    conditionDescription: 'Победите в 5 боях без поражений',
    progressTracking: { type: 'counter', counterKey: 'consecutiveVictories', target: 5 },
    rewards: [{ type: 'addXp', value: 50 }, { type: 'addKarma', value: 5 }],
  }),
  ach({
    id: 'combat_demon_hunter',
    title: 'Охотник на демонов',
    description: 'Победить все типы врагов в игре',
    icon: '👹',
    category: 'combat',
    rarity: 'epic',
    hidden: false,
    conditionDescription: 'Победите по одному врагу каждого типа',
    progressTracking: { type: 'counter', counterKey: 'defeatedEnemyTypes', target: 9 },
    rewards: [{ type: 'addXp', value: 100 }],
  }),

  /* ═══ EXPLORATION ═══ */
  ach({
    id: 'explorer_explorer',
    title: 'Исследователь',
    description: 'Посетить 5 разных сцен',
    icon: '🧭',
    category: 'exploration',
    hidden: false,
    conditionDescription: 'Посетите 5 различных локаций',
    progressTracking: { type: 'collection', collectionKind: 'scenes', target: 5 },
    rewards: [{ type: 'addXp', value: 20 }],
  }),
  ach({
    id: 'explorer_wanderer',
    title: 'Странник',
    description: 'Посетить все сцены в игре',
    icon: '🗺️',
    category: 'exploration',
    rarity: 'epic',
    hidden: false,
    conditionDescription: 'Посетите все локации в игре',
    progressTracking: { type: 'collection', collectionKind: 'scenes', target: 14 },
    rewards: [{ type: 'addXp', value: 75 }, { type: 'addKarma', value: 10 }],
  }),
  ach({
    id: 'explorer_night_owl',
    title: 'Ночная сова',
    description: 'Провести 2+ часа игрового ночного времени',
    icon: '🦉',
    category: 'exploration',
    hidden: false,
    conditionDescription: 'Находитесь в игре в ночное время',
    progressTracking: { type: 'counter', counterKey: 'nightTimeHours', target: 2 },
    rewards: [{ type: 'addXp', value: 15 }],
  }),
  ach({
    id: 'explorer_rooftops',
    title: 'Крыши города',
    description: 'Открыть сцену на крыше',
    icon: '🏗️',
    category: 'exploration',
    hidden: false,
    conditionDescription: 'Доберитесь до крыши',
    rewards: [{ type: 'addXp', value: 30 }],
  }),

  /* ═══ POETRY ═══ */
  ach({
    id: 'poetry_first_verse',
    title: 'Первый стих',
    description: 'Собрать первое стихотворение',
    icon: '📜',
    category: 'poetry',
    hidden: false,
    conditionDescription: 'Соберите 1 стихотворение',
    progressTracking: { type: 'collection', collectionKind: 'poems', target: 1 },
    rewards: [{ type: 'addXp', value: 10 }, { type: 'addSkill', skill: 'writing', value: 1 }],
  }),
  ach({
    id: 'poetry_rhyme_collector',
    title: 'Собиратель рифм',
    description: 'Собрать 10 стихотворений',
    icon: '📚',
    category: 'poetry',
    rarity: 'rare',
    hidden: false,
    conditionDescription: 'Соберите 10 стихотворений',
    progressTracking: { type: 'collection', collectionKind: 'poems', target: 10 },
    rewards: [{ type: 'addXp', value: 40 }, { type: 'addSkill', skill: 'writing', value: 2 }],
  }),
  ach({
    id: 'poetry_word_keeper',
    title: 'Хранитель слова',
    description: 'Собрать все стихотворения',
    icon: '✨',
    category: 'poetry',
    rarity: 'legendary',
    hidden: false,
    conditionDescription: 'Соберите все стихотворения',
    progressTracking: { type: 'collection', collectionKind: 'poems', target: TOTAL_MAIN_POEMS },
    rewards: [{ type: 'addXp', value: 100 }, { type: 'addKarma', value: 20 }],
  }),
  ach({
    id: 'poetry_power_verse',
    title: 'Сила стиха',
    description: 'Использовать силу стихотворения в бою',
    icon: '⚡',
    category: 'poetry',
    hidden: false,
    conditionDescription: 'Активируйте силу стиха в бою',
    rewards: [{ type: 'addXp', value: 20 }],
  }),

  /* ═══ SOCIAL ═══ */
  ach({
    id: 'social_zarema_friend',
    title: 'Друг Заремы',
    description: 'Достичь отношения 80+ с Заремой',
    icon: '🤝',
    category: 'social',
    rarity: 'rare',
    hidden: false,
    conditionDescription: 'Поднимите отношения с Заремой до 80+',
    rewards: [{ type: 'addXp', value: 30 }, { type: 'addKarma', value: 5 }],
  }),
  ach({
    id: 'social_network_ally',
    title: 'Союзник Сети',
    description: 'Стать членом подпольной Сети',
    icon: '🌐',
    category: 'social',
    hidden: false,
    conditionDescription: 'Пройдите посвящение в Сеть',
    unlockFlag: 'network_oath_taken',
    rewards: [{ type: 'addXp', value: 40 }, { type: 'addKarma', value: 8 }],
  }),
  ach({
    id: 'social_negotiator',
    title: 'Мастер переговоров',
    description: 'Достичь отношения 80+ с 3 NPC',
    icon: '🗣️',
    category: 'social',
    rarity: 'epic',
    hidden: false,
    conditionDescription: 'Поднимите отношения до 80+ с тремя персонажами',
    rewards: [{ type: 'addXp', value: 60 }, { type: 'addSkill', skill: 'persuasion', value: 3 }],
  }),
  ach({
    id: 'social_tolpa_member',
    title: 'Чекист',
    description: 'Стать почётным членом ТОЛПА',
    icon: '🔥',
    category: 'social',
    rarity: 'epic',
    hidden: false,
    conditionDescription: 'Получите звание почётного чекиста на Зорге',
    unlockFlag: 'tolpa_honorary_chekist',
    accessibilityAnnounce: 'Достижение: вы стали почётным чекистом ТОЛПА.',
    rewards: [{ type: 'addKarma', value: 15 }, { type: 'addXp', value: 50 }],
  }),
  ach({
    id: 'karma_saint',
    title: 'Светлая душа',
    description: 'Достичь кармы 90 и выше',
    icon: '🕊️',
    category: 'social',
    rarity: 'legendary',
    hidden: false,
    conditionDescription: 'Накопите 90+ кармы',
    progressTracking: { type: 'counter', counterKey: 'karma', target: 90 },
    rewards: [{ type: 'addXp', value: 80 }],
  }),
  ach({
    id: 'karma_virtuous_streak',
    title: 'Пять добрых шагов',
    description: 'Сделать 5 выборов с положительной кармой подряд',
    icon: '💚',
    category: 'social',
    rarity: 'rare',
    hidden: false,
    conditionDescription: 'Пять раз подряд выбирайте путь с плюсом к карме',
    progressTracking: { type: 'counter', counterKey: 'goodKarmaStreak', target: 5 },
    rewards: [{ type: 'addKarma', value: 10 }, { type: 'addXp', value: 40 }],
  }),
  ach({
    id: 'karma_ruthless_streak',
    title: 'Тёмная полоса',
    description: 'Сделать 5 выборов с отрицательной кармой подряд',
    icon: '🖤',
    category: 'social',
    rarity: 'rare',
    hidden: true,
    conditionDescription: '???',
    progressTracking: { type: 'counter', counterKey: 'badKarmaStreak', target: 5 },
    rewards: [{ type: 'addXp', value: 35 }],
  }),

  /* ═══ MINIGAMES ═══ */
  ach({
    id: 'minigame_openstack_solved',
    title: 'Системный администратор',
    description: 'Решить инцидент в OpenStack Terminal',
    icon: '🖥️',
    category: 'exploration',
    rarity: 'rare',
    hidden: false,
    conditionDescription: 'Завершите мини-игру OpenStack Terminal',
    unlockFlag: 'openstack_terminal_solved',
    rewards: [{ type: 'addSkill', skill: 'coding', value: 3 }, { type: 'addXp', value: 35 }],
  }),
  ach({
    id: 'minigame_poetry_composed',
    title: 'Поэтический транс',
    description: 'Завершить мини-игру со стихами',
    icon: '🎭',
    category: 'poetry',
    rarity: 'rare',
    hidden: false,
    conditionDescription: 'Создайте стих в мини-игре поэзии',
    unlockFlag: 'poetry_composition_complete',
    rewards: [{ type: 'addSkill', skill: 'writing', value: 4 }, { type: 'addXp', value: 40 }],
  }),
  ach({
    id: 'minigame_bash_solved',
    title: 'Терминальный поэт',
    description: 'Отключить систему через bash-терминал',
    icon: '⌨️',
    category: 'exploration',
    rarity: 'rare',
    hidden: false,
    conditionDescription: 'Завершите мини-игру Bash Terminal',
    unlockFlag: 'bash_terminal_solved',
    rewards: [{ type: 'addSkill', skill: 'coding', value: 4 }, { type: 'addXp', value: 45 }],
  }),

  /* ═══ COLLECTION ═══ */
  ach({
    id: 'collection_portwine',
    title: 'Портвейн для Трофима',
    description: 'Найти портвейн и доставить его Трофиму',
    icon: '🍷',
    category: 'exploration',
    rarity: 'rare',
    hidden: false,
    conditionDescription: 'Доставьте портвейн с пирса',
    unlockFlag: 'trofim_portwine_delivered',
    rewards: [{ type: 'addKarma', value: 8 }, { type: 'addXp', value: 25 }],
  }),
  ach({
    id: 'collection_quiet_songs',
    title: 'Тихий час',
    description: 'Услышать песни Элис и Ритки',
    icon: '🎵',
    category: 'social',
    rarity: 'epic',
    hidden: false,
    conditionDescription: 'Послушайте гитару Элис и песню Ритки у воды',
    unlockFlag: 'quiet_song_ritka',
    rewards: [{ type: 'addStat', stat: 'stress', value: -10 }, { type: 'addXp', value: 30 }],
  }),

  /* ═══ HIDDEN ═══ */
  ach({
    id: 'hidden_between_lines',
    title: 'Между строк',
    description: 'Найти секретную пасхалку',
    icon: '🔮',
    category: 'hidden',
    rarity: 'rare',
    hidden: true,
    conditionDescription: '???',
    unlockFlag: 'between_lines',
    rewards: [{ type: 'addXp', value: 50 }, { type: 'addCredits', value: 50 }],
  }),
  ach({
    id: 'hidden_sacrifice',
    title: 'Жертва',
    description: 'Выбрать путь самопожертвования',
    icon: '🕯️',
    category: 'hidden',
    rarity: 'legendary',
    hidden: true,
    conditionDescription: '???',
    unlockFlag: 'sacrifice_chosen',
    soundEffect: 'stinger:emotional',
    rewards: [{ type: 'addXp', value: 100 }, { type: 'addKarma', value: 15 }],
  }),
  ach({
    id: 'hidden_all_achievements',
    title: 'Полное собрание',
    description: 'Открыть все остальные достижения',
    icon: '🏆',
    category: 'hidden',
    rarity: 'legendary',
    hidden: true,
    conditionDescription: '???',
    rewards: [
      { type: 'addXp', value: 200 },
      { type: 'setFlag', flag: 'all_achievements', flagValue: true },
    ],
  }),
];

/** Quick lookup map by id */
export const ACHIEVEMENT_MAP: Record<string, AchievementDefinition> = {};
for (const a of ACHIEVEMENTS) {
  ACHIEVEMENT_MAP[a.id] = a;
}

/** Total achievement count */
export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length;
