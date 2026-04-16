"use client";

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { 
  ACHIEVEMENTS, 
  checkAchievement, 
  getAchievementProgress,
  RARITY_COLORS,
  RARITY_GLOW,
  getTotalPoints 
} from '@/data/achievements';
import type { Achievement, AchievementRarity } from '@/data/types';

// ============================================
// ТИПЫ
// ============================================

interface AchievementsPanelProps {
  onClose?: () => void;
}

// ============================================
// КОНСТАНТЫ
// ============================================

const RARITY_NAMES: Record<AchievementRarity, string> = {
  common: 'Обычное',
  uncommon: 'Необычное',
  rare: 'Редкое',
  epic: 'Эпическое',
  legendary: 'Легендарное',
};

// ============================================
// КОМПОНЕНТ ДОСТИЖЕНИЯ
// ============================================

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  progress: number;
}

const AchievementCard = memo(function AchievementCard({ 
  achievement, 
  isUnlocked, 
  progress 
}: AchievementCardProps) {
  const rarityColor = RARITY_COLORS[achievement.rarity];
  const rarityGlow = RARITY_GLOW[achievement.rarity];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-lg p-3"
      style={{
        background: isUnlocked 
          ? `linear-gradient(135deg, rgba(0,0,0,0.8), rgba(20,20,30,0.9))`
          : 'rgba(30,30,40,0.5)',
        border: `2px solid ${isUnlocked ? rarityColor : 'rgba(100,100,120,0.3)'}`,
        boxShadow: isUnlocked ? rarityGlow : 'none',
        opacity: achievement.hidden && !isUnlocked ? 0.5 : 1,
      }}
    >
      {/* Иконка и название */}
      <div className="flex items-center gap-3 mb-2">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl"
          style={{
            background: isUnlocked ? `${rarityColor}20` : 'rgba(50,50,60,0.5)',
            border: `1px solid ${isUnlocked ? rarityColor : 'rgba(100,100,120,0.3)'}`,
          }}
        >
          {isUnlocked ? achievement.icon : '❓'}
        </div>
        <div className="flex-1">
          <h3 
            className="font-bold text-sm"
            style={{ color: isUnlocked ? rarityColor : '#6b7280' }}
          >
            {isUnlocked || !achievement.hidden ? achievement.name : '???'}
          </h3>
          <p className="text-xs text-slate-500">
            {RARITY_NAMES[achievement.rarity]}
          </p>
        </div>
        {isUnlocked && (
          <span className="text-green-400 text-lg">✓</span>
        )}
      </div>
      
      {/* Описание */}
      <p className="text-xs text-slate-400 mb-2">
        {isUnlocked || !achievement.hidden ? achievement.desc : 'Скрытое достижение'}
      </p>
      
      {/* Прогресс бар */}
      {!isUnlocked && progress > 0 && (
        <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full"
            style={{ background: rarityColor }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
      
      {/* Награда */}
      {isUnlocked && achievement.reward && (
        <div className="mt-2 pt-2 border-t border-slate-700/50">
          <span className="text-xs text-amber-400">
            🎁 Награда: 
            {achievement.reward.skillPoints && ` +${achievement.reward.skillPoints} очков навыков`}
            {achievement.reward.creativity && ` +${achievement.reward.creativity} творчество`}
            {achievement.reward.karma && ` +${achievement.reward.karma} карма`}
            {achievement.reward.stability && ` +${achievement.reward.stability} стабильность`}
          </span>
        </div>
      )}
      
      {/* Сканлайны */}
      {isUnlocked && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          }}
        />
      )}
    </motion.div>
  );
});

// ============================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ============================================

export const AchievementsPanel = memo(function AchievementsPanel({ onClose }: AchievementsPanelProps) {
  const unlockedAchievementIds = useGameStore((s) => s.unlockedAchievementIds);
  const playerState = useGameStore((s) => s.playerState);
  const npcRelations = useGameStore((s) => s.npcRelations);
  const unlockedLocations = useGameStore((s) => s.unlockedLocations);
  const completedQuestIds = useGameStore((s) => s.completedQuestIds);
  
  // Состояние для проверки достижений
  const achievementState = useMemo(() => ({
    poemsCount: playerState.poemsCollected.length,
    karma: playerState.karma,
    poemsCollected: playerState.poemsCollected,
    flags: playerState.flags,
    playTime: playerState.playTime,
    completedQuests: completedQuestIds,
    relations: npcRelations.reduce((acc, rel) => { acc[rel.id] = rel.value; return acc; }, {} as Record<string, number>),
    visitedLocations: unlockedLocations,
    endingsSeen: [],
  }), [
    playerState.poemsCollected,
    playerState.karma,
    playerState.flags,
    playerState.playTime,
    npcRelations,
    unlockedLocations,
    completedQuestIds,
  ]);
  
  // Разделение на разблокированные и заблокированные
  const { unlocked, locked } = useMemo(() => {
    const unlocked: Array<{ achievement: Achievement; progress: number }> = [];
    const locked: Array<{ achievement: Achievement; progress: number }> = [];
    
    ACHIEVEMENTS.forEach(achievement => {
      const isUnlocked = unlockedAchievementIds.includes(achievement.id);
      const progress = getAchievementProgress(achievement, achievementState);
      
      if (isUnlocked) {
        unlocked.push({ achievement, progress: 100 });
      } else {
        locked.push({ achievement, progress });
      }
    });
    
    return { unlocked, locked };
  }, [unlockedAchievementIds, achievementState]);
  
  // Общие очки
  const totalPoints = useMemo(() => {
    return getTotalPoints(unlocked.map(u => u.achievement));
  }, [unlocked]);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-2 top-14 z-50 w-[min(95vw,20rem)] max-h-[85vh] overflow-hidden sm:right-4 sm:top-16"
      style={{
        background: 'linear-gradient(180deg, rgba(10,10,20,0.98) 0%, rgba(15,15,30,0.98) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)',
      }}
    >
      {/* Заголовок */}
      <div className="p-4 border-b border-purple-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <h2 className="text-lg font-bold text-purple-300">Достижения</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">{totalPoints}</span>
            <span className="text-xs text-slate-500">очков</span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded bg-slate-700/50 text-slate-400 transition-all hover:bg-red-500/30 hover:text-red-400"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <span className="text-green-400">{unlocked.length}</span>
          <span>/</span>
          <span>{ACHIEVEMENTS.length}</span>
          <span>открыто</span>
        </div>
      </div>
      
      {/* Список достижений */}
      <div className="max-h-[calc(85vh-80px)] space-y-2 overflow-y-auto p-3">
        {/* Разблокированные */}
        {unlocked.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">
              ✓ Получено
            </h3>
            {unlocked.map(({ achievement, progress }) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={true}
                progress={progress}
              />
            ))}
          </div>
        )}
        
        {/* Заблокированные */}
        {locked.length > 0 && (
          <div className="space-y-2 mt-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              🔒 В процессе
            </h3>
            {locked
              .filter(({ achievement, progress }) => !achievement.hidden || progress > 0)
              .map(({ achievement, progress }) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={false}
                  progress={progress}
                />
              ))}
          </div>
        )}
      </div>
      
      {/* Угловые декорации */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-purple-400/50" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-purple-400/50" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-purple-400/50" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-purple-400/50" />
    </motion.div>
  );
});

export default AchievementsPanel;
