/* ─── Volodka RPG – Daily Missions Data ───
 * Pool of rotating daily and weekly missions.
 * getDailyMissionPool() selects 5 missions based on a day seed
 * and player level so they rotate daily.
 */

/* ─── Types ─── */

export type DailyMissionCategory = 'combat' | 'exploration' | 'social' | 'poetry' | 'crafting';
export type DailyMissionDifficulty = 'easy' | 'medium' | 'hard';
export type DailyMissionResetSchedule = 'daily' | 'weekly';

export interface DailyMissionObjective {
  id: string;
  description: string;
  /** Target count (e.g., "visit 3 scenes") */
  target: number;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  category: DailyMissionCategory;
  difficulty: DailyMissionDifficulty;
  objectives: DailyMissionObjective[];
  rewards: {
    xp: number;
    credits: number;
    karma?: number;
    skillXp?: Partial<Record<string, number>>;
  };
  /** Reset schedule: 'daily' resets every day, 'weekly' every week */
  resetSchedule: DailyMissionResetSchedule;
  /** Required player level to appear */
  minLevel: number;
  /** Lucide icon name */
  icon: string;
}

/* ─── Category colors & labels ─── */

export const DAILY_MISSION_CATEGORY_META: Record<DailyMissionCategory, { label: string; color: string }> = {
  combat: { label: 'Бой', color: '#f87171' },
  exploration: { label: 'Разведка', color: '#34d399' },
  social: { label: 'Общение', color: '#60a5fa' },
  poetry: { label: 'Поэзия', color: '#c084fc' },
  crafting: { label: 'Крафт', color: '#fbbf24' },
};

/* ══════════════════════════════════════════════════════════════
   MISSION POOL — 20 missions across 5 categories
   ══════════════════════════════════════════════════════════════ */

