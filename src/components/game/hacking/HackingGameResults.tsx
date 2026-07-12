import { motion } from 'framer-motion';
import type { HackingGamePhase, HackingRewards } from '@/engine/minigame/hacking/hackingGameTypes';
import {
  HACKING_ACCENT_COLOR,
  HACKING_ACCENT_RGB,
  HACKING_AMBER_RGB,
  HACKING_CYAN_COLOR,
  HACKING_CYAN_RGB,
  HACKING_GREEN_RGB,
} from '@/components/game/hacking/hackingGamePresentation';

interface HackingGameResultsProps {
  phase: Extract<HackingGamePhase, 'won' | 'lost'>;
  rewards: HackingRewards | null;
  onClaimRewards: () => void;
  onRetry: () => void;
  onBackToSetup: () => void;
}

export function HackingGameResults({
  phase,
  rewards,
  onClaimRewards,
  onRetry,
  onBackToSetup,
}: HackingGameResultsProps) {
  const isWin = phase === 'won';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center py-4"
      role="status"
      aria-live="polite"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="text-4xl mb-3"
        aria-hidden="true"
      >
        {isWin ? '🔓' : '💀'}
      </motion.div>

      <h3
        className="text-lg font-bold font-mono tracking-widest uppercase mb-2"
        style={{
          color: isWin ? 'rgba(34, 197, 94, 0.9)' : HACKING_ACCENT_COLOR,
        }}
      >
        {isWin ? 'Взлом завершён' : 'Обнаружен сканером'}
      </h3>

      {isWin && rewards && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <span className="text-xs font-mono block" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
              Очки опыта
            </span>
            <motion.span
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
              className="text-3xl font-bold font-mono"
              style={{ color: HACKING_CYAN_COLOR, textShadow: `0 0 20px rgba(${HACKING_CYAN_RGB}, 0.4)` }}
            >
              {rewards.totalXP}
            </motion.span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-md p-3 mb-4 space-y-1.5"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: `1px solid rgba(${HACKING_ACCENT_RGB}, 0.1)`,
            }}
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>Базовые очки</span>
              <span style={{ color: HACKING_CYAN_COLOR }}>+20 XP</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>Собранные данные ({rewards.dataCount})</span>
              <span style={{ color: `rgba(${HACKING_GREEN_RGB}, 0.9)` }}>+{rewards.dataBonus} XP</span>
            </div>
            {rewards.bandwidthBonus > 0 && (
              <div className="flex items-center justify-between text-xs font-mono">
                <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>Бонус пропускной способности</span>
                <span style={{ color: `rgba(${HACKING_AMBER_RGB}, 0.9)` }}>+{rewards.bandwidthBonus} XP</span>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-md p-3 mb-4"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: `1px solid rgba(${HACKING_ACCENT_RGB}, 0.1)`,
            }}
          >
            <span
              className="block text-[10px] font-mono uppercase tracking-[0.15em] mb-2"
              style={{ color: `rgba(${HACKING_ACCENT_RGB}, 0.4)` }}
            >
              Награды
            </span>
            <div className="flex items-center justify-center gap-4 text-xs font-mono">
              <span style={{ color: '#00ffee' }}>+{rewards.totalXP} XP</span>
              <span style={{ color: '#ffcc00' }}>+{rewards.karmaReward} карма</span>
              <span style={{ color: HACKING_ACCENT_COLOR }}>+1 код</span>
            </div>
          </motion.div>

          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={onClaimRewards}
            className="w-full py-2.5 rounded-md font-mono text-xs tracking-[0.15em] uppercase font-bold"
            style={{
              background: `rgba(${HACKING_ACCENT_RGB}, 0.15)`,
              border: `1px solid rgba(${HACKING_ACCENT_RGB}, 0.4)`,
              color: HACKING_ACCENT_COLOR,
              boxShadow: `0 0 15px rgba(${HACKING_ACCENT_RGB}, 0.1)`,
            }}
            whileHover={{
              scale: 1.02,
              backgroundColor: `rgba(${HACKING_ACCENT_RGB}, 0.25)`,
              boxShadow: `0 0 25px rgba(${HACKING_ACCENT_RGB}, 0.2)`,
            }}
            whileTap={{ scale: 0.98 }}
          >
            Забрать награды
          </motion.button>
        </>
      )}

      {!isWin && (
        <>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-mono text-xs mb-6"
            style={{ color: 'rgba(148, 163, 184, 0.5)' }}
          >
            Сканер безопасности обнаружил ваше присутствие в сети. Попробуйте снова.
          </motion.p>

          <div className="flex gap-3">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={onRetry}
              className="flex-1 py-2.5 rounded-md font-mono text-xs tracking-[0.15em] uppercase font-bold"
              style={{
                background: `rgba(${HACKING_ACCENT_RGB}, 0.15)`,
                border: `1px solid rgba(${HACKING_ACCENT_RGB}, 0.4)`,
                color: HACKING_ACCENT_COLOR,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Повторить
            </motion.button>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={onBackToSetup}
              className="flex-1 py-2.5 rounded-md font-mono text-xs tracking-[0.15em] uppercase font-bold"
              style={{
                background: 'rgba(71, 85, 105, 0.1)',
                border: '1px solid rgba(71, 85, 105, 0.3)',
                color: 'rgba(148, 163, 184, 0.6)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Выбор сложности
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
}
