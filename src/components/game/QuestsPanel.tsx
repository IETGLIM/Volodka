"use client";

import React, { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QUEST_DEFINITIONS,
  getQuestProgress,
  getNextObjective,
  getNextTrackedObjective,
  checkQuestAvailability,
  isObjectiveSatisfied,
} from '@/data/quests';
import type { ExtendedQuest, QuestObjective, QuestReward } from '@/data/types';
import { useGameStore } from '@/store/gameStore';

const FACTION_UNGROUPED = '__ungrouped';

function groupQuestsByOptionalFaction(quests: ExtendedQuest[]): { label: string; quests: ExtendedQuest[] }[] {
  const hasAnyFaction = quests.some((q) => Boolean(q.faction?.trim()));
  if (!hasAnyFaction) return [{ label: '', quests }];

  const map = new Map<string, ExtendedQuest[]>();
  for (const q of quests) {
    const key = q.faction?.trim() || FACTION_UNGROUPED;
    const list = map.get(key) ?? [];
    list.push(q);
    map.set(key, list);
  }
  const keys = [...map.keys()].sort((a, b) => {
    if (a === FACTION_UNGROUPED) return 1;
    if (b === FACTION_UNGROUPED) return -1;
    return a.localeCompare(b, 'ru');
  });
  return keys.map((key) => ({
    label: key === FACTION_UNGROUPED ? 'Без категории' : key,
    quests: map.get(key)!,
  }));
}

function humanizeRewardToken(s: string): string {
  return s.replace(/_/g, ' ').replace(/\./g, ' · ');
}

const CORE_REWARD_BADGES: { key: keyof QuestReward; label: string; icon: string; className: string }[] = [
  { key: 'creativity', label: 'Креативность', icon: '🎨', className: 'bg-purple-500/20 text-purple-300' },
  { key: 'stability', label: 'Стабильность', icon: '🧠', className: 'bg-green-500/20 text-green-300' },
  { key: 'karma', label: 'Карма', icon: '✨', className: 'bg-amber-500/20 text-amber-300' },
  { key: 'mood', label: 'Настроение', icon: '😊', className: 'bg-pink-500/20 text-pink-300' },
  { key: 'skillPoints', label: 'Очки навыков', icon: '🎯', className: 'bg-cyan-500/20 text-cyan-300' },
];

const SKILL_REWARD_BADGES: { key: keyof QuestReward; label: string }[] = [
  { key: 'perception', label: 'Восприятие' },
  { key: 'introspection', label: 'Интроспекция' },
  { key: 'writing', label: 'Письмо' },
  { key: 'empathy', label: 'Эмпатия' },
  { key: 'persuasion', label: 'Убеждение' },
  { key: 'intuition', label: 'Интуиция' },
  { key: 'resilience', label: 'Стойкость' },
];

function questRewardHasVisibleChips(reward: QuestReward): boolean {
  for (const { key } of CORE_REWARD_BADGES) {
    const v = reward[key];
    if (typeof v === 'number' && v > 0) return true;
  }
  for (const { key } of SKILL_REWARD_BADGES) {
    const v = reward[key];
    if (typeof v === 'number' && v > 0) return true;
  }
  if ((reward.itemRewards?.length ?? 0) > 0) return true;
  if ((reward.unlockFlags?.length ?? 0) > 0) return true;
  return false;
}

const QuestRewardBadges = memo(function QuestRewardBadges({ reward }: { reward: QuestReward }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CORE_REWARD_BADGES.map(({ key, label, icon, className }) => {
        const v = reward[key];
        if (typeof v !== 'number' || v <= 0) return null;
        return (
          <span key={String(key)} className={`rounded px-2 py-0.5 text-xs ${className}`}>
            {icon} +{v} {label}
          </span>
        );
      })}
      {SKILL_REWARD_BADGES.map(({ key, label }) => {
        const v = reward[key];
        if (typeof v !== 'number' || v <= 0) return null;
        return (
          <span
            key={String(key)}
            className="rounded border border-slate-500/30 bg-slate-600/35 px-2 py-0.5 text-xs text-slate-100"
          >
            🧩 +{v} {label}
          </span>
        );
      })}
      {(reward.itemRewards ?? []).map((itemId) => (
        <span
          key={itemId}
          className="rounded border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-100"
        >
          📦 {humanizeRewardToken(itemId)}
        </span>
      ))}
      {(reward.unlockFlags ?? []).map((flagId) => (
        <span
          key={flagId}
          className="rounded border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-100"
        >
          🔓 {humanizeRewardToken(flagId)}
        </span>
      ))}
    </div>
  );
});

// ============================================
// OBJECTIVE ITEM
// ============================================

interface ObjectiveItemProps {
  objective: QuestObjective;
  isNext: boolean;
  currentValue: number;
}

