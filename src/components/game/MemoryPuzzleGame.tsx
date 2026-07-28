
/* ─── Volodka RPG – Memory Puzzle Minigame "НЕЙРОСЕТЬ" ─── */
/* Cyberpunk Simon-Says pattern matching game: a 4x4 grid of neural cells
 * lights up in sequence, and the player must repeat the pattern.
 * Each round adds one step. 3 difficulty levels, 3 lives, score-based rewards. */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { completeMinigame } from '@/engine/minigame/claimMinigameRewards';

/* ─── Accent colors (emerald theme for neural network) ─── */
const ACCENT_RGB = '52, 211, 153';
const ACCENT_COLOR = `rgba(${ACCENT_RGB}, 0.9)`;
const RED_RGB = '239, 68, 68';
const CYAN_RGB = '0, 229, 255';

/* ─── Types ─── */
type Difficulty = 'novice' | 'hacker' | 'master';
type GamePhase = 'setup' | 'showing' | 'input' | 'correct' | 'wrong' | 'results';

interface MemoryPuzzleGameProps {
  onClose: () => void;
}

/* ─── Difficulty configurations ─── */
const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string;
  startingLength: number;
  showDelay: number;       // ms between pattern cell highlights
  showDuration: number;    // ms each cell stays lit
  multiplier: number;
  description: string;
}> = {
  novice: {
    label: 'Новичок',
    startingLength: 3,
    showDelay: 700,
    showDuration: 500,
    multiplier: 1,
    description: 'Медленный показ, короткий старт',
  },
  hacker: {
    label: 'Хакер',
    startingLength: 4,
    showDelay: 500,
    showDuration: 350,
    multiplier: 1.5,
    description: 'Средняя скорость, средний старт',
  },
  master: {
    label: 'Мастер',
    startingLength: 5,
    showDelay: 350,
    showDuration: 250,
    multiplier: 2,
    description: 'Быстрый показ, длинный старт',
  },
};

const GRID_SIZE = 4;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
const MAX_LIVES = 3;

/* ─── Generate random pattern ─── */
function generatePattern(length: number, existing: number[] = []): number[] {
  const pattern = [...existing];
  while (pattern.length < length) {
    const next = Math.floor(Math.random() * TOTAL_CELLS);
    // Allow repeated cells (makes it harder), but not the same cell twice in a row
    if (pattern.length > 0 && pattern[pattern.length - 1] === next) continue;
    pattern.push(next);
  }
  return pattern;
}

/* ─── Rating calculation ─── */
function getRating(roundsCompleted: number): { label: string; color: string } {
  if (roundsCompleted >= 9) return { label: 'Нейромант', color: `rgba(${ACCENT_RGB}, 0.95)` };
  if (roundsCompleted >= 5) return { label: 'Оператор', color: `rgba(${CYAN_RGB}, 0.9)` };
  return { label: 'Новичок', color: 'rgba(148, 163, 184, 0.7)' };
}