export const DAILY_MISSION_POOL: DailyMission[] = [
  /* ── Combat (4) ── */
  {
    id: 'dm_combat_purge',
    title: 'Системный очиститель',
    description: 'Уничтожь системных врагов, засоряющих потоки данных. Каждый побеждённый враг — шаг к чистой сети.',
    category: 'combat',
    difficulty: 'medium',
    objectives: [
      { id: 'defeat_system_enemies', description: 'Победить системных врагов', target: 3 },
    ],
    rewards: { xp: 80, credits: 50, karma: 2, skillXp: { coding: 1 } },
    resetSchedule: 'daily',
    minLevel: 1,
    icon: 'Shield',
  },
  {
    id: 'dm_combat_exam',
    title: 'Боевой экзамен',
    description: 'Докажи свою боеспособность в сражении. Победа — лучшая рекомендация.',
    category: 'combat',
    difficulty: 'hard',
    objectives: [
      { id: 'win_combat', description: 'Выиграть боевой encounter', target: 2 },
    ],
    rewards: { xp: 120, credits: 80, karma: 3, skillXp: { logic: 2 } },
    resetSchedule: 'daily',
    minLevel: 3,
    icon: 'Swords',
  },
  {
    id: 'dm_combat_guardian',
    title: 'Страж данных',
    description: 'Защити важные данные от атак. Удержи позицию и не дай врагам прорваться.',
    category: 'combat',
    difficulty: 'medium',
    objectives: [
      { id: 'defend_in_combat', description: 'Использовать защиту в бою', target: 4 },
    ],
    rewards: { xp: 60, credits: 40, skillXp: { logic: 1 } },
    resetSchedule: 'weekly',
    minLevel: 2,
    icon: 'ShieldCheck',
  },
  {
    id: 'dm_combat_bughunter',
    title: 'Охотник за багами',
    description: 'Выследи и уничтожь баги в системе. Каждый баг — угроза стабильности города.',
    category: 'combat',
    difficulty: 'easy',
    objectives: [
      { id: 'defeat_bugs', description: 'Уничтожить багов', target: 5 },
    ],
    rewards: { xp: 50, credits: 30, karma: 1, skillXp: { coding: 1 } },
    resetSchedule: 'daily',
    minLevel: 1,
    icon: 'Bug',
  },

  /* ── Exploration (4) ── */
  {
    id: 'dm_explore_pedestrian',
    title: 'Пешеход города',
    description: 'Исследуй городские локации. Каждый новый угол скрывает тайны.',
    category: 'exploration',
    difficulty: 'easy',
    objectives: [
      { id: 'visit_scenes', description: 'Посетить сцен', target: 3 },
    ],
    rewards: { xp: 40, credits: 25, karma: 1, skillXp: { intuition: 1 } },
    resetSchedule: 'daily',
    minLevel: 1,
    icon: 'Footprints',
  },
  {
    id: 'dm_explore_secrets',
    title: 'Искатель тайн',
    description: 'Найди скрытые области в городе. Не все двери открыты — но запертые хранят самое ценное.',
    category: 'exploration',
    difficulty: 'hard',
    objectives: [
      { id: 'find_hidden_areas', description: 'Обнаружить скрытые области', target: 2 },
    ],
    rewards: { xp: 100, credits: 60, karma: 3, skillXp: { intuition: 2 } },
    resetSchedule: 'weekly',
    minLevel: 3,
    icon: 'Eye',
  },
  {
    id: 'dm_explore_nightwalker',
    title: 'Ночной странник',
    description: 'Исследуй город под покровом ночи. Ночью город рассказывает другие истории.',
    category: 'exploration',
    difficulty: 'medium',
    objectives: [
      { id: 'explore_at_night', description: 'Исследовать сцены ночью', target: 2 },
    ],
    rewards: { xp: 70, credits: 45, karma: 2, skillXp: { intuition: 1, writing: 1 } },
    resetSchedule: 'daily',
    minLevel: 2,
    icon: 'Moon',
  },
  {
    id: 'dm_explore_cartographer',
    title: 'Картограф',
    description: 'Открой новые локации для быстрого перемещения. Карта города — ключ к свободе.',
    category: 'exploration',
    difficulty: 'easy',
    objectives: [
      { id: 'discover_locations', description: 'Обнаружить новые локации', target: 2 },
    ],
    rewards: { xp: 50, credits: 35, karma: 1, skillXp: { logic: 1 } },
    resetSchedule: 'daily',
    minLevel: 1,
    icon: 'Map',
  },

  /* ── Social (4) ── */
  {
    id: 'dm_social_diplomat',
    title: 'Дипломат',
    description: 'Улучши отношения с NPC. Доверие — валюта, которая ценнее кредитов.',
    category: 'social',
    difficulty: 'medium',
    objectives: [
      { id: 'improve_npc_relations', description: 'Улучшить отношения с NPC', target: 2 },
    ],
    rewards: { xp: 60, credits: 40, karma: 3, skillXp: { empathy: 2, persuasion: 1 } },
    resetSchedule: 'daily',
    minLevel: 1,
    icon: 'Handshake',
  },
  {
    id: 'dm_social_heartthrob',
    title: 'Сердцеед',
    description: 'Поговори с жителями города. Каждая беседа — нить в сети связей.',
    category: 'social',
    difficulty: 'easy',
    objectives: [
      { id: 'talk_to_npcs', description: 'Поговорить с NPC', target: 4 },
    ],
    rewards: { xp: 40, credits: 25, karma: 2, skillXp: { empathy: 1 } },
    resetSchedule: 'daily',
    minLevel: 1,
    icon: 'Heart',
  },
  {
    id: 'dm_social_negotiator',
    title: 'Переговорщик',
    description: 'Используй убеждение в диалогах. Сила слова сильнее силы оружия.',
    category: 'social',
    difficulty: 'hard',
    objectives: [
      { id: 'use_persuasion', description: 'Использовать убеждение', target: 2 },
    ],
    rewards: { xp: 90, credits: 55, karma: 4, skillXp: { persuasion: 2 } },
    resetSchedule: 'weekly',
    minLevel: 3,
    icon: 'MessageCircle',
  },
  {
    id: 'dm_social_friend',
    title: 'Друг народа',
    description: 'Добейся высокого уровня отношений. Народ любит тех, кто его понимает.',
    category: 'social',
    difficulty: 'hard',
    objectives: [
      { id: 'high_relationship', description: 'Достичь высокого отношения с NPC', target: 1 },
    ],
    rewards: { xp: 100, credits: 70, karma: 5, skillXp: { empathy: 2, persuasion: 1 } },
    resetSchedule: 'weekly',
    minLevel: 4,
    icon: 'Users',
  },

  /* ── Poetry (4) ── */
  {
    id: 'dm_poetry_collector',
    title: 'Собиратель стихов',
    description: 'Собери стихотворения, разбросанные по городу. Каждое стихотворение — осколок правды.',
    category: 'poetry',
    difficulty: 'medium',
    objectives: [
      { id: 'collect_poems', description: 'Собрать стихотворений', target: 2 },
    ],
    rewards: { xp: 70, credits: 45, karma: 3, skillXp: { writing: 2 } },
    resetSchedule: 'daily',
    minLevel: 1,
    icon: 'BookOpen',
  },
  {
    id: 'dm_poetry_powerword',
    title: 'Силовое слово',
    description: 'Используй силу стихов в бою. Слово может ранить сильнее клинка.',
    category: 'poetry',
    difficulty: 'medium',
    objectives: [
      { id: 'use_poem_powers', description: 'Использовать силу стихов', target: 2 },
    ],
    rewards: { xp: 80, credits: 50, karma: 2, skillXp: { writing: 1, logic: 1 } },
    resetSchedule: 'daily',
    minLevel: 2,
    icon: 'Sparkles',
  },
  {
    id: 'dm_poetry_gift',
    title: 'Поэтический дар',
    description: 'Напиши стихи, которые резонируют с городом. Твори — и мир ответит.',
    category: 'poetry',
    difficulty: 'hard',
    objectives: [
      { id: 'write_poetry', description: 'Написать стихи', target: 1 },
    ],
    rewards: { xp: 110, credits: 65, karma: 5, skillXp: { writing: 3 } },
    resetSchedule: 'weekly',
    minLevel: 3,
    icon: 'Feather',
  },
  {
    id: 'dm_poetry_muse',
    title: 'Муза',
    description: 'Получи бонусы от поэтических сил. Вдохновение — твой главный союзник.',
    category: 'poetry',
    difficulty: 'easy',
    objectives: [
      { id: 'poetry_buffs', description: 'Активировать поэтические бонусы', target: 3 },
    ],
    rewards: { xp: 45, credits: 30, karma: 2, skillXp: { writing: 1, intuition: 1 } },
    resetSchedule: 'daily',
    minLevel: 1,
    icon: 'Music',
  },

  /* ── Crafting (4) ── */
  {
    id: 'dm_craft_jack',
    title: 'Мастер на все руки',
    description: 'Скрафти предметы для выживания в городе. Руки мастера создают чудеса из мусора.',
    category: 'crafting',
    difficulty: 'easy',
    objectives: [
      { id: 'craft_items', description: 'Скрафтить предметов', target: 2 },
    ],
    rewards: { xp: 50, credits: 40, skillXp: { coding: 1, logic: 1 } },
    resetSchedule: 'daily',
    minLevel: 1,
    icon: 'Hammer',
  },
  {
    id: 'dm_craft_alchemist',
    title: 'Алхимик',
    description: 'Создай расходуемые предметы. Правильная формула — половина победы.',
    category: 'crafting',
    difficulty: 'medium',
    objectives: [
      { id: 'craft_consumables', description: 'Скрафтить расходуемых', target: 3 },
    ],
    rewards: { xp: 70, credits: 50, karma: 1, skillXp: { coding: 1 } },
    resetSchedule: 'daily',
    minLevel: 2,
    icon: 'FlaskConical',
  },
  {
    id: 'dm_craft_engineer',
    title: 'Инженер',
    description: 'Создай снаряжение для себя. Каждый улучшенный модуль — шаг к неуязвимости.',
    category: 'crafting',
    difficulty: 'hard',
    objectives: [
      { id: 'craft_equipment', description: 'Скрафтить снаряжение', target: 1 },
    ],
    rewards: { xp: 100, credits: 70, karma: 2, skillXp: { coding: 2, logic: 1 } },
    resetSchedule: 'weekly',
    minLevel: 3,
    icon: 'Wrench',
  },
  {
    id: 'dm_craft_inventor',
    title: 'Изобретатель',
    description: 'Открой новые рецепты крафта. Изобретательность — мать всех систем.',
    category: 'crafting',
    difficulty: 'medium',
    objectives: [
      { id: 'unlock_recipes', description: 'Открыть новых рецептов', target: 1 },
    ],
    rewards: { xp: 80, credits: 55, karma: 2, skillXp: { coding: 1, intuition: 1 } },
    resetSchedule: 'weekly',
    minLevel: 2,
    icon: 'Lightbulb',
  },
];

