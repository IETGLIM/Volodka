/* Victory / defeat outcome panels extracted from CombatUI facade. */

import { motion } from 'framer-motion';
import type { CombatReward } from '@/shared/types/game';

export function VictoryScreen({
  rewards,
  maxCombo,
}: {
  rewards: CombatReward;
  maxCombo: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-3 py-4"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], textShadow: ['0 0 20px #10b981', '0 0 40px #10b981', '0 0 20px #10b981'] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-4xl"
      >
        🏆
      </motion.div>
      <div className="text-xl font-bold text-emerald-400 font-mono" style={{ textShadow: '0 0 12px #10b98180' }}>
        ПОБЕДА!
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
        <span className="text-slate-400">ОПЫТ:</span>
        <span className="text-cyan-400">+{rewards.xp}</span>
        <span className="text-slate-400">Карма:</span>
        <span className="text-amber-400">+{rewards.karma}</span>
        <span className="text-slate-400">Кредиты:</span>
        <span className="text-yellow-300">+{rewards.credits}</span>
        {rewards.lootItems.length > 0 && (
          <>
            <span className="text-slate-400">Добыча:</span>
            <span className="text-emerald-400">✓</span>
          </>
        )}
        {maxCombo >= 2 && (
          <>
            <span className="text-slate-400">Комбо:</span>
            <span className="text-orange-400">x{maxCombo}</span>
          </>
        )}
      </div>
      {rewards.skillXp && Object.keys(rewards.skillXp).length > 0 && (
        <div className="text-[9px] text-slate-500 font-mono">
          {Object.entries(rewards.skillXp).map(([skill, xp]) => (
            <span key={skill} className="mr-2">{skill}: +{xp}</span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function DefeatScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-3 py-4"
    >
      <motion.div
        animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
        transition={{ duration: 0.5 }}
        className="text-4xl"
      >
        💀
      </motion.div>
      <div className="text-xl font-bold text-red-400 font-mono" style={{ textShadow: '0 0 12px #ef444480' }}>
        ПОРАЖЕНИЕ
      </div>
      <div className="text-xs text-slate-400 font-mono text-center">
        Тьма поглощает... но не навсегда.
      </div>
    </motion.div>
  );
}