/* ─── Cell component ─── */
function NeuralCell({
  index: _index,
  isActive,
  isWrong,
  isCorrectWave,
  isClickable,
  onClick,
  delay = 0,
}: {
  index: number;
  isActive: boolean;
  isWrong: boolean;
  isCorrectWave: boolean;
  isClickable: boolean;
  onClick: () => void;
  delay?: number;
}) {
  return (
    <motion.div
      className="relative flex items-center justify-center rounded-lg select-none"
      style={{
        width: '100%',
        aspectRatio: '1',
        background: isActive
          ? `rgba(${ACCENT_RGB}, 0.2)`
          : isWrong
            ? `rgba(${RED_RGB}, 0.2)`
            : 'rgba(15, 23, 42, 0.6)',
        border: `1.5px solid ${
          isActive
            ? `rgba(${ACCENT_RGB}, 0.7)`
            : isWrong
              ? `rgba(${RED_RGB}, 0.8)`
              : isCorrectWave
                ? `rgba(${ACCENT_RGB}, 0.5)`
                : 'rgba(51, 65, 85, 0.4)'
        }`,
        boxShadow: isActive
          ? `0 0 20px rgba(${ACCENT_RGB}, 0.4), inset 0 0 15px rgba(${ACCENT_RGB}, 0.15)`
          : isWrong
            ? `0 0 20px rgba(${RED_RGB}, 0.4), inset 0 0 15px rgba(${RED_RGB}, 0.15)`
            : isCorrectWave
              ? `0 0 12px rgba(${ACCENT_RGB}, 0.2), inset 0 0 8px rgba(${ACCENT_RGB}, 0.08)`
              : '0 0 2px rgba(0,0,0,0.3)',
        cursor: isClickable ? 'pointer' : 'default',
      }}
      animate={
        isActive
          ? {
              scale: [1, 1.08, 1],
              boxShadow: [
                `0 0 15px rgba(${ACCENT_RGB}, 0.3), inset 0 0 10px rgba(${ACCENT_RGB}, 0.1)`,
                `0 0 30px rgba(${ACCENT_RGB}, 0.6), inset 0 0 20px rgba(${ACCENT_RGB}, 0.25)`,
                `0 0 15px rgba(${ACCENT_RGB}, 0.3), inset 0 0 10px rgba(${ACCENT_RGB}, 0.1)`,
              ],
            }
          : isWrong
            ? {
                x: [0, -4, 4, -4, 4, 0],
                scale: [1, 0.95, 1.05, 0.95, 1],
              }
            : isCorrectWave
              ? {
                  scale: [1, 1.05, 1],
                }
              : {}
      }
      transition={
        isActive
          ? { duration: 0.4, ease: 'easeInOut' }
          : isWrong
            ? { duration: 0.4, ease: 'easeInOut' }
            : isCorrectWave
              ? { duration: 0.3, delay, ease: 'easeOut' }
              : {}
      }
      onClick={isClickable ? onClick : undefined}
      whileHover={isClickable ? { scale: 1.06 } : {}}
      whileTap={isClickable ? { scale: 0.94 } : {}}
    >
      {/* Neural connection icon */}
      <span
        className="relative z-10 font-mono text-sm"
        style={{
          color: isActive
            ? ACCENT_COLOR
            : isWrong
              ? `rgba(${RED_RGB}, 0.9)`
              : isCorrectWave
                ? `rgba(${ACCENT_RGB}, 0.6)`
                : 'rgba(71, 85, 105, 0.4)',
          textShadow: isActive
            ? `0 0 10px rgba(${ACCENT_RGB}, 0.5)`
            : isWrong
              ? `0 0 10px rgba(${RED_RGB}, 0.5)`
              : 'none',
        }}
      >
        {isActive ? '⬡' : isWrong ? '✕' : '⬡'}
      </span>

      {/* Scan line effect on active cell */}
      {isActive && (
        <div
          className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
          style={{ opacity: 0.4 }}
        >
          <motion.div
            className="absolute left-0 right-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(${ACCENT_RGB}, 0.6), transparent)`,
            }}
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 0.5, ease: 'linear' }}
          />
        </div>
      )}
    </motion.div>
  );
}

