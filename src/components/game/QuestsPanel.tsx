"use client";

import React, { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QUEST_DEFINITIONS, getQuestProgress, getNextObjective } from '@/data/quests';
import type { ExtendedQuest, QuestObjective } from '@/data/types';
import { useGameStore } from '@/store/gameStore';

// ============================================
// OBJECTIVE ITEM
// ============================================

interface ObjectiveItemProps {
  objective: QuestObjective;
  isNext: boolean;
  currentValue: number;
}

const ObjectiveItem = memo(function ObjectiveItem({ objective, isNext, currentValue }: ObjectiveItemProps) {
  const isCompleted = objective.targetValue 
    ? currentValue >= objective.targetValue 
    : objective.completed;
  const progress = objective.targetValue 
    ? Math.round(currentValue / objective.targetValue * 100)
    : (isCompleted ? 100 : 0);

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
    o.targetValue ? (questProgress[o.id] || 0) >= o.targetValue : o.completed
  ).length;
  
  const progressPercent = objectivesWithProgress.length > 0 
    ? (completedObjectives / objectivesWithProgress.length) * 100 
    : 0;

  const nextObjective = useMemo(() => {
    return objectivesWithProgress.find((o) => {
      if (o.hidden) return false;
      if (o.targetValue) {
        return (questProgress[o.id] || 0) < o.targetValue;
      }
      return !o.completed;
    }) || null;
  }, [objectivesWithProgress, questProgress]);

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
              {quest.reward && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                    Награды
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(quest.reward.creativity ?? 0) > 0 && (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                        🎨 +{quest.reward.creativity} Креативность
                      </span>
                    )}
                    {(quest.reward.stability ?? 0) > 0 && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs">
                        🧠 +{quest.reward.stability} Стабильность
                      </span>
                    )}
                    {(quest.reward.karma ?? 0) > 0 && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">
                        ✨ +{quest.reward.karma} Карма
                      </span>
                    )}
                    {(quest.reward.mood ?? 0) > 0 && (
                      <span className="px-2 py-0.5 bg-pink-500/20 text-pink-300 rounded text-xs">
                        😊 +{quest.reward.mood} Настроение
                      </span>
                    )}
                    {(quest.reward.skillPoints ?? 0) > 0 && (
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-xs">
                        🎯 +{quest.reward.skillPoints} Очки навыков
                      </span>
                    )}
                  </div>
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
          💡 IT-цели из этого журнала можно закрывать в игровом терминале (💻): введите команды из подсказек шага или начните с{' '}
          <span className="text-cyan-400/90">help</span>. Репутация групп — во вкладке ⚔️.
        </p>
      </div>

      {/* Content */}
      <div className="max-h-[calc(85vh-60px)] space-y-3 overflow-y-auto p-3">
        {activeQuests.length === 0 && completedQuests.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            <p className="text-4xl mb-2">📜</p>
            <p>Нет активных квестов</p>
            <p className="text-sm mt-1">Исследуйте мир, чтобы найти приключения</p>
          </div>
        )}

        {/* Active quests */}
        {activeQuests.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
              Активные ({activeQuests.length})
            </h3>
            <div className="space-y-2">
              {activeQuests.map((quest) => (
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
        )}

        {/* Completed quests */}
        {completedQuests.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
              Завершённые ({completedQuests.length})
            </h3>
            <div className="space-y-2 opacity-60">
              {completedQuests.map((quest) => (
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
        )}
      </div>
    </motion.div>
  );
});

export default QuestsPanel;