const ObjectiveItem = memo(function ObjectiveItem({ objective, isNext, currentValue }: ObjectiveItemProps) {
  const isCompleted = isObjectiveSatisfied(objective, currentValue);
  const progress = objective.targetValue
    ? Math.round((currentValue / objective.targetValue) * 100)
    : isCompleted
      ? 100
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-2 text-sm ${isCompleted ? 'text-emerald-400' : isNext ? 'text-cyan-300' : 'text-slate-400'}`}
    >
      <span className="mt-0.5">
        {isCompleted ? '✅' : isNext ? '🎯' : '○'}
      </span>
      <div className="flex-1">
        <span className={isCompleted ? 'line-through' : ''}>{objective.text}</span>
        {objective.targetValue && (
          <span className="ml-2 text-xs text-slate-500">
            ({currentValue}/{objective.targetValue})
          </span>
        )}
        {isNext && objective.hint && !isCompleted && (
          <p className="text-xs text-cyan-500/70 mt-1 italic">
            💡 {objective.hint}
          </p>
        )}
        {objective.targetValue && !isCompleted && (
          <div className="mt-1 w-full h-1 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
});

// ============================================
// QUEST CARD
// ============================================

interface QuestCardProps {
  quest: ExtendedQuest;
  questProgress: Record<string, number>;
  isExpanded: boolean;
  onToggle: () => void;
}

const QuestCard = memo(function QuestCard({ quest, questProgress, isExpanded, onToggle }: QuestCardProps) {
  // Обновляем objectives с текущим прогрессом
  const objectivesWithProgress = useMemo(() => {
    return quest.objectives.map((obj) => ({
      ...obj,
      currentValue: questProgress[obj.id] || obj.currentValue || 0,
    }));
  }, [quest.objectives, questProgress]);

  const completedObjectives = objectivesWithProgress.filter((o) =>
    isObjectiveSatisfied(o, questProgress[o.id] || o.currentValue || 0),
  ).length;

  const progressPercent = objectivesWithProgress.length > 0
    ? (completedObjectives / objectivesWithProgress.length) * 100
    : 0;

  const nextObjective = useMemo(
    () => getNextTrackedObjective(quest, questProgress),
    [quest, questProgress],
  );

  const typeIcon = {
    main: '⭐',
    side: '📌',
    hidden: '🔮',
  }[quest.type] || '📋';

  const typeColor = {
    main: 'from-purple-500/20 to-pink-500/20 border-purple-500/50',
    side: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/50',
    hidden: 'from-amber-500/20 to-orange-500/20 border-amber-500/50',
  }[quest.type] || 'from-slate-500/20 to-slate-500/20 border-slate-500/50';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border overflow-hidden bg-gradient-to-r ${typeColor}`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{typeIcon}</span>
          <div className="text-left">
            <h3 className="font-semibold text-white">{quest.title}</h3>
            <p className="text-xs text-slate-400">{quest.description.slice(0, 50)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-400">{Math.round(progressPercent)}%</div>
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-slate-400"
          >
            ▼
          </motion.span>
        </div>
      </button>

      {/* Progress bar */}
      <div className="h-1 bg-slate-700">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2">
              <p className="text-sm text-slate-300 mb-3">{quest.description}</p>
              
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  Цели ({completedObjectives}/{objectivesWithProgress.length})
                </h4>
                {objectivesWithProgress.map((obj) => (
                  <ObjectiveItem
                    key={obj.id}
                    objective={obj}
                    isNext={nextObjective?.id === obj.id}
                    currentValue={questProgress[obj.id] || obj.currentValue || 0}
                  />
                ))}
              </div>

              {/* Rewards */}
              {quest.reward && questRewardHasVisibleChips(quest.reward) && (
                <div className="mt-3 border-t border-slate-700 pt-3">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Награды</h4>
                  <QuestRewardBadges reward={quest.reward} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ============================================
// QUESTS PANEL
// ============================================

interface QuestsPanelProps {
  onClose?: () => void;
}

export const QuestsPanel = memo(function QuestsPanel({
  onClose,
}: QuestsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Получаем данные из store
  const activeQuestIds = useGameStore((s) => s.activeQuestIds);
  const completedQuestIds = useGameStore((s) => s.completedQuestIds);
  const questProgress = useGameStore((s) => s.questProgress);
  const flags = useGameStore((s) => s.playerState.flags);
  const activateQuest = useGameStore((s) => s.activateQuest);

  const availableQuests = useMemo(() => {
    return Object.values(QUEST_DEFINITIONS).filter((q) => {
      if (q.status !== 'available') return false;
      if (activeQuestIds.includes(q.id) || completedQuestIds.includes(q.id)) return false;
      return checkQuestAvailability(q, completedQuestIds, flags);
    });
  }, [activeQuestIds, completedQuestIds, flags]);

  // Формируем активные квесты
  const activeQuests = useMemo(() => {
    return activeQuestIds
      .map((id) => {
        const def = QUEST_DEFINITIONS[id];
        if (!def) return null;
        return { ...def, status: 'active' as const };
      })
      .filter(Boolean) as ExtendedQuest[];
  }, [activeQuestIds]);

  // Формируем завершённые квесты
  const completedQuests = useMemo(() => {
    return completedQuestIds
      .map((id) => {
        const def = QUEST_DEFINITIONS[id];
        if (!def) return null;
        return { ...def, status: 'completed' as const };
      })
      .filter(Boolean) as ExtendedQuest[];
  }, [completedQuestIds]);

  const availableQuestGroups = useMemo(
    () => groupQuestsByOptionalFaction(availableQuests),
    [availableQuests],
  );
  const activeQuestGroups = useMemo(() => groupQuestsByOptionalFaction(activeQuests), [activeQuests]);
  const completedQuestGroups = useMemo(
    () => groupQuestsByOptionalFaction(completedQuests),
    [completedQuests],
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-2 top-16 z-50 w-[min(95vw,20rem)] max-h-[85vh] overflow-hidden rounded-lg border border-slate-700 bg-slate-900/95 shadow-xl backdrop-blur-md sm:right-4 sm:top-20"
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-purple-500/20 to-pink-500/20">
        <h2 className="font-bold text-lg text-white flex items-center gap-2">
          📋 Журнал квестов
          {activeQuests.length > 0 && (
            <span className="text-xs bg-purple-500/30 px-2 py-0.5 rounded-full">
              {activeQuests.length}
            </span>
          )}
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center text-slate-400 transition-colors hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      <div className="border-b border-purple-500/15 bg-black/30 px-3 py-2">
        <p className="font-mono text-[10px] leading-snug text-cyan-500/70">
          💡 Сюжетные цели: примите квест → выполните шаг (мини-игра / сцена). IT-цели — в терминале (💻), команды из подсказек или{' '}
          <span className="text-cyan-400/90">help</span>. Репутация — ⚔️.
        </p>
      </div>

      {/* Content */}
      <div className="max-h-[calc(85vh-60px)] space-y-3 overflow-y-auto p-3">
        {activeQuests.length === 0 && completedQuests.length === 0 && availableQuests.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            <p className="text-4xl mb-2">📜</p>
            <p>Нет активных квестов</p>
            <p className="text-sm mt-1">Исследуйте мир, чтобы найти приключения</p>
          </div>
        )}

        {availableQuests.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-wider text-amber-500/80 font-semibold mb-2">
              Доступные ({availableQuests.length})
            </h3>
            <div className="space-y-3">
              {availableQuestGroups.map(({ label, quests }) => (
                <div key={label || 'available-all'}>
                  {label ? (
                    <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-500/60">
                      {label}
                    </h4>
                  ) : null}
                  <div className="space-y-2">
                    {quests.map((quest) => (
                      <div
                        key={quest.id}
                        className="rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-semibold text-white">{quest.title}</h4>
                            <p className="mt-1 line-clamp-3 text-xs text-slate-400">{quest.description}</p>
                            {quest.reward && questRewardHasVisibleChips(quest.reward) && (
                              <div className="mt-2 border-t border-amber-500/15 pt-2">
                                <QuestRewardBadges reward={quest.reward} />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              activateQuest(quest.id);
                            }}
                            className="min-h-11 shrink-0 touch-manipulation rounded border border-amber-400/50 bg-amber-950/60 px-2 py-1.5 font-mono text-[11px] uppercase tracking-wide text-amber-200 hover:bg-amber-900/50"
                          >
                            Принять
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active quests */}
        {activeQuests.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
              Активные ({activeQuests.length})
            </h3>
            <div className="space-y-3">
              {activeQuestGroups.map(({ label, quests }) => (
                <div key={label || 'active-all'}>
                  {label ? (
                    <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500/90">
                      {label}
                    </h4>
                  ) : null}
                  <div className="space-y-2">
                    {quests.map((quest) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        questProgress={questProgress[quest.id] || {}}
                        isExpanded={expandedId === quest.id}
                        onToggle={() => setExpandedId(expandedId === quest.id ? null : quest.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed quests */}
        {completedQuests.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
              Завершённые ({completedQuests.length})
            </h3>
            <div className="space-y-3 opacity-60">
              {completedQuestGroups.map(({ label, quests }) => (
                <div key={label || 'completed-all'}>
                  {label ? (
                    <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500/90">
                      {label}
                    </h4>
                  ) : null}
                  <div className="space-y-2">
                    {quests.map((quest) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        questProgress={questProgress[quest.id] || {}}
                        isExpanded={expandedId === quest.id}
                        onToggle={() => setExpandedId(expandedId === quest.id ? null : quest.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default QuestsPanel;