/* ─── Main Component ─── */
export function MemoryPuzzleGame({ onClose }: MemoryPuzzleGameProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const [difficulty, setDifficulty] = useState<Difficulty>('hacker');
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [pattern, setPattern] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [wrongCell, setWrongCell] = useState<number | null>(null);
  const [correctWave, setCorrectWave] = useState(false);
  const [round, setRound] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [, setShowingIndex] = useState(-1);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [rewardsClaimed, setRewardsClaimed] = useState(false);

  const config = DIFFICULTY_CONFIG[difficulty];
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [patternShowing, setPatternShowing] = useState(false);

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    timeoutRefs.current.forEach((t) => clearTimeout(t));
    timeoutRefs.current = [];
  }, []);

  // Show pattern to the player
  const showPattern = useCallback((pat: number[]) => {
    clearTimeouts();
    setPatternShowing(true);
    setGamePhase('showing');
    setActiveCell(null);
    setShowingIndex(-1);

    pat.forEach((cellIdx, i) => {
      const showTimeout = setTimeout(() => {
        setActiveCell(cellIdx);
        setShowingIndex(i);

        // Clear this cell after showDuration
        const hideTimeout = setTimeout(() => {
          setActiveCell(null);
          setShowingIndex(-1);

          // After last cell, transition to input phase
          if (i === pat.length - 1) {
            const inputTimeout = setTimeout(() => {
              setPatternShowing(false);
              setGamePhase('input');
              setPlayerInput([]);
            }, config.showDelay / 2);
            timeoutRefs.current.push(inputTimeout);
          }
        }, config.showDuration);

        timeoutRefs.current.push(hideTimeout);
      }, i * (config.showDelay + config.showDuration));

      timeoutRefs.current.push(showTimeout);
    });
  }, [config.showDelay, config.showDuration, clearTimeouts]);

  // Start a new game
  const startGame = useCallback((diff: Difficulty) => {
    clearTimeouts();
    const cfg = DIFFICULTY_CONFIG[diff];
    const newPattern = generatePattern(cfg.startingLength);
    setPattern(newPattern);
    setPlayerInput([]);
    setRound(1);
    setLives(MAX_LIVES);
    setScore(0);
    setRoundsCompleted(0);
    setWrongCell(null);
    setCorrectWave(false);
    setRewardsClaimed(false);
    setGamePhase('showing');

    // Short delay before showing pattern
    const t = setTimeout(() => showPattern(newPattern), 500);
    timeoutRefs.current.push(t);
  }, [showPattern, clearTimeouts]);

  // Handle cell click during input phase
  const handleCellClick = useCallback((cellIndex: number) => {
    if (gamePhase !== 'input' || patternShowing) return;

    const currentInput = [...playerInput, cellIndex];
    const stepIndex = currentInput.length - 1;

    // Check if this step is correct
    if (pattern[stepIndex] !== cellIndex) {
      // Wrong!
      setWrongCell(cellIndex);
      setGamePhase('wrong');
      setLives((prev) => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          // Game over
          const t = setTimeout(() => setGamePhase('results'), 800);
          timeoutRefs.current.push(t);
        } else {
          // Replay same pattern
          const t = setTimeout(() => {
            setWrongCell(null);
            setPlayerInput([]);
            showPattern(pattern);
          }, 1000);
          timeoutRefs.current.push(t);
        }
        return newLives;
      });
      return;
    }

    // Correct step — briefly highlight the cell
    setActiveCell(cellIndex);
    const clearT = setTimeout(() => setActiveCell(null), 200);
    timeoutRefs.current.push(clearT);

    setPlayerInput(currentInput);

    // Check if entire pattern is complete
    if (currentInput.length === pattern.length) {
      // Round complete!
      const roundScore = Math.round(pattern.length * config.multiplier * 10);
      setScore((prev) => prev + roundScore);
      setRoundsCompleted((prev) => prev + 1);
      setGamePhase('correct');
      setCorrectWave(true);

      // Show correct wave, then start next round
      const t = setTimeout(() => {
        setCorrectWave(false);
        setActiveCell(null);

        // Add one more step to the pattern
        const newPattern = generatePattern(pattern.length + 1, pattern);
        setPattern(newPattern);
        setPlayerInput([]);
        setRound((prev) => prev + 1);
        showPattern(newPattern);
      }, 1200);
      timeoutRefs.current.push(t);
    }
  }, [gamePhase, playerInput, pattern, config.multiplier, showPattern, patternShowing]);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearTimeouts();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, clearTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeouts();
  }, [clearTimeouts]);

  // Calculate rewards
  const calculateRewards = useCallback(() => {
    const xpReward = Math.min(5 + roundsCompleted * 2, 20);
    const karmaReward = Math.min(2 + roundsCompleted, 10);
    const codingSkill = 1;
    return { xpReward, karmaReward, codingSkill };
  }, [roundsCompleted]);

  // Handle claiming rewards (single apply path — see claimMinigameRewards)
  const handleClaimRewards = useCallback(() => {
    if (rewardsClaimed) return;
    const rewards = calculateRewards();

    completeMinigame({
      gameType: 'memory',
      success: true,
      rewards: [
        { type: 'addXp', value: rewards.xpReward },
        { type: 'addKarma', value: rewards.karmaReward },
        { type: 'addSkill', skill: 'coding', value: rewards.codingSkill },
        { type: 'setFlag', flag: 'memory_puzzle_complete', flagValue: true },
      ],
    });

    setRewardsClaimed(true);
    onClose();
  }, [calculateRewards, onClose, rewardsClaimed]);

  // Current rating
  const rating = useMemo(() => getRating(roundsCompleted), [roundsCompleted]);

  /* ─── Render: Setup screen ─── */
  const renderSetup = () => (
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

      {/* Difficulty selection */}
      <div className="space-y-3 mb-6">
        {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG[Difficulty]][]).map(
          ([key, cfg]) => (
            <motion.button
              key={key}
              onClick={() => setDifficulty(key)}
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
                  style={{
                    color: difficulty === key ? ACCENT_COLOR : 'rgba(148, 163, 184, 0.6)',
                  }}
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

      {/* Start button */}
      <motion.button
        onClick={() => startGame(difficulty)}
        className="w-full py-3 rounded-md font-mono text-sm tracking-[0.15em] uppercase font-bold transition-all duration-200"
        style={{
          background: `rgba(${ACCENT_RGB}, 0.15)`,
          border: `1px solid rgba(${ACCENT_RGB}, 0.4)`,
          color: ACCENT_COLOR,
          boxShadow: `0 0 15px rgba(${ACCENT_RGB}, 0.1)`,
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.25)`;
          e.currentTarget.style.boxShadow = `0 0 25px rgba(${ACCENT_RGB}, 0.2)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.15)`;
          e.currentTarget.style.boxShadow = `0 0 15px rgba(${ACCENT_RGB}, 0.1)`;
        }}
      >
        Подключиться
      </motion.button>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 justify-center">
          <span className="text-xs" style={{ color: ACCENT_COLOR }}>⬡</span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>Нейрон</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="text-xs">🧠</span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>Жизни</span>
        </div>
      </div>
    </motion.div>
  );

  /* ─── Render: Game grid ─── */
  const renderGame = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Stats bar */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-md mb-3"
        style={{ background: 'rgba(0, 0, 0, 0.3)', border: `1px solid rgba(${ACCENT_RGB}, 0.1)` }}
      >
        <div className="flex items-center gap-3">
          {/* Round counter */}
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

          {/* Pattern length indicator */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>
              Паттерн
            </span>
            <span className="font-mono text-xs" style={{ color: `rgba(${ACCENT_RGB}, 0.7)` }}>
              {playerInput.length}/{pattern.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Lives */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <span
                key={i}
                className="text-sm"
                style={{
                  opacity: i < lives ? 1 : 0.2,
                  filter: i < lives ? 'none' : 'grayscale(1)',
                }}
              >
                🧠
              </span>
            ))}
          </div>

          {/* Score */}
          <motion.span
            key={score}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="font-mono text-xs font-bold"
            style={{ color: ACCENT_COLOR, textShadow: `0 0 8px rgba(${ACCENT_RGB}, 0.3)` }}
          >
            {score}
          </motion.span>

          {/* Difficulty badge */}
          <span
            className="font-mono text-[10px] px-1.5 py-0.5 rounded"
            style={{
              background: `rgba(${ACCENT_RGB}, 0.08)`,
              border: `1px solid rgba(${ACCENT_RGB}, 0.2)`,
              color: `rgba(${ACCENT_RGB}, 0.6)`,
            }}
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* Phase indicator */}
      <AnimatePresence mode="wait">
        {gamePhase === 'showing' && (
          <motion.div
            key="showing"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="text-center mb-2"
          >
            <span
              className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: `rgba(${ACCENT_RGB}, 0.7)`, textShadow: `0 0 8px rgba(${ACCENT_RGB}, 0.3)` }}
            >
              ▶ Запоминайте паттерн
            </span>
          </motion.div>
        )}
        {gamePhase === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="text-center mb-2"
          >
            <span
              className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: `rgba(${CYAN_RGB}, 0.7)`, textShadow: `0 0 8px rgba(${CYAN_RGB}, 0.3)` }}
            >
              ◈ Повторите паттерн
            </span>
          </motion.div>
        )}
        {gamePhase === 'wrong' && (
          <motion.div
            key="wrong"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="text-center mb-2"
          >
            <span
              className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: `rgba(${RED_RGB}, 0.9)`, textShadow: `0 0 8px rgba(${RED_RGB}, 0.3)` }}
            >
              ✕ Ошибка! -1 🧠
            </span>
          </motion.div>
        )}
        {gamePhase === 'correct' && (
          <motion.div
            key="correct"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="text-center mb-2"
          >
            <span
              className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: ACCENT_COLOR, textShadow: `0 0 8px rgba(${ACCENT_RGB}, 0.3)` }}
            >
              ✓ Паттерн верный!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div
        className="grid gap-2 relative"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        }}
      >
        {Array.from({ length: TOTAL_CELLS }).map((_, i) => (
          <NeuralCell
            key={i}
            index={i}
            isActive={activeCell === i}
            isWrong={wrongCell === i}
            isCorrectWave={correctWave}
            isClickable={gamePhase === 'input' && !patternShowing}
            onClick={() => handleCellClick(i)}
            delay={i * 0.04}
          />
        ))}
      </div>

      {/* Instructions */}
      <p className="font-mono text-[10px] text-center mt-3" style={{ color: 'rgba(148, 163, 184, 0.35)' }}>
        Смотрите на подсвеченные ячейки, затем повторите последовательность
      </p>
    </motion.div>
  );

  /* ─── Render: Results screen ─── */
  const renderResults = () => {
    const rewards = calculateRewards();

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
        >
          🧠
        </motion.div>

        <h3
          className="text-lg font-bold font-mono tracking-widest uppercase mb-2"
          style={{ color: ACCENT_COLOR }}
        >
          Сеанс завершён
        </h3>

        {/* Rating */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-3"
        >
          <span
            className="font-mono text-sm font-bold tracking-[0.15em] uppercase"
            style={{ color: rating.color, textShadow: `0 0 10px ${rating.color}` }}
          >
            {rating.label}
          </span>
        </motion.div>

        {/* Score */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
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

        {/* Stats breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-md p-3 mb-4 space-y-1.5"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: `1px solid rgba(${ACCENT_RGB}, 0.1)`,
          }}
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>Раундов пройдено</span>
            <span style={{ color: ACCENT_COLOR }}>{roundsCompleted}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>Множитель сложности</span>
            <span style={{ color: `rgba(${CYAN_RGB}, 0.9)` }}>×{config.multiplier}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>Длина паттерна</span>
            <span style={{ color: 'rgba(148, 163, 184, 0.7)' }}>{pattern.length}</span>
          </div>
        </motion.div>

        {/* Rewards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-md p-3 mb-4"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: `1px solid rgba(${ACCENT_RGB}, 0.1)`,
          }}
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

        {/* Claim button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          onClick={handleClaimRewards}
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
          onMouseEnter={(e) => {
            if (!rewardsClaimed) {
              e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.25)`;
              e.currentTarget.style.boxShadow = `0 0 25px rgba(${ACCENT_RGB}, 0.2)`;
            }
          }}
          onMouseLeave={(e) => {
            if (!rewardsClaimed) {
              e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.15)`;
              e.currentTarget.style.boxShadow = `0 0 15px rgba(${ACCENT_RGB}, 0.1)`;
            }
          }}
        >
          {rewardsClaimed ? 'Награды получены' : 'Забрать награды'}
        </motion.button>

        {/* Retry */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => startGame(difficulty)}
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
  };

  /* ─── Main render ─── */
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center font-mono"
      style={{ zIndex: UI_LAYERS.MINIGAME }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 backdrop-blur-md"
        style={{
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.88) 0%, rgba(5, 8, 18, 0.92) 100%)',
        }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-hidden="true"
      />

      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.04) 2px, rgba(0, 0, 0, 0.04) 4px)',
        }}
      />

      <FocusTrap initialFocusRef={closeButtonRef}>
      {/* Main panel */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ scale: 0.92, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 30 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        {...dialogProps}
      >
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            background:
              'linear-gradient(180deg, rgba(8, 12, 18, 0.98) 0%, rgba(5, 8, 14, 0.99) 100%)',
            borderColor: `rgba(${ACCENT_RGB}, 0.2)`,
            boxShadow: `0 0 60px rgba(${ACCENT_RGB}, 0.06), 0 8px 40px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(${ACCENT_RGB}, 0.05)`,
            clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
          }}
        >
          {/* Terminal header */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{
              borderColor: `rgba(${ACCENT_RGB}, 0.15)`,
              background: 'rgba(0, 0, 0, 0.4)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: `rgba(${ACCENT_RGB}, 0.8)` }} aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-amber-400/80" aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-red-500/80" aria-hidden="true" />
              <span
                {...titleProps}
                className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em]"
                style={{ color: `rgba(${ACCENT_RGB}, 0.35)` }}
              >
                🧠 НЕЙРОСЕТЬ
              </span>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors font-mono text-sm"
              aria-label="Закрыть игру"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4 relative">
            {/* Scanlines on content */}
            <div
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(${ACCENT_RGB}, 0.008) 2px, rgba(${ACCENT_RGB}, 0.008) 4px)`,
              }}
            />

            <div className="relative z-10">
              <AnimatePresence mode="wait">
                {gamePhase === 'setup' && <div key="setup">{renderSetup()}</div>}
                {(gamePhase === 'showing' || gamePhase === 'input' || gamePhase === 'correct' || gamePhase === 'wrong') && (
                  <div key="game">{renderGame()}</div>
                )}
                {gamePhase === 'results' && <div key="results">{renderResults()}</div>}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-5 py-2 border-t flex items-center justify-center"
            style={{ borderColor: `rgba(${ACCENT_RGB}, 0.1)` }}
          >
            <div className="flex items-center gap-1.5">
              <kbd
                className="inline-flex items-center justify-center px-1.5 h-5 rounded border font-mono text-[10px]"
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderColor: 'rgba(100, 116, 139, 0.25)',
                  color: 'rgba(148, 163, 184, 0.5)',
                }}
              >
                Esc
              </kbd>
              <span className="font-mono text-[10px] text-slate-500/40 tracking-wide">
                выйти
              </span>
            </div>
          </div>
        </div>

        {/* Corner glow decorations */}
        <div
          className="absolute -top-px -left-px w-8 h-8 pointer-events-none"
          style={{
            borderTop: `2px solid rgba(${ACCENT_RGB}, 0.3)`,
            borderLeft: `2px solid rgba(${ACCENT_RGB}, 0.3)`,
            boxShadow: `-2px -2px 10px rgba(${ACCENT_RGB}, 0.1)`,
          }}
        />
        <div
          className="absolute -top-px -right-px w-8 h-8 pointer-events-none"
          style={{
            borderTop: `2px solid rgba(${ACCENT_RGB}, 0.3)`,
            borderRight: `2px solid rgba(${ACCENT_RGB}, 0.3)`,
            boxShadow: `2px -2px 10px rgba(${ACCENT_RGB}, 0.1)`,
          }}
        />
        <div
          className="absolute -bottom-px -left-px w-8 h-8 pointer-events-none"
          style={{
            borderBottom: `2px solid rgba(${ACCENT_RGB}, 0.2)`,
            borderLeft: `2px solid rgba(${ACCENT_RGB}, 0.2)`,
            boxShadow: `-2px 2px 10px rgba(${ACCENT_RGB}, 0.05)`,
          }}
        />
        <div
          className="absolute -bottom-px -right-px w-8 h-8 pointer-events-none"
          style={{
            borderBottom: `2px solid rgba(${ACCENT_RGB}, 0.2)`,
            borderRight: `2px solid rgba(${ACCENT_RGB}, 0.2)`,
            boxShadow: `2px 2px 10px rgba(${ACCENT_RGB}, 0.05)`,
          }}
        />
      </motion.div>
      </FocusTrap>
    </motion.div>
  );
}
