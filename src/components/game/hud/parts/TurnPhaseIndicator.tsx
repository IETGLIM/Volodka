import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { subscribeToCombat } from '@/engine/CombatSystem';
import type { CombatState } from '@/shared/types/game';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

export function TurnPhaseIndicator() {
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [turn, setTurn] = useState(0);
  const [status, setStatus] = useState<string>('active');
  const reducedMotion = useEffectiveReducedMotion();

  useEffect(() => {
    const unsub = subscribeToCombat((state: CombatState | null) => {
      if (!state) return;
      setIsPlayerTurn(state.isPlayerTurn);
      setTurn(state.turn);
      setStatus(state.status);
    });
    return unsub;
  }, []);

  if (status !== 'active') return null;

  return (
    <div className="turn-phase-bar flex flex-col items-center gap-1.5 w-full">
      {/* Turn label */}
      <div className="flex items-center justify-between w-full px-1">
        <motion.span
          animate={{
            opacity: isPlayerTurn ? 1 : 0.3,
            textShadow: isPlayerTurn ? '0 0 8px rgba(6,182,212,0.5)' : 'none'
          }}
          className="text-[9px] font-mono font-semibold uppercase tracking-widest text-cyan-400 transition-all duration-300"
        >
          ИГРОК
        </motion.span>
        <span className="text-[8px] font-mono text-slate-500">
          ХОД {turn}
        </span>
        <motion.span
          animate={{
            opacity: !isPlayerTurn ? 1 : 0.3,
            textShadow: !isPlayerTurn ? '0 0 8px rgba(239,68,68,0.5)' : 'none'
          }}
          className="text-[9px] font-mono font-semibold uppercase tracking-widest text-red-400 transition-all duration-300"
        >
          ВРАГ
        </motion.span>
      </div>

      {/* Phase bar */}
      <div className="turn-phase-slider relative w-full h-1 bg-slate-800/60 rounded-full overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 flex">
          <div className="w-1/2 bg-gradient-to-r from-cyan-900/30 to-transparent" />
          <div className="w-1/2 bg-gradient-to-l from-red-900/30 to-transparent" />
        </div>

        {/* Animated slider dot */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
          animate={{
            left: isPlayerTurn ? '12%' : '82%',
            backgroundColor: isPlayerTurn ? '#06b6d4' : '#ef4444',
            boxShadow: isPlayerTurn
              ? '0 0 8px rgba(6,182,212,0.6), 0 0 16px rgba(6,182,212,0.3)'
              : '0 0 8px rgba(239,68,68,0.6), 0 0 16px rgba(239,68,68,0.3)'
          }}
          transition={{ duration: reducedMotion ? 0 : 0.4, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* Status text */}
      <motion.div
        key={isPlayerTurn ? 'player' : 'enemy'}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-[8px] font-mono tracking-wider ${isPlayerTurn ? 'text-cyan-500/70' : 'text-red-500/70'}`}
      >
        {isPlayerTurn ? '▸ ВАШ ХОД' : '▹ ХОД ПРОТИВНИКА'}
      </motion.div>
    </div>
  );
}