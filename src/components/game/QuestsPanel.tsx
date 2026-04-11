"use client";

import React, { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QUEST_DEFINITIONS, getQuestProgress, getNextObjective } from '@/data/quests';
import type { ExtendedQuest, QuestObjective } from '@/data/types';

// ============================================
// OBJECTIVE ITEM
// ============================================

interface ObjectiveItemProps {
  objective: QuestObjective;
  isNext: boolean;
}

const ObjectiveItem = memo(function ObjectiveItem({ objective, isNext }: ObjectiveItemProps) {
  const isCompleted = objective.completed;
  const progress = objective.targetValue 
    ? Math.round((objective.currentValue || 0) / objective.targetValue * 100)
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
        <span>{objective.text}</span>
        {objective.targetValue && (
          <span className="ml-2 text-xs text-slate-500">
            ({objective.currentValue || 0}/{objective.targetValue})
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
  isExpanded: boolean;
  onToggle: () => void;
}

const QuestCard = memo(function QuestCard({ quest, isExpanded, onToggle }: QuestCardProps) {
  const progress = getQuestProgress(quest);
  const nextObjective = getNextObjective(quest);
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
          <div className="text-xs text-slate-400">{Math.round(progress)}%</div>
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
          animate={{ width: `${progress}%` }}
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
                  Цели
                </h4>
                {quest.objectives.map((obj, i) => (
                  <ObjectiveItem
                    key={obj.id}
                    objective={obj}
                    isNext={nextObjective?.id === obj.id}
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
                    {quest.reward.creativity > 0 && (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                        🎨 +{quest.reward.creativity} Креативность
                      </span>
                    )}
                    {quest.reward.stability > 0 && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs">
                        🧠 +{quest.reward.stability} Стабильность
                      </span>
                    )}
                    {quest.reward.karma > 0 && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">
                        ✨ +{quest.reward.karma} Карма
                      </span>
                    )}
                    {quest.reward.mood > 0 && (
                      <span className="px-2 py-0.5 bg-pink-500/20 text-pink-300 rounded text-xs">
                        😊 +{quest.reward.mood} Настроение
                      </span>
                    )}
                    {quest.reward.skillPoints > 0 && (
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
  activeQuestIds?: string[];
  completedQuestIds?: string[];
  onClose?: () => void;
}

export const QuestsPanel = memo(function QuestsPanel({
  activeQuestIds = ['main_goal', 'first_words'],
  completedQuestIds = [],
  onClose,
}: QuestsPanelProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const activeQuests = useMemo(() => {
    return activeQuestIds
      .map(id => QUEST_DEFINITIONS[id])
      .filter(Boolean)
      .map(q => ({ ...q, status: 'active' as const }));
  }, [activeQuestIds]);

  const completedQuests = useMemo(() => {
    return completedQuestIds
      .map(id => QUEST_DEFINITIONS[id])
      .filter(Boolean)
      .map(q => ({ ...q, status: 'completed' as const }));
  }, [completedQuestIds]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-4 top-20 w-80 max-h-[70vh] bg-slate-900/95 backdrop-blur-md rounded-lg border border-slate-700 shadow-xl overflow-hidden z-50"
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-purple-500/20 to-pink-500/20">
        <h2 className="font-bold text-lg text-white flex items-center gap-2">
          📋 Журнал квестов
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3 overflow-y-auto max-h-[calc(70vh-60px)] space-y-3">
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
              {activeQuests.map(quest => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
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
              {completedQuests.map(quest => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
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
