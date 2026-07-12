import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MemoryPuzzleGameView } from '@/components/game/memoryPuzzle/MemoryPuzzleGameView';
import { MemoryPuzzleResults } from '@/components/game/memoryPuzzle/MemoryPuzzleResults';
import { MemoryPuzzleSetup } from '@/components/game/memoryPuzzle/MemoryPuzzleSetup';
import { useMemoryPuzzleGame } from '@/components/game/memoryPuzzle/useMemoryPuzzleGame';
import { useMemoryPuzzleGridNav } from '@/components/game/memoryPuzzle/useMemoryPuzzleGridNav';
import { ACCENT_RGB } from '@/engine/minigame/memory/memoryPuzzleConstants';
import { buildPhaseAnnouncement } from '@/engine/minigame/memory/memoryPuzzlePresentation';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

export interface MemoryPuzzleGameProps {
  onClose: () => void;
}

function MemoryPuzzleGamePanel({ onClose }: MemoryPuzzleGameProps) {
  const game = useMemoryPuzzleGame(onClose);

  const isPlaying =
    game.gamePhase === 'showing'
    || game.gamePhase === 'input'
    || game.gamePhase === 'correct'
    || game.gamePhase === 'wrong';

  useMemoryPuzzleGridNav({
    enabled: isPlaying,
    gamePhase: game.gamePhase,
    patternShowing: game.patternShowing,
    focusedCell: game.focusedCell,
    setFocusedCell: game.setFocusedCell,
    onSelect: game.handleCellClick,
    onSkipPattern: game.skipPatternShow,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        game.handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, [game.handleClose]);

  const liveAnnouncement = useMemo(
    () =>
      buildPhaseAnnouncement(
        game.gamePhase,
        game.round,
        game.pattern.length,
        game.lives,
        game.simplified,
      ),
    [game.gamePhase, game.lives, game.pattern.length, game.round, game.simplified],
  );

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center font-mono"
      style={{ zIndex: UI_LAYERS.MINIGAME }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      data-testid="memory-puzzle-game"
    >
      <motion.div
        className="absolute inset-0 backdrop-blur-md"
        style={{
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.88) 0%, rgba(5, 8, 18, 0.92) 100%)',
        }}
        onClick={game.handleClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.04) 2px, rgba(0, 0, 0, 0.04) 4px)',
        }}
        aria-hidden="true"
      />

      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ scale: 0.92, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 30 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        role="dialog"
        aria-modal="true"
        aria-label="Мини-игра Нейросеть"
      >
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(8, 12, 18, 0.98) 0%, rgba(5, 8, 14, 0.99) 100%)',
            borderColor: `rgba(${ACCENT_RGB}, 0.2)`,
            boxShadow: `0 0 60px rgba(${ACCENT_RGB}, 0.06), 0 8px 40px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(${ACCENT_RGB}, 0.05)`,
            clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{ borderColor: `rgba(${ACCENT_RGB}, 0.15)`, background: 'rgba(0, 0, 0, 0.4)' }}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: `rgba(${ACCENT_RGB}, 0.8)` }} />
              <span className="h-2 w-2 rounded-full bg-amber-400/80" />
              <span className="h-2 w-2 rounded-full bg-red-500/80" />
              <span
                className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em]"
                style={{ color: `rgba(${ACCENT_RGB}, 0.35)` }}
              >
                🧠 НЕЙРОСЕТЬ
              </span>
            </div>
            <button
              type="button"
              onClick={game.handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors font-mono text-sm"
              aria-label="Закрыть игру"
            >
              ✕
            </button>
          </div>

          <div className="px-5 py-4 relative">
            <div
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(${ACCENT_RGB}, 0.008) 2px, rgba(${ACCENT_RGB}, 0.008) 4px)`,
              }}
              aria-hidden="true"
            />

            <div className="relative z-10">
              <AnimatePresence mode="wait">
                {game.gamePhase === 'setup' ? (
                  <MemoryPuzzleSetup
                    key="setup"
                    difficulty={game.difficulty}
                    onSelectDifficulty={game.setDifficulty}
                    onStart={() => game.startGame(game.difficulty)}
                  />
                ) : null}
                {isPlaying ? (
                  <MemoryPuzzleGameView
                    key="game"
                    gamePhase={game.gamePhase}
                    round={game.round}
                    patternLength={game.pattern.length}
                    playerInputLength={game.playerInput.length}
                    lives={game.lives}
                    score={game.score}
                    difficultyLabel={game.config.label}
                    activeCell={game.activeCell}
                    wrongCell={game.wrongCell}
                    correctWave={game.correctWave}
                    patternShowing={game.patternShowing}
                    focusedCell={game.focusedCell}
                    liveAnnouncement={liveAnnouncement}
                    onCellClick={game.handleCellClick}
                  />
                ) : null}
                {game.gamePhase === 'results' ? (
                  <MemoryPuzzleResults
                    key="results"
                    score={game.score}
                    roundsCompleted={game.roundsCompleted}
                    patternLength={game.pattern.length}
                    multiplier={game.config.multiplier}
                    rewardsClaimed={game.rewardsClaimed}
                    onClaim={game.handleClaimRewards}
                    onRetry={() => game.startGame(game.difficulty)}
                  />
                ) : null}
              </AnimatePresence>
            </div>
          </div>

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
              <span className="font-mono text-[10px] text-slate-500/40 tracking-wide">выйти</span>
            </div>
          </div>
        </div>

        <div
          className="absolute -top-px -left-px w-8 h-8 pointer-events-none"
          style={{
            borderTop: `2px solid rgba(${ACCENT_RGB}, 0.3)`,
            borderLeft: `2px solid rgba(${ACCENT_RGB}, 0.3)`,
            boxShadow: `-2px -2px 10px rgba(${ACCENT_RGB}, 0.1)`,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute -top-px -right-px w-8 h-8 pointer-events-none"
          style={{
            borderTop: `2px solid rgba(${ACCENT_RGB}, 0.3)`,
            borderRight: `2px solid rgba(${ACCENT_RGB}, 0.3)`,
            boxShadow: `2px -2px 10px rgba(${ACCENT_RGB}, 0.1)`,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-px -left-px w-8 h-8 pointer-events-none"
          style={{
            borderBottom: `2px solid rgba(${ACCENT_RGB}, 0.2)`,
            borderLeft: `2px solid rgba(${ACCENT_RGB}, 0.2)`,
            boxShadow: `-2px 2px 10px rgba(${ACCENT_RGB}, 0.05)`,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-px -right-px w-8 h-8 pointer-events-none"
          style={{
            borderBottom: `2px solid rgba(${ACCENT_RGB}, 0.2)`,
            borderRight: `2px solid rgba(${ACCENT_RGB}, 0.2)`,
            boxShadow: `2px 2px 10px rgba(${ACCENT_RGB}, 0.05)`,
          }}
          aria-hidden="true"
        />
      </motion.div>
    </motion.div>
  );
}

export function MemoryPuzzleGame(props: MemoryPuzzleGameProps) {
  return (
    <ErrorBoundary name="memory-puzzle-game" fallback={null}>
      <MemoryPuzzleGamePanel {...props} />
    </ErrorBoundary>
  );
}
