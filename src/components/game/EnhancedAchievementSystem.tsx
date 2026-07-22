/* ─── Volodka RPG – Enhanced Achievement System v2.0 ───
   Система достижений:
   – Киберпанк-стилизованные карточки
   – Анимации разблокировки (glitch, particles)
   – Rarity system (common, rare, epic, legendary)
   – Progress tracking для многоуровневых
   – Sound integration hooks
   – Filter & search
*/

import { memo, useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Star,
  Lock,
  Unlock,
  CheckCircle,
  Target,
  Zap,
  BookOpen,
  Heart,
  Shield,
  Sword,
  Brain,
  Gift,
  Crown,
  Sparkles,
  ChevronRight,
  Filter,
  Search,
} from 'lucide-react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ─── Types ─── */
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type AchievementCategory = 
  | 'story'
  | 'exploration'
  | 'combat'
  | 'social'
  | 'poetry'
  | 'collection'
  | 'hidden';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  rarity: AchievementRarity;
  category: AchievementCategory;
  xpReward: number;
  karmaReward?: number;
  isUnlocked: boolean;
  unlockedAt?: number; // timestamp
  progress?: { current: number; max: number }; // for multi-step achievements
  secret?: boolean; // hidden until unlocked
}

interface AchievementCardProps {
  achievement: Achievement;
  onSelect?: (id: string) => void;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  compact?: boolean;
}

/* ─── Rarity Configuration ─── */
const rarityConfig: Record<AchievementRarity, {
  color: string;
  rgb: string;
  label: string;
  borderGlow: string;
  bgGradient: string;
  iconBg: string;
}> = {
  common: {
    color: '#9ca3af',
    rgb: '156, 163, 175',
    label: 'Обычное',
    borderGlow: 'rgba(156, 163, 175, 0.3)',
    bgGradient: 'linear-gradient(135deg, rgba(156, 163, 175, 0.08), transparent)',
    iconBg: 'rgba(156, 163, 175, 0.15)',
  },
  uncommon: {
    color: '#22c55e',
    rgb: '34, 197, 94',
    label: 'Необычное',
    borderGlow: 'rgba(34, 197, 94, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), transparent)',
    iconBg: 'rgba(34, 197, 94, 0.18)',
  },
  rare: {
    color: '#3b82f6',
    rgb: '59, 130, 246',
    label: 'Редкое',
    borderGlow: 'rgba(59, 130, 246, 0.5)',
    bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), transparent)',
    iconBg: 'rgba(59, 130, 246, 0.2)',
  },
  epic: {
    color: '#a855f7',
    rgb: '168, 85, 247',
    label: 'Эпическое',
    borderGlow: 'rgba(168, 85, 247, 0.6)',
    bgGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.08))',
    iconBg: 'rgba(168, 85, 247, 0.25)',
  },
  legendary: {
    color: '#f59e0b',
    rgb: '245, 158, 11',
    label: 'Легендарное',
    borderGlow: 'rgba(245, 158, 11, 0.7)',
    bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(234, 88, 12, 0.1))',
    iconBg: 'rgba(245, 158, 11, 0.28)',
  },
};

const categoryIcons: Record<AchievementCategory, React.ReactNode> = {
  story: <BookOpen className="size-full" />,
  exploration: <Target className="size-full" />,
  combat: <Sword className="size-full" />,
  social: <Heart className="size-full" />,
  poetry: <Sparkles className="size-full" />,
  collection: <Gift className="size-full" />,
  hidden: <Lock className="size-full" />,
};

