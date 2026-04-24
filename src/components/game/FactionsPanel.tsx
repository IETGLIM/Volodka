"use client";

import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FACTIONS, 
  getStandingLevel, 
  getStandingColor, 
  getStandingIcon, 
  getStandingName,
  type FactionId,
  type FactionReputation 
} from '@/data/factions';
import { useGameStore } from '@/state/gameStore';

// ============================================
// FACTION BADGE
// ============================================

interface FactionBadgeProps {
  factionId: FactionId;
  reputation: FactionReputation;
  isCompact?: boolean;
}

const FactionBadge = memo(function FactionBadge({ factionId, reputation, isCompact = false }: FactionBadgeProps) {
  const faction = FACTIONS[factionId];
  if (!faction) return null;

  const standingColor = getStandingColor(reputation.standing);
  const standingIcon = getStandingIcon(reputation.standing);
  const standingName = getStandingName(reputation.standing);

  if (isCompact) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 bg-slate-800/50 rounded-lg">
        <span>{faction.icon}</span>
        <span className="text-sm text-slate-300">{faction.name}</span>
        <span className={`text-xs ${standingColor}`}>{standingIcon}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-3 rounded-lg border bg-gradient-to-r ${faction.color} border-opacity-30`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{faction.icon}</span>
          <div>
            <h3 className="font-semibold text-white">{faction.name}</h3>
            <p className={`text-xs ${standingColor} flex items-center gap-1`}>
              {standingIcon} {standingName}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${standingColor}`}>
            {reputation.value > 0 ? '+' : ''}{reputation.value}
          </div>
          <div className="text-xs text-slate-400">репутация</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden mb-2">
        <motion.div
          className={`h-full bg-gradient-to-r ${faction.color}`}
          initial={{ width: 0 }}
          animate={{ width: `${(reputation.value + 100) / 2}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Scale markers */}
      <div className="flex justify-between text-xs text-slate-500 mb-2">
        <span>Враг</span>
        <span>Нейтрал</span>
        <span>Союзник</span>
      </div>

      {/* Interactions count */}
      {reputation.interactions > 0 && (
        <div className="text-xs text-slate-400">
          Взаимодействий: {reputation.interactions}
        </div>
      )}
    </motion.div>
  );
});

// ============================================
// FACTIONS PANEL
// ============================================

interface FactionsPanelProps {
  onClose?: () => void;
}

export const FactionsPanel = memo(function FactionsPanel({ onClose }: FactionsPanelProps) {
  const factionReputations = useGameStore((s) => s.factionReputations);

  // Сортируем фракции по репутации
  const sortedFactions = useMemo(() => {
    return Object.entries(factionReputations)
      .sort(([, a], [, b]) => b.value - a.value)
      .map(([id, rep]) => ({ id: id as FactionId, rep }));
  }, [factionReputations]);

  // Статистика
  const stats = useMemo(() => {
    const values = Object.values(factionReputations);
    return {
      allies: values.filter((r) => r.standing === 'ally' || r.standing === 'trusted').length,
      friends: values.filter((r) => r.standing === 'friendly').length,
      neutrals: values.filter((r) => r.standing === 'neutral').length,
      enemies: values.filter((r) => r.standing === 'unfriendly' || r.standing === 'hostile').length,
    };
  }, [factionReputations]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-2 top-16 z-50 w-[min(95vw,20rem)] max-h-[85vh] overflow-hidden rounded-lg border border-slate-700 bg-slate-900/95 shadow-xl backdrop-blur-md sm:right-4 sm:top-20"
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-amber-500/20 to-orange-500/20">
        <h2 className="font-bold text-lg text-white flex items-center gap-2">
          ⚔️ Фракции
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

      {/* Stats */}
      <div className="p-2 border-b border-slate-700 flex justify-around text-xs">
        <div className="text-center">
          <span className="text-amber-400 font-bold">{stats.allies}</span>
          <p className="text-slate-400">Союзники</p>
        </div>
        <div className="text-center">
          <span className="text-cyan-400 font-bold">{stats.friends}</span>
          <p className="text-slate-400">Друзья</p>
        </div>
        <div className="text-center">
          <span className="text-slate-400 font-bold">{stats.neutrals}</span>
          <p className="text-slate-400">Нейтралы</p>
        </div>
        <div className="text-center">
          <span className="text-red-400 font-bold">{stats.enemies}</span>
          <p className="text-slate-400">Враги</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[calc(85vh-120px)] space-y-3 overflow-y-auto p-3">
        {sortedFactions.map(({ id, rep }) => (
          <FactionBadge
            key={id}
            factionId={id}
            reputation={rep}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="p-2 border-t border-slate-700 bg-slate-800/50">
        <p className="text-center text-xs leading-snug text-slate-400">
          💡 Репутация растёт от сюжетных выборов и диалогов на локациях. Союзники открывают побочные линии; квесты по фракциям дублируются в 📋.
        </p>
      </div>
    </motion.div>
  );
});

// ============================================
// COMPACT FACTION DISPLAY (for HUD)
// ============================================

interface CompactFactionsProps {
  maxShow?: number;
}

export const CompactFactions = memo(function CompactFactions({ maxShow = 3 }: CompactFactionsProps) {
  const factionReputations = useGameStore((s) => s.factionReputations);

  const topFactions = useMemo(() => {
    return Object.entries(factionReputations)
      .filter(([, r]) => r.value !== 0)
      .sort(([, a], [, b]) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, maxShow)
      .map(([id, rep]) => ({ id: id as FactionId, rep }));
  }, [factionReputations, maxShow]);

  if (topFactions.length === 0) return null;

  return (
    <div className="flex gap-1 flex-wrap">
      {topFactions.map(({ id, rep }) => (
        <FactionBadge
          key={id}
          factionId={id}
          reputation={rep}
          isCompact
        />
      ))}
    </div>
  );
});

export default FactionsPanel;
