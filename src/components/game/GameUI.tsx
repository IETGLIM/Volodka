"use client";

import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerState, NPCRelation } from '@/data/types';

// ============================================
// ПАНЕЛЬ СОСТОЯНИЯ
// ============================================

interface StateBarsProps {
  state: PlayerState;
}

export const StateBars = memo(function StateBars({ state }: StateBarsProps) {
  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}ч ${mins}м`;
  }, []);

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">😊</span>
        <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500" 
            style={{ width: `${state.mood}%` }} 
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm">🎨</span>
        <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-400 transition-all duration-500" 
            style={{ width: `${state.creativity}%` }} 
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm">🧠</span>
        <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500" 
            style={{ width: `${state.stability}%` }} 
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm">⚡</span>
        <div className="flex gap-0.5">
          {[...Array(10)].map((_, i) => (
            <div 
              key={i} 
              className={`w-1 h-2.5 rounded-sm transition-all duration-300 ${i < state.energy ? 'bg-amber-400' : 'bg-slate-600'}`} 
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-2">
        <div className="px-2 py-1 bg-slate-800/70 rounded text-xs text-slate-400">
          Акт {state.act}
        </div>
        <div className="px-2 py-1 bg-slate-800/70 rounded text-xs text-slate-400">
          {formatTime(state.playTime)}
        </div>
      </div>
    </div>
  );
});

// ============================================
// ПАНЕЛЬ ОТНОШЕНИЙ NPC
// ============================================

interface NPCRelationsPanelProps {
  relations: NPCRelation[];
}

export const NPCRelationsPanel = memo(function NPCRelationsPanel({ relations }: NPCRelationsPanelProps) {
  const getStageLabel = useCallback((stage: NPCRelation['stage']) => {
    switch (stage) {
      case 'stranger': return 'Незнакомец';
      case 'acquaintance': return 'Знакомый';
      case 'friend': return 'Друг';
      case 'close': return 'Близкий';
      case 'estranged': return 'Отчуждённый';
    }
  }, []);

  return (
    <div className="space-y-1.5">
      {relations.map(rel => (
        <div key={rel.id} className="flex items-center gap-2">
          <span className="text-xs text-slate-300 w-16">{rel.name}</span>
          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                rel.value > 20 ? 'bg-green-500' : 
                rel.value < -10 ? 'bg-red-500' : 'bg-slate-400'
              }`}
              style={{ width: `${Math.abs(rel.value)}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{getStageLabel(rel.stage)}</span>
        </div>
      ))}
    </div>
  );
});

// ============================================
// ГЛАВНАЯ UI ПАНЕЛЬ
// ============================================

interface GameUIProps {
  playerState: PlayerState;
  npcRelations: NPCRelation[];
  collectedPoemsCount: number;
  inventoryCount: number;
  gameMode: 'visual-novel' | 'exploration' | 'dialogue';
  onToggleMode: () => void;
  onToggleSkills: () => void;
  onTogglePoems: () => void;
  onToggleQuests: () => void;
  onToggleInventory: () => void;
  onToggleNPC: () => void;
  onSave: () => void;
  showSkills: boolean;
  showPoems: boolean;
  showQuests: boolean;
  showInventory: boolean;
  showNPC: boolean;
  children?: React.ReactNode;
}

export const GameUI = memo(function GameUI({
  playerState,
  npcRelations,
  collectedPoemsCount,
  inventoryCount,
  gameMode,
  onToggleMode,
  onToggleSkills,
  onTogglePoems,
  onToggleQuests,
  onToggleInventory,
  onToggleNPC,
  onSave,
  showSkills,
  showPoems,
  showQuests,
  showInventory,
  showNPC,
  children,
}: GameUIProps) {
  return (
    <>
      {/* Верхняя панель */}
      <div className="relative z-10 p-3 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex justify-between items-start gap-3 flex-wrap">
          <StateBars state={playerState} />
          <div className="shrink-0 rounded-sm border border-cyan-500/20 bg-slate-950/80 px-2 py-2 font-mono shadow-[inset_0_1px_0_0_rgba(0,255,255,0.06)]">
            <div
              className="mb-2 border-b border-cyan-500/15 pb-1.5 text-center text-[9px] uppercase tracking-[0.28em] text-cyan-500/55"
              aria-hidden
            >
              ╔═ SYS.INTERFACE ═╗
            </div>
            <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={onToggleMode}
              className="rounded-sm border border-slate-600/40 bg-slate-800/90 px-3 py-1.5 text-sm text-white transition-colors hover:bg-slate-700/90"
              aria-label={
                gameMode === 'visual-novel'
                  ? 'Переключить на свободное перемещение по сцене'
                  : 'Переключить на режим визуальной новеллы'
              }
            >
              {gameMode === 'visual-novel' ? '🎮 Свободное перемещение' : '📖 Режим сюжета'}
            </button>
            <button
              type="button"
              onClick={onToggleSkills}
              className={`rounded-sm border border-teal-500/30 px-3 py-1.5 text-sm transition-colors ${showSkills ? 'bg-teal-600 text-white' : 'bg-teal-950/80 text-white hover:bg-teal-800/90'}`}
              aria-label={showSkills ? 'Закрыть панель навыков' : 'Открыть панель навыков'}
            >
              🎯 Навыки
            </button>
            <button
              type="button"
              onClick={onTogglePoems}
              className={`rounded-sm border border-amber-500/30 px-3 py-1.5 text-sm transition-colors ${showPoems ? 'bg-amber-600 text-white' : 'bg-amber-950/80 text-white hover:bg-amber-800/90'}`}
              aria-label={`${showPoems ? 'Закрыть' : 'Открыть'} список стихов, собрано: ${collectedPoemsCount}`}
            >
              📜 Стихи ({collectedPoemsCount})
            </button>
            <button
              type="button"
              onClick={onToggleQuests}
              className={`rounded-sm border border-purple-500/30 px-3 py-1.5 text-sm transition-colors ${showQuests ? 'bg-purple-600 text-white' : 'bg-purple-950/80 text-white hover:bg-purple-800/90'}`}
              aria-label={showQuests ? 'Закрыть панель квестов' : 'Открыть панель квестов'}
            >
              📋 Квесты
            </button>
            <button
              type="button"
              onClick={onToggleInventory}
              className={`rounded-sm border border-cyan-500/30 px-3 py-1.5 text-sm transition-colors ${showInventory ? 'bg-cyan-600 text-white' : 'bg-cyan-950/80 text-white hover:bg-cyan-800/90'}`}
              aria-label={`${showInventory ? 'Закрыть' : 'Открыть'} инвентарь, предметов: ${inventoryCount}`}
            >
              🎒 Инвентарь ({inventoryCount})
            </button>
            <button
              type="button"
              onClick={onToggleNPC}
              className={`rounded-sm border border-pink-500/30 px-3 py-1.5 text-sm transition-colors ${showNPC ? 'bg-pink-600 text-white' : 'bg-pink-950/80 text-white hover:bg-pink-800/90'}`}
              aria-label={showNPC ? 'Закрыть панель отношений с персонажами' : 'Открыть панель отношений с персонажами'}
            >
              👥 Связи
            </button>
            <button
              type="button"
              onClick={onSave}
              className="rounded-sm border border-emerald-500/35 bg-emerald-950/90 px-3 py-1.5 text-sm text-white transition-colors hover:bg-emerald-800/90"
              aria-label="Сохранить игру"
            >
              💾 Сохранить
            </button>
            </div>
          </div>
        </div>
        
        {/* Расширяемые панели */}
        <AnimatePresence>
          {showNPC && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 rounded-sm border border-cyan-500/15 bg-slate-900/85 p-3 font-mono game-fm-layer game-fm-layer-promote"
            >
              <NPCRelationsPanel relations={npcRelations} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {children}
    </>
  );
});

export default GameUI;
