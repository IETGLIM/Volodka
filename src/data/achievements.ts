import type { Achievement, AchievementRarity, AchievementState } from './types';

// ============================================
// КОНСТАНТЫ РЕДКОСТИ
// ============================================

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#9ca3af',     // серый
  uncommon: '#22c55e',   // зелёный
  rare: '#3b82f6',       // синий
  epic: '#a855f7',       // фиолетовый
  legendary: '#f59e0b',  // золотой
};

export const RARITY_GLOW: Record<AchievementRarity, string> = {
  common: '0 0 5px rgba(156, 163, 175, 0.5)',
  uncommon: '0 0 10px rgba(34, 197, 94, 0.5)',
  rare: '0 0 15px rgba(59, 130, 246, 0.5)',
  epic: '0 0 20px rgba(168, 85, 247, 0.5)',
  legendary: '0 0 25px rgba(245, 158, 11, 0.7)',
};

export function getRarityColor(rarity: AchievementRarity): string {
  return RARITY_COLORS[rarity];
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function createAchievement(
  id: string,
  name: string,
  desc: string,
  icon: string,
  rarity: AchievementRarity,
  condition: Achievement['condition'],
  options?: {
    hidden?: boolean;
    reward?: Achievement['reward'];
  }
): Achievement {
  return {
    id,
    name,
    desc,
    icon,
    rarity,
    condition,
    hidden: options?.hidden || false,
    reward: options?.reward,
  };
}

// ============================================
// ОПРЕДЕЛЕНИЯ ДОСТИЖЕНИЙ
// ============================================

export const ACHIEVEMENTS: Achievement[] = [
  // ========== ТВОРЧЕСТВО ==========
  
  createAchievement(
    'first_words',
    'Первые слова',
    'Написать своё первое стихотворение',
    '✍️',
    'common',
    { type: 'poems', target: 1 }
  ),
  
  createAchievement(
    'poet_apprentice',
    'Поэт-ученик',
    'Написать 5 стихотворений',
    '📝',
    'uncommon',
    { type: 'poems', target: 5 },
    { reward: { skillPoints: 1 } }
  ),
  
  createAchievement(
    'poet_master',
    'Мастер слова',
    'Написать 15 стихотворений',
    '📜',
    'rare',
    { type: 'poems', target: 15 },
    { reward: { skillPoints: 2, creativity: 10 } }
  ),
  
  createAchievement(
    'poet_legend',
    'Легенда поэзии',
    'Написать 30 стихотворений',
    '🏅',
    'epic',
    { type: 'poems', target: 30 },
    { reward: { skillPoints: 3, creativity: 20 } }
  ),
  
  createAchievement(
    'night_writer',
    'Ночной писатель',
    'Написать стихотворение после полуночи',
    '🌙',
    'common',
    { type: 'flags', specificIds: ['wrote_all_night'] }
  ),
  
  // ========== СОЦИАЛЬНЫЕ ==========
  
  createAchievement(
    'first_friend',
    'Первый друг',
    'Познакомиться с кем-то в кафе',
    '🤝',
    'common',
    { type: 'relations', minValue: 10 }
  ),
  
  createAchievement(
    'social_butterfly',
    'Душа компании',
    'Подружиться с 3 людьми',
    '🦋',
    'uncommon',
    { type: 'relations', minValue: 30 },
    { reward: { karma: 10 } }
  ),
  
  createAchievement(
    'close_bond',
    'Тесная связь',
    'Достичь близких отношений с кем-то',
    '💕',
    'rare',
    { type: 'relations', minValue: 50 },
    { reward: { stability: 10, karma: 10 } }
  ),
  
  createAchievement(
    'trusted_confidant',
    'Исповедник',
    'Стать доверенным лицом для нескольких человек',
    '🤐',
    'epic',
    { type: 'relations', minValue: 70 }
  ),
  
  // ========== КАРМА ==========
  
  createAchievement(
    'good_soul',
    'Добрая душа',
    'Достичь кармы 70',
    '😇',
    'uncommon',
    { type: 'karma', minValue: 70 },
    { reward: { stability: 5 } }
  ),
  
  createAchievement(
    'enlightened',
    'Просветлённый',
    'Достичь кармы 90',
    '✨',
    'rare',
    { type: 'karma', minValue: 90 },
    { reward: { stability: 10, karma: 10 } }
  ),
  
  createAchievement(
    'dark_path',
    'Тёмный путь',
    'Опустить карму до 20',
    '🌑',
    'uncommon',
    { type: 'karma', maxValue: 20 },
    { hidden: true }
  ),
  
  // ========== КВЕСТЫ ==========
  
  createAchievement(
    'quest_starter',
    'Начинающий искатель',
    'Выполнить первый квест',
    '📋',
    'common',
    { type: 'quests', target: 1 }
  ),
  
  createAchievement(
    'quest_completer',
    'Исполнитель',
    'Выполнить 5 квестов',
    '✅',
    'uncommon',
    { type: 'quests', target: 5 },
    { reward: { skillPoints: 1 } }
  ),
  
  createAchievement(
    'quest_master',
    'Мастер квестов',
    'Выполнить все основные квесты',
    '🏆',
    'epic',
    { type: 'quests', specificIds: ['first_words', 'first_reading', 'maria_connection', 'inner_voice', 'contest_dream'] },
    { reward: { skillPoints: 3, creativity: 15, karma: 15 } }
  ),
  
  // ========== МЕСТА ==========
  
  createAchievement(
    'cafe_regular',
    'Завсегдатай',
    'Посетить "Синий кот" 10 раз',
    '☕',
    'uncommon',
    { type: 'locations', target: 10, specificIds: ['cafe_evening'] }
  ),
  
  createAchievement(
    'night_walker',
    'Ночной странник',
    'Гулять ночью по городу',
    '🌃',
    'common',
    { type: 'flags', specificIds: ['night_walk'] }
  ),
  
  // ========== КОНЦОВКИ ==========
  
  createAchievement(
    'first_ending',
    'Первая глава',
    'Достичь первой концовки',
    '📖',
    'uncommon',
    { type: 'endings', target: 1 }
  ),
  
  createAchievement(
    'creator_path',
    'Путь Творца',
    'Достичь концовки "Путь Творца"',
    '🎨',
    'rare',
    { type: 'endings', specificIds: ['creator'] }
  ),
  
  createAchievement(
    'reconciliation_path',
    'Примирение',
    'Достичь концовки "Примирение"',
    '☮️',
    'rare',
    { type: 'endings', specificIds: ['reconciliation'] }
  ),
  
  createAchievement(
    'seeker_path',
    'Искатель',
    'Достичь концовки "Искатель"',
    '🔍',
    'rare',
    { type: 'endings', specificIds: ['seeker'] }
  ),
  
  createAchievement(
    'mentor_path',
    'Наставник',
    'Достичь концовки "Наставник"',
    '🎓',
    'rare',
    { type: 'endings', specificIds: ['mentor'] }
  ),
  
  createAchievement(
    'all_endings',
    'Все истории',
    'Увидеть все концовки',
    '📚',
    'legendary',
    { type: 'endings', target: 4 },
    { reward: { skillPoints: 5, creativity: 25, karma: 25 } }
  ),
  
  // ========== ВРЕМЯ ==========
  
  createAchievement(
    'dedicated_reader',
    'Преданный читатель',
    'Провести 1 час в игре',
    '⏰',
    'common',
    { type: 'time', target: 3600 }
  ),
  
  createAchievement(
    'immersive_reader',
    'Погружённый',
    'Провести 5 часов в игре',
    '⌛',
    'uncommon',
    { type: 'time', target: 18000 },
    { reward: { skillPoints: 1 } }
  ),
  
  createAchievement(
    'devoted_reader',
    'Преданный',
    'Провести 10 часов в игре',
    '🕐',
    'rare',
    { type: 'time', target: 36000 },
    { reward: { skillPoints: 2 } }
  ),
  
  // ========== СКРЫТЫЕ ==========
  
  createAchievement(
    'insomniac',
    'Бессонница',
    'Провести 3 ночи без сна',
    '😴',
    'uncommon',
    { type: 'flags', specificIds: ['insomniac'] },
    { hidden: true }
  ),
  
  createAchievement(
    'secret_keeper',
    'Хранитель секретов',
    'Узнать скрытый секрет',
    '🔐',
    'rare',
    { type: 'flags', specificIds: ['learned_secret'] },
    { hidden: true, reward: { karma: 15 } }
  ),
  
  createAchievement(
    'poetry_master',
    'Мастер поэзии',
    'Создать идеальное стихотворение в мини-игре',
    '💎',
    'epic',
    { type: 'flags', specificIds: ['perfect_poem'] },
    { hidden: true, reward: { creativity: 20, skillPoints: 2 } }
  ),
  
  createAchievement(
    'all_secrets',
    'Все тайны раскрыты',
    'Найти все секреты игры',
    '🌟',
    'legendary',
    { type: 'flags', specificIds: ['secret_1', 'secret_2', 'secret_3'] },
    { hidden: true, reward: { skillPoints: 5 } }
  ),
  
  // ========== МОРальные ВЫБОРЫ ==========
  
  createAchievement(
    'selfless_soul',
    'Самоотверженная душа',
    'Сделать 5 самоотверженных выборов',
    '👼',
    'rare',
    { type: 'choices', specificIds: ['selfless'], target: 5 }
  ),
  
  createAchievement(
    'chaos_bringer',
    'Вестник хаоса',
    'Сделать 3 хаотичных выбора',
    '🌀',
    'uncommon',
    { type: 'choices', specificIds: ['chaotic'], target: 3 },
    { hidden: true }
  ),
  
  createAchievement(
    'neutral_ground',
    'Нейтральная территория',
    'Сделать 10 нейтральных выборов',
    '⚖️',
    'common',
    { type: 'choices', specificIds: ['neutral'], target: 10 }
  ),
];

// ============================================
// ФУНКЦИИ ПРОВЕРКИ ДОСТИЖЕНИЙ
// ============================================

export function checkAchievement(achievement: Achievement, state: AchievementState): boolean {
  const { condition } = achievement;
  
  switch (condition.type) {
    case 'poems':
      return state.poemsCount >= (condition.target || 0);
      
    case 'karma':
      if (condition.minValue !== undefined && state.karma < condition.minValue) return false;
      if (condition.maxValue !== undefined && state.karma > condition.maxValue) return false;
      return true;
      
    case 'quests':
      if (condition.specificIds) {
        return condition.specificIds.every(id => state.completedQuests.includes(id));
      }
      return state.completedQuests.length >= (condition.target || 0);
      
    case 'relations':
      const maxRelation = Math.max(...Object.values(state.relations));
      if (condition.minValue !== undefined) {
        return maxRelation >= condition.minValue;
      }
      return false;
      
    case 'locations':
      if (condition.specificIds) {
        const visitedCount = condition.specificIds.filter(id => 
          state.visitedLocations.includes(id)
        ).length;
        return visitedCount >= (condition.target || condition.specificIds.length);
      }
      return state.visitedLocations.length >= (condition.target || 0);
      
    case 'endings':
      if (condition.specificIds) {
        return condition.specificIds.every(id => state.endingsSeen.includes(id));
      }
      return state.endingsSeen.length >= (condition.target || 0);
      
    case 'time':
      return state.playTime >= (condition.target || 0);
      
    case 'flags':
      if (condition.specificIds) {
        return condition.specificIds.every(id => state.flags[id]);
      }
      return false;
      
    case 'choices':
      if (condition.specificIds && state.moralChoices) {
        const count = state.moralChoices.filter(c => 
          condition.specificIds!.includes(c.choice)
        ).length;
        return count >= (condition.target || 1);
      }
      return false;
      
    default:
      return false;
  }
}

export function getUnlockedAchievements(
  achievements: Achievement[],
  state: AchievementState,
  alreadyUnlocked: string[]
): Achievement[] {
  return achievements.filter(
    achievement => 
      !alreadyUnlocked.includes(achievement.id) && 
      checkAchievement(achievement, state)
  );
}

export function getAchievementProgress(achievement: Achievement, state: AchievementState): number {
  const { condition } = achievement;
  
  switch (condition.type) {
    case 'poems':
      return Math.min(100, (state.poemsCount / (condition.target || 1)) * 100);
      
    case 'karma':
      if (condition.minValue !== undefined) {
        return Math.min(100, (state.karma / condition.minValue) * 100);
      }
      return 0;
      
    case 'quests':
      if (condition.specificIds) {
        const completed = condition.specificIds.filter(id => 
          state.completedQuests.includes(id)
        ).length;
        return (completed / condition.specificIds.length) * 100;
      }
      return Math.min(100, (state.completedQuests.length / (condition.target || 1)) * 100);
      
    case 'endings':
      if (condition.specificIds) {
        const found = condition.specificIds.filter(id => 
          state.endingsSeen.includes(id)
        ).length;
        return (found / condition.specificIds.length) * 100;
      }
      return Math.min(100, (state.endingsSeen.length / (condition.target || 1)) * 100);
      
    case 'time':
      return Math.min(100, (state.playTime / (condition.target || 1)) * 100);
      
    default:
      return 0;
  }
}

export function getTotalPoints(unlockedAchievements: Achievement[]): number {
  const rarityPoints: Record<AchievementRarity, number> = {
    common: 10,
    uncommon: 25,
    rare: 50,
    epic: 100,
    legendary: 200,
  };
  
  return unlockedAchievements.reduce(
    (sum, achievement) => sum + rarityPoints[achievement.rarity],
    0
  );
}
