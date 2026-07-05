import { motion } from 'framer-motion';
import {
  ACCENT_COLOR,
  ACCENT_RGB,
  CYAN_RGB,
} from '@/engine/minigame/memory/memoryPuzzleConstants';
import { calculateMemoryRewards, getRating } from '@/engine/minigame/memory/memoryPuzzlePresentation';

type MemoryPuzzleResultsProps = {
  score: number;
  roundsCompleted: number;
  patternLength: number;
  multiplier: number;
  rewardsClaimed: boolean;
  onClaim: () => void;
  onRetry: () => void;
};

export function MemoryPuzzleResults({
  score,
  roundsCompleted,
  patternLength,
  multiplier,
  rewardsClaimed,
  onClaim,
  onRetry,
}: MemoryPuzzleResultsProps) {
  const rating = getRating(roundsCompleted);
  const rewards = calculateMemoryRewards(roundsCompleted);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center py-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="text-4xl mb-3"
        aria-hidden="true"
      >
        🧠
      </motion.div>

      <h3 className="text-lg font-bold font-mono tracking-widest uppercase mb-2" style={{ color: ACCENT_COLOR }}>
        Сеанс завершён
      </h3>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-3">
        <span
          className="font-mono text-sm font-bold tracking-[0.15em] uppercase"
          style={{ color: rating.color, textShadow: `0 0 10px ${rating.color}` }}
        >
          {rating.label}
        </span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-4">
        <span className="text-xs font-mono block" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
          Итоговый счёт
        </span>
        <motion.span
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
          className="text-3xl font-bold font-mono"
          style={{ color: ACCENT_COLOR, textShadow: `0 0 20px rgba(${ACCENT_RGB}, 0.4)` }}
        >
          {score}
        </motion.span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-md p-3 mb-4 space-y-1.5"
        style={{ background: 'rgba(0, 0, 0, 0.3)', border: `1px solid rgba(${ACCENT_RGB}, 0.1)` }}
      >
        <div className="flex items-center justify-between text-xs font-mono">
          <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>Раундов пройдено</span>
          <span style={{ color: ACCENT_COLOR }}>{roundsCompleted}</span>
        </div>
        <div className="flex items-center justify-between text-xs font-mono">
          <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>Множитель сложности</span>
          <span style={{ color: `rgba(${CYAN_RGB}, 0.9)` }}>×{multiplier}</span>
        </div>
        <div className="flex items-center justify-between text-xs font-mono">
          <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>Длина паттерна</span>
          <span style={{ color: 'rgba(148, 163, 184, 0.7)' }}>{patternLength}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="rounded-md p-3 mb-4"
        style={{ background: 'rgba(0, 0, 0, 0.3)', border: `1px solid rgba(${ACCENT_RGB}, 0.1)` }}
      >
        <span
          className="block text-[10px] font-mono uppercase tracking-[0.15em] mb-2"
          style={{ color: `rgba(${ACCENT_RGB}, 0.4)` }}
        >
          Награды
        </span>
        <div className="flex items-center justify-center gap-4 text-xs font-mono">
          <span style={{ color: '#00ffee' }}>+{rewards.xpReward} XP</span>
          <span style={{ color: '#ffcc00' }}>+{rewards.karmaReward} карма</span>
          <span style={{ color: ACCENT_COLOR }}>+1 код</span>
        </div>
      </motion.div>

      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        onClick={onClaim}
        disabled={rewardsClaimed}
        className="w-full py-2.5 rounded-md font-mono text-xs tracking-[0.15em] uppercase font-bold transition-all duration-200"
        style={{
          background: rewardsClaimed ? 'rgba(71, 85, 105, 0.1)' : `rgba(${ACCENT_RGB}, 0.15)`,
          border: `1px solid ${rewardsClaimed ? 'rgba(71, 85, 105, 0.2)' : `rgba(${ACCENT_RGB}, 0.4)`}`,
          color: rewardsClaimed ? 'rgba(148, 163, 184, 0.3)' : ACCENT_COLOR,
          boxShadow: rewardsClaimed ? 'none' : `0 0 15px rgba(${ACCENT_RGB}, 0.1)`,
          cursor: rewardsClaimed ? 'default' : 'pointer',
        }}
        whileHover={!rewardsClaimed ? { scale: 1.02 } : {}}
        whileTap={!rewardsClaimed ? { scale: 0.98 } : {}}
      >
        {rewardsClaimed ? 'Награды получены' : 'Забрать награды'}
      </motion.button>

      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={onRetry}
        className="w-full py-2 mt-2 rounded-md font-mono text-xs tracking-[0.1em] uppercase transition-all duration-200"
        style={{
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(71, 85, 105, 0.2)',
          color: 'rgba(148, 163, 184, 0.5)',
        }}
        whileHover={{ scale: 1.01, borderColor: 'rgba(71, 85, 105, 0.4)' }}
        whileTap={{ scale: 0.99 }}
      >
        Играть снова
      </motion.button>
    </motion.div>
  );
}
