import { motion, AnimatePresence } from 'framer-motion';
import {
  ACCENT_COLOR,
  ACCENT_RGB,
  CYAN_RGB,
  MAX_LIVES,
  RED_RGB,
  type MemoryGamePhase,
} from '@/engine/minigame/memory/memoryPuzzleConstants';
import { MemoryPuzzleGrid } from '@/components/game/memoryPuzzle/MemoryPuzzleGrid';

type MemoryPuzzleGameViewProps = {
  gamePhase: MemoryGamePhase;
  round: number;
  patternLength: number;
  playerInputLength: number;
  lives: number;
  score: number;
  difficultyLabel: string;
  activeCell: number | null;
  wrongCell: number | null;
  correctWave: boolean;
  patternShowing: boolean;
  focusedCell: number;
  liveAnnouncement: string;
  onCellClick: (index: number) => void;
};

export function MemoryPuzzleGameView({
  gamePhase,
  round,
  patternLength,
  playerInputLength,
  lives,
  score,
  difficultyLabel,
  activeCell,
  wrongCell,
  correctWave,
  patternShowing,
  focusedCell,
  liveAnnouncement,
  onCellClick,
}: MemoryPuzzleGameViewProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </span>

      <div
        className="flex items-center justify-between px-3 py-2 rounded-md mb-3"
        style={{ background: 'rgba(0, 0, 0, 0.3)', border: `1px solid rgba(${ACCENT_RGB}, 0.1)` }}
        aria-hidden="true"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>
              Раунд
            </span>
            <motion.span
              key={round}
              initial={{ scale: 1.3, color: ACCENT_COLOR }}
              animate={{ scale: 1, color: 'rgba(148, 163, 184, 0.8)' }}
              className="font-mono text-xs font-bold"
            >
              {round}
            </motion.span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>
              Паттерн
            </span>
            <span className="font-mono text-xs" style={{ color: `rgba(${ACCENT_RGB}, 0.7)` }}>
              {playerInputLength}/{patternLength}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <span
                key={i}
                className="text-sm"
                style={{ opacity: i < lives ? 1 : 0.2, filter: i < lives ? 'none' : 'grayscale(1)' }}
              >
                🧠
              </span>
            ))}
          </div>
          <motion.span
            key={score}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="font-mono text-xs font-bold"
            style={{ color: ACCENT_COLOR, textShadow: `0 0 8px rgba(${ACCENT_RGB}, 0.3)` }}
          >
            {score}
          </motion.span>
          <span
            className="font-mono text-[10px] px-1.5 py-0.5 rounded"
            style={{
              background: `rgba(${ACCENT_RGB}, 0.08)`,
              border: `1px solid rgba(${ACCENT_RGB}, 0.2)`,
              color: `rgba(${ACCENT_RGB}, 0.6)`,
            }}
          >
            {difficultyLabel}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {gamePhase === 'showing' ? (
          <motion.div
            key="showing"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="text-center mb-2"
            aria-hidden="true"
          >
            <span
              className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: `rgba(${ACCENT_RGB}, 0.7)`, textShadow: `0 0 8px rgba(${ACCENT_RGB}, 0.3)` }}
            >
              ▶ Запоминайте паттерн
            </span>
          </motion.div>
        ) : null}
        {gamePhase === 'input' ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="text-center mb-2"
            aria-hidden="true"
          >
            <span
              className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: `rgba(${CYAN_RGB}, 0.7)`, textShadow: `0 0 8px rgba(${CYAN_RGB}, 0.3)` }}
            >
              ◈ Повторите паттерн
            </span>
          </motion.div>
        ) : null}
        {gamePhase === 'wrong' ? (
          <motion.div
            key="wrong"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="text-center mb-2"
            aria-hidden="true"
          >
            <span
              className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: `rgba(${RED_RGB}, 0.9)`, textShadow: `0 0 8px rgba(${RED_RGB}, 0.3)` }}
            >
              ✕ Ошибка! -1 🧠
            </span>
          </motion.div>
        ) : null}
        {gamePhase === 'correct' ? (
          <motion.div
            key="correct"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="text-center mb-2"
            aria-hidden="true"
          >
            <span
              className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: ACCENT_COLOR, textShadow: `0 0 8px rgba(${ACCENT_RGB}, 0.3)` }}
            >
              ✓ Паттерн верный!
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <MemoryPuzzleGrid
        activeCell={activeCell}
        wrongCell={wrongCell}
        correctWave={correctWave}
        isClickable={gamePhase === 'input' && !patternShowing}
        focusedCell={focusedCell}
        onCellClick={onCellClick}
      />

      <p className="font-mono text-[10px] text-center mt-3" style={{ color: 'rgba(148, 163, 184, 0.35)' }}>
        {gamePhase === 'showing'
          ? 'Enter или A — пропустить показ. Стрелки — выбор ячейки.'
          : 'Смотрите на подсвеченные ячейки, затем повторите последовательность'}
      </p>
    </motion.div>
  );
}