/* ══════════════════════════════════════════════════════════════
   MISSION POOL SELECTOR
   Uses a simple seeded PRNG to deterministically select 5 missions
   from the pool based on the current day, filtered by player level.
   ══════════════════════════════════════════════════════════════ */

/** Simple seeded pseudo-random number generator (LCG) */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/** Get a day seed from the current date (changes daily at midnight UTC) */
export function getDaySeed(date: Date = new Date()): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

/** Get a week seed (changes weekly, Monday-based) */
export function getWeekSeed(date: Date = new Date()): number {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.getFullYear() * 10000 + (monday.getMonth() + 1) * 100 + monday.getDate();
}

/**
 * Select 5 daily missions from the pool based on a day seed and player level.
 * Guarantees at least 1 mission from each available category when possible.
 */
export function getDailyMissionPool(daySeed: number, playerLevel: number): DailyMission[] {
  const eligible = DAILY_MISSION_POOL.filter((m) => playerLevel >= m.minLevel);
  if (eligible.length <= 5) return eligible;

  const rng = seededRandom(daySeed);

  // Shuffle eligible missions deterministically
  const shuffled = [...eligible];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Pick one from each category first (if available), then fill up to 5
  const categories: DailyMissionCategory[] = ['combat', 'exploration', 'social', 'poetry', 'crafting'];
  const selected: DailyMission[] = [];
  const usedIds = new Set<string>();

  for (const cat of categories) {
    if (selected.length >= 5) break;
    const candidate = shuffled.find((m) => m.category === cat && !usedIds.has(m.id));
    if (candidate) {
      selected.push(candidate);
      usedIds.add(candidate.id);
    }
  }

  // Fill remaining slots
  for (const m of shuffled) {
    if (selected.length >= 5) break;
    if (!usedIds.has(m.id)) {
      selected.push(m);
      usedIds.add(m.id);
    }
  }

  return selected;
}

/**
 * Get weekly missions from the pool (separate selection based on week seed).
 */
export function getWeeklyMissionPool(weekSeed: number, playerLevel: number): DailyMission[] {
  const eligible = DAILY_MISSION_POOL.filter((m) => m.resetSchedule === 'weekly' && playerLevel >= m.minLevel);
  if (eligible.length <= 3) return eligible;

  const rng = seededRandom(weekSeed + 9999); // offset so weekly differs from daily

  const shuffled = [...eligible];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 3);
}

/** Lookup a mission by ID */
export function getDailyMissionById(id: string): DailyMission | undefined {
  return DAILY_MISSION_POOL.find((m) => m.id === id);
}