/* ─── Achievement Card Component ─── */
export const AchievementCard = memo(function AchievementCard({
  achievement,
  onSelect,
  size = 'md',
  showProgress = true,
  compact = false,
}: AchievementCardProps) {
  const config = rarityConfig[achievement.rarity];
  const [isHovered, setIsHovered] = useState(false);
  
  // For hidden achievements that aren't unlocked yet
  if (achievement.secret && !achievement.isUnlocked) {
    return (
      <div
        className={`
          flex items-center gap-3 p-3 rounded-lg bg-slate-900/40
          border border-dashed border-slate-700/30
          ${compact ? '' : 'w-full'}
        `}
      >
        <div className="size-10 rounded-lg bg-slate-800/60 flex items-center justify-center">
          <Lock className="size-5 text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono text-slate-500">?????</p>
          <p className="text-xs text-slate-600 mt-0.5">Достижение скрыто</p>
        </div>
      </div>
    );
  }

  /* Progress percentage */
  const progressPercent = achievement.progress
    ? Math.min(100, Math.round((achievement.progress.current / achievement.progress.max) * 100))
    : null;

  /* Size-based classes */
  const sizeClasses = {
    sm: { card: 'p-2 gap-2', icon: 'size-8', title: 'text-xs', desc: 'text-[10px]' },
    md: { card: 'p-3 gap-3', icon: 'size-12', title: 'text-sm', desc: 'text-xs' },
    lg: { card: 'p-4 gap-4', icon: 'size-16', title: 'text-base', desc: 'text-sm' },
  };
  const sz = sizeClasses[size];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSelect?.(achievement.id)}
      className={`
        relative cursor-pointer select-none overflow-hidden
        ${sz.card}
        ${compact ? '' : 'w-full'}
        rounded-xl backdrop-blur-sm
        transition-all duration-300
      `}
      style={{
        background: `linear-gradient(
          145deg,
          rgba(2, 6, 23, 0.97),
          rgba(15, 23, 42, 0.94)
        )`,
        borderColor: achievement.isUnlocked 
          ? `${config.color}80` 
          : 'rgba(100, 116, 139, 0.3)',
        boxShadow: isHovered || achievement.isUnlocked
          ? `0 0 20px ${config.borderGlow}, 0 8px 32px rgba(0,0,0,0.4)`
          : undefined,
      }}
    >
      {/* Background gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: config.bgGradient }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: achievement.isUnlocked
            ? `linear-gradient(90deg, transparent, ${config.color}, transparent)`
            : 'linear-gradient(90deg, transparent, rgba(100, 116, 139, 0.3), transparent)',
          opacity: 0.8,
        }}
      />

      {/* Icon */}
      <div
        className={`
          ${sz.icon} flex-shrink-0 rounded-lg flex items-center justify-center
          relative overflow-hidden
        `}
        style={{
          backgroundColor: config.iconBg,
          filter: achievement.isUnlocked 
            ? `drop-shadow(0 0 8px ${config.color})` 
            : undefined,
        }}
      >
        {achievement.isUnlocked ? (
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            style={{ color: config.color }}
          >
            {achievement.icon || categoryIcons[achievement.category]}
          </motion.div>
        ) : (
          <span style={{ color: config.color }} className="opacity-50">
            {achievement.icon || categoryIcons[achievement.category]}
          </span>
        )}

        {/* Unlocked badge */}
        {achievement.isUnlocked && (
          <div className="absolute -top-1 -right-1 size-4 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle className="size-2.5 text-black" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4
          className={`${sz.title} font-semibold truncate`}
          style={{
            color: achievement.isUnlocked ? config.color : '#94a3b8',
            textShadow: achievement.isUnlocked && achievement.rarity === 'legendary'
              ? `0 0 12px ${config.color}`
              : undefined,
          }}
        >
          {achievement.title}
        </h4>

        {!compact && (
          <>
            <p className={`${sz.desc} text-slate-400 mt-0.5 line-clamp-2`}>
              {achievement.description}
            </p>

            {/* Rewards row */}
            <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono">
              <span className="text-cyan-400/70">
                +{achievement.xpReward} XP
              </span>
              {achievement.karmaReward !== undefined && (
                <span style={{ color: 'var(--cyber-amber)' }}>
                  {achievement.karmaReward > 0 ? '+' : ''}{achievement.karmaReward} ☯
                </span>
              )}
              <span className={`
                px-1.5 py-0.5 rounded text-[9px]
                ${achievement.rarity === 'legendary' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700/40 text-slate-400'}
              `}>
                {config.label}
              </span>
            </div>

            {/* Progress bar for multi-step achievements */}
            {showProgress && achievement.progress && !achievement.isUnlocked && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-slate-500 font-mono">
                    Прогресс
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: config.color }}>
                    {achievement.progress.current}/{achievement.progress.max}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: config.color,
                      boxShadow: progressPercent === 100 ? `0 0 8px ${config.color}` : undefined,
                    }}
                    initial={false}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {/* Unlocked date */}
            {achievement.isUnlocked && achievement.unlockedAt && (
              <p className="text-[9px] text-green-400/60 mt-1 font-mono">
                Разблокировано: {new Date(achievement.unlockedAt).toLocaleDateString('ru-RU')}
              </p>
            )}
          </>
        )}
      </div>

      {/* Selection indicator */}
      {isHovered && (
        <ChevronRight className={`size-4 absolute right-2 opacity-30`} style={{ color: config.color }} />
      )}

      {/* Legendary shimmer effect when unlocked */}
      {achievement.isUnlocked && achievement.rarity === 'legendary' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(
                105deg,
                transparent 40%,
                rgba(245, 158, 11, 0.05) 45%,
                transparent 55%
              )
            `,
            animation: 'legendaryShimmer 4s ease-in-out infinite',
          }}
        />
      )}
    </motion.div>
  );
});

AchievementCard.displayName = 'AchievementCard';

/* ─── Achievement Grid/List Container ─── */
interface AchievementGridProps {
  achievements: Achievement[];
  onAchievementSelect?: (id: string) => void;
  viewMode?: 'grid' | 'list';
  filterByCategory?: AchievementCategory;
  filterByRarity?: AchievementRarity;
  searchQuery?: string;
  showLocked?: boolean;
  columns?: number;
}

export function AchievementGrid({
  achievements,
  onAchievementSelect,
  viewMode = 'grid',
  filterByCategory,
  filterByRarity,
  searchQuery = '',
  showLocked = true,
  columns = 3,
}: AchievementGridProps) {
  /* Filter achievements */
  const filteredAchievements = useMemo(() => {
    let result = [...achievements];

    // Category filter
    if (filterByCategory) {
      result = result.filter((a) => a.category === filterByCategory);
    }

    // Rarity filter
    if (filterByRarity) {
      result = result.filter((a) => a.rarity === filterByRarity);
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((a) =>
        a.title.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
      );
    }

    // Show locked toggle
    if (!showLocked) {
      result = result.filter((a) => a.isUnlocked);
    }

    // Sort: unlocked first, then by rarity tier, then by id
    const rarityOrder: Record<AchievementRarity, number> = {
      legendary: 5,
      epic: 4,
      rare: 3,
      uncommon: 2,
      common: 1,
    };

    result.sort((a, b) => {
      // Unlocked always first
      if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
      // Then by rarity
      return rarityOrder[b.rarity] - rarityOrder[a.rarity];
    });

    return result;
  }, [achievements, filterByCategory, filterByRarity, searchQuery, showLocked]);

  /* Stats */
  const stats = useMemo(() => {
    const total = achievements.length;
    const unlocked = achievements.filter((a) => a.isUnlocked).length;
    const totalXP = achievements.reduce((sum, a) => sum + (a.isUnlocked ? a.xpReward : 0), 0);
    return { total, unlocked, percent: Math.round((unlocked / total) * 100), totalXP };
  }, [achievements]);

  return (
    <div className="space-y-4">
      {/* Stats header */}
      <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-900/40 border border-slate-700/20">
        <Crown className="size-5 text-amber-400" style={{ filter: 'drop-shadow(0 0 6px #f59e0b)' }} />
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-cyan-300">{stats.unlocked}</span>
          <span className="text-slate-500">/</span>
          <span className="text-sm text-slate-500">{stats.total}</span>
        </div>
        
        <div className="ml-auto w-32 h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-cyan-500"
            animate={{ width: `${stats.percent}%` }}
            style={{ boxShadow: stats.percent > 75 ? '0 0 8px #f59e0b' : undefined }}
          />
        </div>
        
        <span className="text-xs font-mono text-amber-400">{stats.percent}%</span>
      </div>

      {/* Achievements grid/list */}
      <div
        className={
          viewMode === 'grid'
            ? `grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns}`
            : 'space-y-2'
        }
      >
        <AnimatePresence mode="popLayout">
          {filteredAchievements.length > 0 ? (
            filteredAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                onSelect={onAchievementSelect}
                compact={viewMode === 'list'}
              />
            ))
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-8 text-center"
            >
              <Trophy className="size-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm text-slate-500">Достижения не найдены</p>
              <p className="text-xs text-slate-600 mt-1">Попробуйте изменить фильтры</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Achievement Unlock Animation (overlay) ─── */
interface AchievementUnlockOverlayProps {
  achievement: Achievement;
  isVisible: boolean;
  onComplete?: () => void;
  duration?: number;
}

export function AchievementUnlockOverlay({
  achievement,
  isVisible,
  onComplete,
  duration = 3500,
}: AchievementUnlockOverlayProps) {
  const config = rarityConfig[achievement.rarity];

  useEffect(() => {
    if (isVisible && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete, duration]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -50, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="fixed top-20 right-4"
          style={{ zIndex: UI_LAYERS.TOASTS }}
        >
          <motion.div
            layout
            className="relative w-[360px] p-4 rounded-xl overflow-hidden"
            style={{
              background: `linear-gradient(145deg, rgba(2, 6, 23, 0.98), rgba(15, 23, 42, 0.96))`,
              border: `2px solid ${config.color}`,
              boxShadow: `0 0 40px ${config.borderGlow}, 0 12px 40px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: config.bgGradient }} />
            
            {/* Particle burst effect simulation with CSS */}
            <div className="absolute top-0 left-0 right-0 h-[2px]" 
              style={{
                background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
                animation: 'scanline 2s linear infinite',
              }}
            />

            <div className="relative flex items-start gap-3">
              {/* Icon with celebration effect */}
              <motion.div
                className="size-14 rounded-xl flex-shrink-0 flex items-center justify-center relative"
                style={{ backgroundColor: config.iconBg }}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, times: [0, 0.6, 1] }}
              >
                <motion.span
                  style={{ color: config.color }}
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ delay: 0.3, duration: 0.8, repeat: Infinity }}
                >
                  {achievement.icon || <Trophy className="size-6" />}
                </motion.span>
                
                {/* Sparkle burst */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-white"
                    style={{ backgroundColor: config.color }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [1, 1, 0],
                      x: [0, Math.cos(i * 60 * Math.PI / 180) * 30],
                      y: [0, Math.sin(i * 60 * Math.PI / 180) * 30],
                    }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.03 }}
                  />
                ))}
              </motion.div>

              {/* Text content */}
              <div className="flex-1 pt-1">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs font-mono uppercase tracking-wider mb-1"
                  style={{ color: config.color }}
                >
                  Достижение получено!
                </motion.p>
                
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-base font-bold"
                  style={{ color: config.color }}
                >
                  {achievement.title}
                </motion.h3>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-slate-300 mt-1 line-clamp-2"
                >
                  {achievement.description}
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-3 mt-2 text-xs font-mono"
                >
                  <span className="text-cyan-400">+{achievement.xpReward} XP</span>
                  {achievement.karmaReward !== undefined && (
                    <span style={{ color: 'var(--cyber-amber)' }}>
                      {achievement.karmaReward > 0 ? '+' : ''}{achievement.karmaReward} ☯
                    </span>
                  )}
                  <span className="text-slate-500 ml-auto">{config.label}</span>
                </motion.div>
              </div>
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-[2px]"
              style={{ backgroundColor: config.color }}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── CSS Keyframes (would be in global CSS ideally) ─── */
const AchievementStylesCSS = `
  @keyframes scanline {
    0% { left: -100%; }
    100% { left: 100%; }
  }
  @keyframes legendaryShimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
`;

export default AchievementGrid;
