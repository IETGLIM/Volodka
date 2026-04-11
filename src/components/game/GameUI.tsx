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
        <div className="flex justify-between items-start">
          <StateBars state={playerState} />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onToggleMode}
              className="px-3 py-1.5 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors shadow-md"
            >
              {gameMode === 'visual-novel' ? '🎮 Свободное перемещение' : '📖 Режим сюжета'}
            </button>
            <button
              onClick={onToggleSkills}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors shadow-md ${showSkills ? 'bg-teal-500 text-white' : 'bg-teal-600/80 hover:bg-teal-500 text-white'}`}
            >
              🎯 Навыки
            </button>
            <button
              onClick={onTogglePoems}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors shadow-md ${showPoems ? 'bg-amber-500 text-white' : 'bg-amber-600/80 hover:bg-amber-500 text-white'}`}
            >
              📜 Стихи ({collectedPoemsCount})
            </button>
            <button
              onClick={onToggleQuests}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors shadow-md ${showQuests ? 'bg-purple-500 text-white' : 'bg-purple-600/80 hover:bg-purple-500 text-white'}`}
            >
              📋 Квесты
            </button>
            <button
              onClick={onToggleInventory}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors shadow-md ${showInventory ? 'bg-cyan-500 text-white' : 'bg-cyan-600/80 hover:bg-cyan-500 text-white'}`}
            >
              🎒 Инвентарь ({inventoryCount})
            </button>
            <button
              onClick={onToggleNPC}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors shadow-md ${showNPC ? 'bg-pink-500 text-white' : 'bg-pink-600/80 hover:bg-pink-500 text-white'}`}
            >
              👥 Связи
            </button>
            <button
              onClick={onSave}
              className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors shadow-md"
            >
              💾 Сохранить
            </button>
          </div>
        </div>
        
        {/* Расширяемые панели */}
        <AnimatePresence>
          {showNPC && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-3 bg-slate-800/80 rounded-lg"
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
