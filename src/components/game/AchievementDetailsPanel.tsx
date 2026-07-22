
/* ─── Volodka RPG – Achievement Details Panel ───
   Full achievement gallery with category filter tabs,
   progress tracking, and detail popup.
   Cyberpunk dark glass morphism with amber accent.
*/

import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import {
  X, Lock, Trophy, CheckCircle2, Clock,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  ACHIEVEMENTS,
  CATEGORY_ORDER,
  CATEGORY_META,
  RARITY_META,
  TOTAL_ACHIEVEMENTS,
  type AchievementDefinition,
  type AchievementCategory } from '@/data/achievements';
import { formatStoryEffectReward } from '@/data/achievementHelpers';
import { resolveAchievementProgress } from '@/engine/achievementProgressResolver';

/* ─── Types ─── */

interface AchievementDetailsPanelProps {
  open: boolean;
  onClose: () => void;
}

interface DetailPopupData {
  achievement: AchievementDefinition;
  unlocked: boolean;
  unlockedAt?: number;
}

/* ─── Single Achievement Card ─── */

function AchievementCard({
  achievement,
  unlocked,
  unlockedAt,
  progress,
  onClick }: {
  achievement: AchievementDefinition;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: { current: number; target: number } | null;
  onClick: () => void;
}) {
  const isHidden = achievement.hidden && !unlocked;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        relative rounded-xl border overflow-hidden transition-all duration-300 w-full text-left
        ${unlocked
          ? 'border-amber-500/30 bg-amber-950/10 hover:border-amber-500/50 cursor-pointer'
          : 'border-slate-800/30 bg-slate-900/20 hover:border-slate-700/40 cursor-pointer'
        }
      `}
      style={{
        boxShadow: unlocked
          ? '0 0 16px rgba(251,191,36,0.1), inset 0 1px 0 rgba(251,191,36,0.06)'
          : 'none' }}
      onClick={onClick}
    >
      {/* Glow border for unlocked */}
      {unlocked && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 20px rgba(251,191,36,0.05)' }}
        />
      )}

      <div className="flex items-center gap-3 p-3">
        {/* Icon */}
        <div
          className={`
            flex items-center justify-center shrink-0 rounded-lg
            ${unlocked
              ? 'bg-amber-500/10'
              : 'bg-slate-800/40'
            }
          `}
          style={{
            width: 44,
            height: 44,
            fontSize: 22,
            boxShadow: unlocked
              ? '0 0 12px rgba(251,191,36,0.15)'
              : 'none',
            filter: unlocked ? 'none' : 'grayscale(1) brightness(0.4)' }}
        >
          {isHidden ? '❓' : achievement.icon}
        </div>

        {/* Text */}
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className={`text-sm font-semibold leading-tight truncate ${
              unlocked ? 'text-amber-200' : 'text-slate-500'
            }`}
          >
            {isHidden ? '???' : achievement.title}
          </span>
          <span
            className={`text-xs leading-tight mt-0.5 truncate ${
              unlocked ? 'text-amber-400/60' : 'text-slate-600'
            }`}
          >
            {isHidden ? 'Секретное достижение' : achievement.description}
          </span>
          {/* Hint text for locked */}
          {!unlocked && !isHidden && (
            <span className="text-[10px] text-slate-600/80 mt-1 leading-tight italic">
              {achievement.conditionDescription}
            </span>
          )}
          {!unlocked && progress && progress.target > 1 && (
            <div className="mt-1.5 h-1 rounded-full bg-slate-800/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500/60"
                style={{ width: `${Math.round((progress.current / progress.target) * 100)}%` }}
              />
            </div>
          )}
          {/* Timestamp for unlocked */}
          {unlocked && unlockedAt && (
            <div className="flex items-center gap-1 mt-1">
              <Clock className="size-2.5 text-amber-500/40" />
              <span className="text-[10px] text-amber-500/40 font-mono">
                {new Date(unlockedAt).toLocaleString('ru-RU', {
                  day: '2-digit', month: '2-digit',
                  hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>

        {/* Status icon */}
        <div className="shrink-0">
          {unlocked ? (
            <CheckCircle2 className="size-5 text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.4))' }} />
          ) : (
            <Lock className="size-4 text-slate-600" />
          )}
        </div>
      </div>

      {/* Lock overlay for locked achievements */}
      {!unlocked && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.3) 0%, rgba(30,41,59,0.2) 100%)' }}
        />
      )}
    </motion.button>
  );
}

/* ─── Detail Popup ─── */

function AchievementDetailPopup({
  data,
  progress,
  onClose }: {
  data: DetailPopupData;
  progress?: { current: number; target: number } | null;
  onClose: () => void;
}) {
  const { achievement, unlocked, unlockedAt } = data;
  const isHidden = achievement.hidden && !unlocked;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: UI_LAYERS.PANEL }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative z-10 w-[90vw] max-w-md rounded-2xl border border-amber-500/20 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(8,12,28,0.97) 0%, rgba(4,8,18,0.98) 100%)',
          boxShadow: '0 0 40px rgba(251,191,36,0.1), -20px 0 40px rgba(0,0,0,0.5)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-5 border-b border-slate-800/30">
          <div
            className="flex items-center justify-center shrink-0 rounded-xl"
            style={{
              width: 56,
              height: 56,
              fontSize: 28,
              background: unlocked ? 'rgba(251,191,36,0.1)' : 'rgba(30,41,59,0.4)',
              boxShadow: unlocked ? '0 0 20px rgba(251,191,36,0.2)' : 'none',
              filter: unlocked ? 'none' : 'grayscale(1) brightness(0.4)' }}
          >
            {isHidden ? '❓' : achievement.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-semibold ${unlocked ? 'text-amber-200' : 'text-slate-400'}`}>
              {isHidden ? '???' : achievement.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{
                  background: `${RARITY_META[achievement.rarity].color}15`,
                  color: RARITY_META[achievement.rarity].color,
                  border: `1px solid ${RARITY_META[achievement.rarity].color}30` }}
              >
                {RARITY_META[achievement.rarity].label}
              </span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{
                  background: `${CATEGORY_META[achievement.category].color}15`,
                  color: CATEGORY_META[achievement.category].color,
                  border: `1px solid ${CATEGORY_META[achievement.category].color}30` }}
              >
                {CATEGORY_META[achievement.category].icon} {CATEGORY_META[achievement.category].label}
              </span>
              {unlocked ? (
                <span className="text-[10px] font-mono text-amber-500/60 flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Открыто
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                  <Lock className="size-3" /> Закрыто
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Description */}
          <div>
            <p className={`text-sm leading-relaxed ${unlocked ? 'text-slate-300' : 'text-slate-500'}`}>
              {isHidden ? 'Это секретное достижение. Условие открытия скрыто.' : achievement.description}
            </p>
          </div>

          {/* Condition */}
          {!isHidden && (
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Условие</span>
              <p className="text-xs text-amber-400/70 mt-1">{achievement.conditionDescription}</p>
              {!unlocked && progress && (
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Прогресс: {progress.current} / {progress.target}
                </p>
              )}
            </div>
          )}

          {/* Rewards */}
          {!isHidden && achievement.rewards.length > 0 && (
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Награда</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {achievement.rewards.map((reward, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800/50 text-amber-300/70 border border-amber-900/20"
                  >
                    {formatStoryEffectReward(reward)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Unlock date */}
          {unlocked && unlockedAt && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/30">
              <Clock className="size-3.5 text-amber-500/50" />
              <span className="text-xs text-amber-500/50 font-mono">
                Открыто: {new Date(unlockedAt).toLocaleString('ru-RU', {
                  day: '2-digit', month: '2-digit', year: '2-digit',
                  hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>

        {/* Close button */}
        <div className="px-5 pb-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-slate-400 hover:text-white hover:bg-slate-800/40"
            onClick={onClose}
          >
            Закрыть
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Component ─── */

export function AchievementDetailsPanel({ open, onClose }: AchievementDetailsPanelProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  /* ── Game store subscriptions ── */
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const achievementProgress = useGameStore((s) => s.achievementProgress);
  const collectedPoems = useGameStore((s) => s.collectedPoems);
  const karma = useGameStore((s) => s.playerState.karma);
  const flags = useGameStore((s) => s.playerState.flags);

  const getProgress = useCallback(
    (achievement: AchievementDefinition) =>
      resolveAchievementProgress(achievement, achievementProgress, { collectedPoems, karma, flags }),
    [achievementProgress, collectedPoems, karma, flags],
  );

  /* ── Category filter ── */
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');

  /* ── Detail popup ── */
  const [detailPopup, setDetailPopup] = useState<DetailPopupData | null>(null);

  /* ── Build unlocked map ── */
  const unlockedMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of unlockedAchievements) {
      map.set(a.id, a.unlockedAt);
    }
    return map;
  }, [unlockedAchievements]);

  /* ── Compute stats ── */
  const unlockedCount = unlockedMap.size;
  const progressPct = TOTAL_ACHIEVEMENTS > 0 ? (unlockedCount / TOTAL_ACHIEVEMENTS) * 100 : 0;

  /* ── Category stats ── */
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; unlocked: number }> = {};
    for (const cat of CATEGORY_ORDER) {
      const total = ACHIEVEMENTS.filter((a) => a.category === cat).length;
      const unlocked = ACHIEVEMENTS.filter((a) => a.category === cat && unlockedMap.has(a.id)).length;
      stats[cat] = { total, unlocked };
    }
    return stats;
  }, [unlockedMap]);

  /* ── Filter achievements ── */
  const filteredAchievements = useMemo(() => {
    if (activeCategory === 'all') return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter((a) => a.category === activeCategory);
  }, [activeCategory]);

  /* ── Group achievements by category (for "all" view) ── */
  const groupedAchievements = useMemo(() => {
    if (activeCategory !== 'all') return null;
    const groups: Record<string, AchievementDefinition[]> = {};
    for (const cat of CATEGORY_ORDER) {
      groups[cat] = ACHIEVEMENTS.filter((a) => a.category === cat);
    }
    return groups;
  }, [activeCategory]);

  /* ── Handle achievement click ── */
  const handleAchievementClick = useCallback((achievement: AchievementDefinition) => {
    setDetailPopup({
      achievement,
      unlocked: unlockedMap.has(achievement.id),
      unlockedAt: unlockedMap.get(achievement.id) });
  }, [unlockedMap]);

  /* ── Keyboard handler: [H] or Escape to close ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (detailPopup) {
          setDetailPopup(null);
        } else {
          onClose();
        }
      }
      if (e.code === 'KeyH') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, detailPopup]);

  return (
    <AnimatePresence>
      {open && (
        <FocusTrap initialFocusRef={closeButtonRef}>
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 bottom-0 w-full sm:w-[36rem]"
          {...dialogProps}
          style={{
            zIndex: UI_LAYERS.PANEL,
            background: 'linear-gradient(180deg, rgba(8,12,28,0.97) 0%, rgba(4,8,18,0.98) 100%)',
            borderLeft: '1px solid rgba(251,191,36,0.15)',
            backdropFilter: 'blur(20px)',
            boxShadow: '-20px 0 40px rgba(0,0,0,0.5), inset 1px 0 0 rgba(251,191,36,0.08)' }}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/20">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-amber-400" />
                <h2 {...titleProps} className="text-lg font-semibold text-slate-100">
                  Достижения
                </h2>
                <span className="text-[10px] text-amber-400/50 ml-1">
                  {unlockedCount}/{TOTAL_ACHIEVEMENTS} открыто
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600 hidden sm:inline">[H] закрыть</span>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  className="inline-flex size-9 items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-accent/50 transition-colors"
                  aria-label="Закрыть"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Stats section */}
            <div className="px-4 py-3 border-b border-slate-800/30">
              {/* Progress bar */}
              <div className="h-2.5 bg-slate-800/60 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #b45309, #f59e0b, #fbbf24)',
                    boxShadow: '0 0 8px rgba(251,191,36,0.3)' }}
                  initial={false}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-amber-400/50 font-mono">
                  {unlockedCount}/{TOTAL_ACHIEVEMENTS} достижений открыто
                </span>
                <span className="text-[10px] text-amber-500/40 font-mono">
                  {Math.round(progressPct)}%
                </span>
              </div>

              {/* Category mini-stats */}
              <div className="flex flex-wrap gap-2 mt-3">
                {CATEGORY_ORDER.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const stat = categoryStats[cat];
                  if (!stat || stat.total === 0) return null;
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(isActive ? 'all' : cat)}
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-mono
                        transition-all duration-200 border
                        ${isActive
                          ? 'border-amber-500/40 bg-amber-500/10'
                          : 'border-slate-700/30 bg-slate-800/30 hover:border-slate-600/50'
                        }
                      `}
                      style={{
                        color: isActive ? meta.color : 'rgba(148,163,184,0.6)' }}
                    >
                      <span className="text-xs">{meta.icon}</span>
                      <span>{meta.label}</span>
                      <span className="opacity-60">{stat.unlocked}/{stat.total}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Achievement list */}
            <ScrollArea className="flex-1 px-4 py-3">
              {activeCategory === 'all' && groupedAchievements ? (
                /* Grouped view */
                CATEGORY_ORDER.map((category) => {
                  const achievements = groupedAchievements[category];
                  if (!achievements || achievements.length === 0) return null;
                  const meta = CATEGORY_META[category];
                  const catUnlocked = achievements.filter((a) => unlockedMap.has(a.id)).length;

                  return (
                    <div key={category} className="mb-5">
                      <h3
                        className="text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5"
                        style={{ color: `${meta.color}aa` }}
                      >
                        <span className="text-sm">{meta.icon}</span>
                        {meta.label}
                        <span className="text-slate-500 ml-1">({catUnlocked}/{achievements.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {achievements.map((ach) => (
                          <AchievementCard
                            key={ach.id}
                            achievement={ach}
                            unlocked={unlockedMap.has(ach.id)}
                            unlockedAt={unlockedMap.get(ach.id)}
                            progress={unlockedMap.has(ach.id) ? null : getProgress(ach)}
                            onClick={() => handleAchievementClick(ach)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Filtered single-category view */
                <div className="grid grid-cols-1 gap-2">
                  {filteredAchievements.map((ach) => (
                    <AchievementCard
                      key={ach.id}
                      achievement={ach}
                      unlocked={unlockedMap.has(ach.id)}
                      unlockedAt={unlockedMap.get(ach.id)}
                      progress={unlockedMap.has(ach.id) ? null : getProgress(ach)}
                      onClick={() => handleAchievementClick(ach)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-800/30 bg-black/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600 font-mono">
                  volodka://achievements
                </span>
                <span className="text-[10px] text-amber-500/40 font-mono">
                  {unlockedCount}/{TOTAL_ACHIEVEMENTS}
                </span>
              </div>
            </div>
          </div>

          {/* Detail popup */}
          <AnimatePresence>
            {detailPopup && (
              <AchievementDetailPopup
                data={detailPopup}
                progress={getProgress(detailPopup.achievement)}
                onClose={() => setDetailPopup(null)}
              />
            )}
          </AnimatePresence>
        </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
}
