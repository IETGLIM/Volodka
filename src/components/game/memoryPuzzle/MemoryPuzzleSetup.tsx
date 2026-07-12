import { motion } from 'framer-motion';
import {
  ACCENT_COLOR,
  ACCENT_RGB,
  DIFFICULTY_CONFIG,
  type MemoryDifficulty,
} from '@/engine/minigame/memory/memoryPuzzleConstants';

type MemoryPuzzleSetupProps = {
  difficulty: MemoryDifficulty;
  onSelectDifficulty: (difficulty: MemoryDifficulty) => void;
  onStart: () => void;
};

export function MemoryPuzzleSetup({ difficulty, onSelectDifficulty, onStart }: MemoryPuzzleSetupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="text-center py-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="text-4xl mb-4"
        aria-hidden="true"
      >
        🧠
      </motion.div>

      <h3
        className="text-xl font-bold font-mono tracking-widest uppercase mb-2"
        style={{ color: ACCENT_COLOR }}
      >
        Нейросеть
      </h3>
      <p className="text-xs font-mono mb-6" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
        Запомните и повторите паттерн нейронной сети
      </p>

      <div className="space-y-3 mb-6" role="radiogroup" aria-label="Сложность">
        {(Object.entries(DIFFICULTY_CONFIG) as [MemoryDifficulty, (typeof DIFFICULTY_CONFIG)[MemoryDifficulty]][]).map(
          ([key, cfg]) => (
            <motion.button
              key={key}
              type="button"
              role="radio"
              aria-checked={difficulty === key}
              onClick={() => onSelectDifficulty(key)}
              className="w-full px-4 py-3 rounded-md text-left transition-all duration-200"
              style={{
                background: difficulty === key ? `rgba(${ACCENT_RGB}, 0.12)` : 'rgba(0, 0, 0, 0.3)',
                border: `1.5px solid ${difficulty === key ? `rgba(${ACCENT_RGB}, 0.5)` : 'rgba(71, 85, 105, 0.2)'}`,
                boxShadow: difficulty === key ? `0 0 15px rgba(${ACCENT_RGB}, 0.15)` : 'none',
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-mono text-sm font-bold tracking-wider uppercase"
                  style={{ color: difficulty === key ? ACCENT_COLOR : 'rgba(148, 163, 184, 0.6)' }}
                >
                  {cfg.label}
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.35)' }}>
                  ×{cfg.multiplier}
                </span>
              </div>
              <p className="font-mono text-[10px] mt-1" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>
                {cfg.description}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="font-mono text-[10px]" style={{ color: `rgba(${ACCENT_RGB}, 0.6)` }}>
                  Старт: {cfg.startingLength} ячеек
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.35)' }}>
                  Скорость: {cfg.showDelay}мс
                </span>
              </div>
            </motion.button>
          ),
        )}
      </div>

      <motion.button
        type="button"
        onClick={onStart}
        className="w-full py-3 rounded-md font-mono text-sm tracking-[0.15em] uppercase font-bold transition-all duration-200"
        style={{
          background: `rgba(${ACCENT_RGB}, 0.15)`,
          border: `1px solid rgba(${ACCENT_RGB}, 0.4)`,
          color: ACCENT_COLOR,
          boxShadow: `0 0 15px rgba(${ACCENT_RGB}, 0.1)`,
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Подключиться
      </motion.button>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 justify-center">
          <span className="text-xs" style={{ color: ACCENT_COLOR }} aria-hidden="true">
            ⬡
          </span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>
            Нейрон
          </span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="text-xs" aria-hidden="true">
            🧠
          </span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>
            Жизни
          </span>
        </div>
      </div>
    </motion.div>
  );
}
