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

  /* ── WS19-D: Cyberpunk-noir daily missions (4) ── */
  {
    id: 'dm_combat_perimeter_sweep',
    title: 'Обход Периметра',
    description: 'Проверь периметр серверной комнаты. Каждый незамеченный разрыв — потенциальный канал утечки данных.',
    category: 'combat',
    difficulty: 'medium',
    objectives: [
      { id: 'patrol_perimeter', description: 'Обойти периметр серверной', target: 1 },
    ],
    rewards: { xp: 70, credits: 45, karma: 2, skillXp: { logic: 1 } },
    resetSchedule: 'daily',
    minLevel: 2,
    icon: 'Radar',
  },
  {
    id: 'dm_craft_cache_purge',
    title: 'Очистка Кэша',
    description: 'Удали повреждённые записи из кэша. Протухшие данные отравляют систему изнутри.',
    category: 'crafting',
    difficulty: 'easy',
    objectives: [
      { id: 'purge_corrupted_cache', description: 'Очистить повреждённых записей кэша', target: 5 },
    ],
    rewards: { xp: 50, credits: 35, karma: 1, skillXp: { coding: 1 } },
    resetSchedule: 'daily',
    minLevel: 1,
    icon: 'Trash2',
  },
  {
    id: 'dm_explore_channel_verify',
    title: 'Проверка Каналов',
    description: 'Проверь каналы связи между узлами. Мёртвый канал — не тишина, а засада.',
    category: 'exploration',
    difficulty: 'medium',
    objectives: [
      { id: 'verify_channels', description: 'Проверить каналы связи', target: 3 },
    ],
    rewards: { xp: 75, credits: 50, karma: 2, skillXp: { intuition: 1, logic: 1 } },
    resetSchedule: 'daily',
    minLevel: 2,
    icon: 'Radio',
  },
  {
    id: 'dm_combat_zombie_terminate',
    title: 'Зачистка Зомби-Потоков',
    description: 'Найди и уничтожь зомби-потоки, захватающие ресурсы. Каждый зомби — мёртвый процесс, который отказывается уйти.',
    category: 'combat',
    difficulty: 'hard',
    objectives: [
      { id: 'terminate_zombie_threads', description: 'Завершить зомби-потоков', target: 3 },
    ],
    rewards: { xp: 110, credits: 70, karma: 3, skillXp: { coding: 2, logic: 1 } },
    resetSchedule: 'weekly',
    minLevel: 3,
    icon: 'Skull',
  },
  /* ── WS20-D: Content expansion daily missions (4) ── */
  {
    id: 'ws20d_dm_explore_hidden_archive',
    title: 'Скрытый Архив',
    description: 'Найди Тихий Архив в библиотечном подвале. Архив, который поглощает звук, хранит тайны, которые нельзя прочитать — но можно услышать.',
    category: 'exploration',
    difficulty: 'hard',
    objectives: [
      { id: 'find_silent_archive', description: 'Обнаружить Тихий Архив', target: 1 },
    ],
    rewards: { xp: 120, credits: 80, karma: 4, skillXp: { intuition: 2, empathy: 1 } },
    resetSchedule: 'daily',
    minLevel: 4,
    icon: 'Archive',
  },
  {
    id: 'ws20d_dm_craft_memory_shard',
    title: 'Осколок Памяти',
    description: 'Скрафти осколок памяти из фрагментированных данных. Каждая потерянная строка кода — частица чьей-то истории.',
    category: 'crafting',
    difficulty: 'easy',
    objectives: [
      { id: 'craft_memory_shards', description: 'Скрафтить осколков памяти', target: 3 },
    ],
    rewards: { xp: 45, credits: 30, karma: 1, skillXp: { coding: 1, empathy: 1 } },
    resetSchedule: 'daily',
    minLevel: 1,
    icon: 'Sparkles',
  },
  {
    id: 'ws20d_dm_combat_phantom_hunt',
    title: 'Охота на Призраков',
    description: 'Выследи квантовых призраков, проникающих из Мира Снов. Они не материальны — но их присутствие искажает реальность.',
    category: 'combat',
    difficulty: 'medium',
    objectives: [
      { id: 'hunt_quantum_ghosts', description: 'Победить квантовых призраков', target: 2 },
    ],
    rewards: { xp: 85, credits: 55, karma: 2, skillXp: { logic: 1, intuition: 1 } },
    resetSchedule: 'weekly',
    minLevel: 3,
    icon: 'Ghost',
  },
  {
    id: 'ws20d_dm_explore_frozen_channel',
    title: 'Замёрзший Канал',
    description: 'Найди и проверь замёрзший сигнал в зимнем городе. Канал, застывший mid-transmission, хранит послание, которое никто не получит.',
    category: 'exploration',
    difficulty: 'medium',
    objectives: [
      { id: 'investigate_frozen_channel', description: 'Исследовать замёрзший канал', target: 1 },
    ],
    rewards: { xp: 75, credits: 50, karma: 2, skillXp: { intuition: 1, logic: 1 } },
    resetSchedule: 'daily',
    minLevel: 2,
    icon: 'Radio',
  },
  /* ── WS21-D: Content expansion daily missions (4) ── */
  {
    id: 'ws21d_dm_combat_neural_purge',
    title: 'Нейро-Очистка',
    description: 'Уничтожь враждебные нейро-процессы, захватывающие мысленные потоки граждан. Каждый паразитный процесс — украденная мысль, промытый мозг, подчинённая воля.',
    category: 'combat',
    difficulty: 'hard',
    objectives: [
      { id: 'purge_neural_processes', description: 'Уничтожить нейро-паразитов', target: 4 },
    ],
    rewards: { xp: 130, credits: 85, karma: 3, skillXp: { coding: 2, logic: 1 } },
    resetSchedule: 'weekly',
    minLevel: 4,
    icon: 'Brain',
  },
  {
    id: 'ws21d_dm_explore_antenna_network',
    title: 'Проверка Антенн',
    description: 'Обойди крыши города и проверь узлы Сети Антенн. Каждый неработающий передатчик — потерянное стихотворение, которое никто не услышит.',
    category: 'exploration',
    difficulty: 'easy',
    objectives: [
      { id: 'check_antenna_nodes', description: 'Проверить узлы антенн', target: 3 },
    ],
    rewards: { xp: 45, credits: 30, karma: 1, skillXp: { intuition: 1 } },
    resetSchedule: 'daily',
    minLevel: 1,
    icon: 'RadioTower',
  },
  {
    id: 'ws21d_dm_craft_signal_decoder',
    title: 'Декодер Сигнала',
    description: 'Скрафти декодер для перехвата зашифрованных поэтических трансляций. Правильный ключ — и шёпот станет голосом.',
    category: 'crafting',
    difficulty: 'medium',
    objectives: [
      { id: 'craft_decoder', description: 'Скрафтить компонент декодера', target: 2 },
    ],
    rewards: { xp: 80, credits: 55, karma: 2, skillXp: { coding: 1, intuition: 1 } },
    resetSchedule: 'daily',
    minLevel: 2,
    icon: 'Key',
  },
  {
    id: 'ws21d_dm_combat_ghost_terminate',
    title: 'Изгнание Призраков',
    description: 'Найди и уничтожь призрачные процессы в подвалах серверных. Они не видны в логах, но пожирают память и искажают реальность тех, кто рядом.',
    category: 'combat',
    difficulty: 'medium',
    objectives: [
      { id: 'terminate_ghost_processes', description: 'Изгнать призрачных процессов', target: 3 },
    ],
    rewards: { xp: 90, credits: 60, karma: 2, skillXp: { logic: 1, coding: 1 } },
    resetSchedule: 'daily',
    minLevel: 3,
    icon: 'Zap',
  },
  /* ── WS22-D: Content expansion daily missions (4) ── */
  {
    id: 'ws22d_dm_combat_firewall_breach',
    title: 'Пробой Межсетевого Экрана',
    description: 'Нейро-Межсетевые Экраны блокируют исходящие мысли. Найди уязвимость и пробей экран — не ради хаоса, а ради того, чтобы поэзия снова смогла звучать.',
    category: 'combat',
    difficulty: 'hard',
    objectives: [
      { id: 'breach_neural_firewalls', description: 'Пробить нейро-экранов', target: 2 },
    ],
    rewards: { xp: 130, credits: 85, karma: 4, skillXp: { coding: 2, persuasion: 1 } },
    resetSchedule: 'weekly',
    minLevel: 4,
    icon: 'ShieldOff',
  },
  {
    id: 'ws22d_dm_explore_ink_archive',
    title: 'Чернильный Архив',
    description: 'Найди Чернильный Архив в подземном бункере. Рукописи, которых нет в сети — единственное, что Паноптикум не может удалить.',
    category: 'exploration',
    difficulty: 'medium',
    objectives: [
      { id: 'find_ink_archive', description: 'Обнаружить Чернильный Архив', target: 1 },
    ],
    rewards: { xp: 80, credits: 55, karma: 3, skillXp: { intuition: 2, empathy: 1 } },
    resetSchedule: 'daily',
    minLevel: 3,
    icon: 'BookOpen',
  },
  {
    id: 'ws22d_dm_craft_resonance_key',
    title: 'Ключ Резонанса',
    description: 'Скрафти ключ резонанса — устройство, подстраивающее частоту стихов под частоту стены. Когда стена дрожит — экран падает.',
    category: 'crafting',
    difficulty: 'medium',
    objectives: [
      { id: 'craft_resonance_keys', description: 'Скрафтить компонент ключа резонанса', target: 2 },
    ],
    rewards: { xp: 85, credits: 60, karma: 2, skillXp: { coding: 1, intuition: 1 } },
    resetSchedule: 'weekly',
    minLevel: 3,
    icon: 'Key',
  },
  {
    id: 'ws22d_dm_explore_corridor_echo',
    title: 'Эхо Коридора',
    description: 'Исследуй аномальное эхо в коридоре между 03:00 и 03:47. Стены компилируют стихи — каждый метр — повторитель сигнала.',
    category: 'exploration',
    difficulty: 'easy',
    objectives: [
      { id: 'investigate_corridor_echo', description: 'Исследовать эхо коридора', target: 1 },
    ],
    rewards: { xp: 50, credits: 35, karma: 2, skillXp: { intuition: 1, writing: 1 } },
    resetSchedule: 'daily',
    minLevel: 2,
    icon: 'AudioWaveform',
  },
  /* ── WS23-D: Content expansion daily missions (4) ── */
  {
    id: 'ws23d_dm_combat_ink_circuit_defense',
    title: 'Защита Чернильной Схемы',
    description: 'Защити аналоговый вычислитель «Синей ямы» от цифровых агентов. Чернильная Схема — единственный компьютер, который Паноптикум не может сканировать. Пока она работает — свобода материальна.',
    category: 'combat',
    difficulty: 'hard',
    objectives: [
      { id: 'defend_ink_circuit', description: 'Отразить атак на Чернильную Схему', target: 3 },
    ],
    rewards: { xp: 130, credits: 85, karma: 4, skillXp: { coding: 2, logic: 1 } },
    resetSchedule: 'weekly',
    minLevel: 4,
    icon: 'Shield',
  },
  {
    id: 'ws23d_dm_explore_antenna_graveyard',
    title: 'Кладбище Антенн',
    description: 'Исследуй крышу заброшенного завода — 47 мёртвых антенн, каждая из которых хранит последний сигнал. Найди антенну №23: она транслирует стихотворение из будущего.',
    category: 'exploration',
    difficulty: 'medium',
    objectives: [
      { id: 'investigate_antennas', description: 'Исследовать антенн на крыше', target: 5 },
    ],
    rewards: { xp: 85, credits: 55, karma: 3, skillXp: { intuition: 2, writing: 1 } },
    resetSchedule: 'daily',
    minLevel: 3,
    icon: 'RadioTower',
  },
  {
    id: 'ws23d_dm_craft_magnetic_tape_reader',
    title: 'Считыватель Магнитных Лент',
    description: 'Скрафти устройство для чтения магнитных лент Глубинного Архива. Ленты не обновлялись с 2029 года — каждый байт — нетронутый янтарь мира до Сбоя.',
    category: 'crafting',
    difficulty: 'easy',
    objectives: [
      { id: 'craft_tape_reader', description: 'Скрафтить компонент считывателя', target: 3 },
    ],
    rewards: { xp: 50, credits: 35, karma: 2, skillXp: { coding: 1, logic: 1 } },
    resetSchedule: 'daily',
    minLevel: 2,
    icon: 'HardDrive',
  },
  {
    id: 'ws23d_dm_explore_frozen_signal',
    title: 'Замёрзший Сигнал',
    description: 'Зимой при −30°C в эфире возникает сигнал на частоте 47.29 МГц. Он модулирован стихами, которых нет ни в одной базе. Найди источник — и поймай координаты спирали.',
    category: 'exploration',
    difficulty: 'hard',
    objectives: [
      { id: 'trace_frozen_signal', description: 'Отследить замёрзший сигнал', target: 1 },
    ],
    rewards: { xp: 120, credits: 80, karma: 5, skillXp: { intuition: 3, empathy: 1 } },
    resetSchedule: 'weekly',
    minLevel: 5,
    icon: 'ThermometerSnowflake',
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
