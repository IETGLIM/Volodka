'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { SceneId } from '@/data/types';
import { POEMS } from '@/data/poems';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { PoemReveal } from './PoemComponents';

export function KernelPanicOverlay({ isActive, onCalmDown }: { isActive: boolean; onCalmDown: () => void }) {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[60] kernel-panic-overlay flex items-center justify-center">
      <div className="text-center p-8">
        <h2 className="text-4xl font-bold text-red-500 kernel-panic-text mb-4">
          ⚠️ KERNEL PANIC ⚠️
        </h2>
        <p className="text-red-300/80 text-lg mb-8 kernel-panic-text">
          Критический уровень стресса. Система нестабильна.
        </p>
        <button
          type="button"
          onClick={onCalmDown}
          className="px-8 py-3 bg-red-900/80 hover:bg-red-800/80 border border-red-600/50 text-red-200 rounded-lg text-lg transition-colors"
          aria-label="Снизить стресс и выйти из режима паники"
        >
          🧘 Успокоиться
        </button>
      </div>
    </div>
  );
}

export function PanelWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 game-fm-layer game-fm-layer-promote"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 max-h-[85vh] max-w-[95vw] overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </motion.div>
  );
}

export function PoemRevealOverlay({ poemId, onClose }: { poemId: string; onClose: () => void }) {
  const poem = POEMS.find((p) => p.id === poemId);
  if (!poem) return null;

  return <PoemReveal poem={poem} intro={poem.intro} onClose={onClose} />;
}

export function SceneNPCList({ sceneId, onInteract }: { sceneId: SceneId; onInteract: (npcId: string) => void }) {
  const npcsForScene = useMemo(() => {
    return Object.values(NPC_DEFINITIONS).filter((npc) => npc.sceneId === sceneId);
  }, [sceneId]);

  if (npcsForScene.length === 0) return null;

  return (
    <div className="absolute bottom-32 left-4 z-20 flex flex-col gap-2">
      {npcsForScene.map((npc) => (
        <motion.button
          key={npc.id}
          type="button"
          onClick={() => onInteract(npc.id)}
          className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-sm border border-slate-600/30 rounded-lg text-sm text-slate-300 transition-all flex items-center gap-2 game-fm-layer game-fm-layer-promote"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={`Поговорить с персонажем: ${npc.name}`}
        >
          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs text-white font-bold">
            {npc.name.charAt(0)}
          </span>
          {npc.name}
        </motion.button>
      ))}
    </div>
  );
}

export function EnergyBar({
  energy,
  maxEnergy,
  energyLevel,
}: {
  energy: number;
  maxEnergy: number;
  energyLevel: 'exhausted' | 'tired' | 'normal' | 'energized';
}) {
  const percentage = (energy / maxEnergy) * 100;

  const levelColor = {
    exhausted: 'bg-red-500',
    tired: 'bg-amber-500',
    normal: 'bg-cyan-400',
    energized: 'bg-emerald-400',
  }[energyLevel];

  const levelGlow = {
    exhausted: 'shadow-red-500/50',
    tired: 'shadow-amber-500/40',
    normal: 'shadow-cyan-400/30',
    energized: 'shadow-emerald-400/40',
  }[energyLevel];

  const levelLabel = {
    exhausted: 'Истощение',
    tired: 'Усталость',
    normal: 'Бодрость',
    energized: 'Энергия',
  }[energyLevel];

  return (
    <div className="fixed bottom-4 right-4 z-40 pointer-events-none select-none">
      <div
        className="flex items-center gap-2 px-3 py-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700/30 rounded-sm"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
        }}
      >
        <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">{levelLabel}</span>

        <div className="w-16 h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${levelColor} rounded-full ${levelGlow}`}
            style={{ boxShadow: `0 0 6px currentColor` }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        <span className="text-[10px] font-mono text-slate-300">
          {energy}/{maxEnergy}
        </span>
      </div>
    </div>
  );
}
