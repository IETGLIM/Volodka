/* Victory / defeat outcome panels extracted from CombatUI facade.
 * v4.56.2: DefeatScreen получил кнопку «Продолжить путь» — мгновенный рестарт
 * (energy поднята до безопасного уровня, бой закрывается сразу, без 3-сек ждания). */

import { motion } from 'framer-motion';
import type { CombatReward } from '@/shared/types/game';
import { restartAfterDefeat } from '@/engine/CombatSystem';

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
      <div className="gradient-text-emerald text-xl font-bold text-emerald-400 font-mono combat-victory-title" style={{ textShadow: '0 0 12px #10b98180' }}>
        ПОБЕДА!
      </div>
      <div className="combat-stats-summary grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
        <span className="combat-stat-row text-slate-400">ОПЫТ:</span>
        <span className="combat-stat-row text-cyan-400">+{rewards.xp}</span>
        <span className="combat-stat-row text-slate-400">Карма:</span>
        <span className="combat-stat-row text-amber-400">+{rewards.karma}</span>
        <span className="combat-stat-row text-slate-400">Кредиты:</span>
        <span className="combat-stat-row text-yellow-300">+{rewards.credits}</span>
        {rewards.lootItems.length > 0 && (
          <>
            <span className="combat-stat-row text-slate-400">Добыча:</span>
            <span className="combat-stat-row text-emerald-400">✓</span>
          </>
        )}
        {maxCombo >= 2 && (
          <>
            <span className="combat-stat-row text-slate-400">Комбо:</span>
            <span className="combat-stat-row text-orange-400">x{maxCombo}</span>
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
      <div className="neon-text-rose text-xl font-bold text-red-400 font-mono combat-defeat-title" style={{ textShadow: '0 0 12px #ef444480' }}>
        ПОРАЖЕНИЕ
      </div>
      <div className="text-xs text-slate-400 font-mono text-center">
        Тьма поглощает... но не навсегда.
      </div>
      {/* FIX (v4.56.2): мгновенный рестарт — требование игрока. Кнопка появляется
          сразу, восстанавливает силы и возвращает в мир без ожидания. */}
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={restartAfterDefeat}
        autoFocus
        className="mt-1 px-6 py-2.5 rounded-md border border-amber-500/50 bg-amber-950/60 text-amber-300 font-mono text-sm font-bold tracking-wide cursor-pointer transition-colors hover:bg-amber-900/70 hover:border-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 combat-defeat-restart"
        style={{ textShadow: '0 0 8px rgba(251,191,36,0.4)' }}
      >
        ⚡ Продолжить путь
      </motion.button>
      <div className="text-[10px] text-slate-500 font-mono">
        Силы частично восстановлены · без ожидания
      </div>
    </motion.div>
  );
}
