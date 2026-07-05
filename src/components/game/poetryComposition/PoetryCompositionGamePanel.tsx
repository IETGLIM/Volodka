import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PoetryCompositionPlayingView } from '@/components/game/poetryComposition/PoetryCompositionPlayingView';
import { PoetryCompositionResultsView } from '@/components/game/poetryComposition/PoetryCompositionResultsView';
import { usePoetryCompositionGame } from '@/components/game/poetryComposition/usePoetryCompositionGame';
import '@/components/game/poetryComposition/poetry-composition.css';
import {
  POETRY_COMPOSITION_ACCENT_COLOR,
  POETRY_COMPOSITION_ACCENT_RGB,
  POETRY_COMPOSITION_LABELS,
} from '@/engine/minigame/poetryComposition/poetryCompositionConstants';
import {
  getPanelEnterVariants,
  getScorePulseTransition,
  getShellTransition,
} from '@/engine/minigame/poetryComposition/poetryCompositionPresentation';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

export type PoetryCompositionGameProps = {
  onClose: () => void;
};

function PoetryCompositionGameInner({ onClose }: PoetryCompositionGameProps) {
  const game = usePoetryCompositionGame(onClose);
  const shellVariants = getPanelEnterVariants(game.reducedMotion);

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

  return (
    <motion.div
      initial={shellVariants.initial}
      animate={shellVariants.animate}
      exit={shellVariants.exit}
      transition={getShellTransition(game.reducedMotion)}
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: UI_LAYERS.MINIGAME }}
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={game.handleClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={POETRY_COMPOSITION_LABELS.title}
        className="relative z-10 w-full max-w-lg mx-4 rounded-lg border overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(5, 8, 15, 0.97), rgba(15, 10, 25, 0.97))',
          borderColor: `rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.25)`,
          boxShadow: `0 0 30px rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.08), inset 0 0 30px rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.02)`,
        }}
      >
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{
            borderBottom: `1px solid rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.15)`,
            background: `rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.03)`,
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: POETRY_COMPOSITION_ACCENT_COLOR, fontSize: '18px' }} aria-hidden="true">
              ✨
            </span>
            <h2 className="text-sm font-bold tracking-widest uppercase font-mono" style={{ color: POETRY_COMPOSITION_ACCENT_COLOR }}>
              {POETRY_COMPOSITION_LABELS.title}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono" style={{ color: `rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.6)` }}>
              {POETRY_COMPOSITION_LABELS.roundCounter(game.round + 1, game.totalRounds)}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-mono" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
                {POETRY_COMPOSITION_LABELS.score}
              </span>
              <motion.span
                key={game.score}
                initial={game.reducedMotion ? false : { scale: 1.3, color: POETRY_COMPOSITION_ACCENT_COLOR }}
                animate={{ scale: 1, color: `rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.9)` }}
                transition={getScorePulseTransition(game.reducedMotion)}
                className="text-sm font-bold font-mono"
                style={{ color: POETRY_COMPOSITION_ACCENT_COLOR }}
                aria-live="polite"
              >
                {game.score}
              </motion.span>
            </div>
            <button
              type="button"
              onClick={game.handleClose}
              aria-label={POETRY_COMPOSITION_LABELS.close}
              className="text-slate-500 hover:text-slate-300 transition-colors text-lg font-mono"
            >
              ✕
            </button>
          </div>
        </div>

        {!game.reducedMotion && (
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.015) 2px, rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.015) 4px)`,
            }}
          />
        )}

        <div className="relative z-10 p-5 max-h-[75vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <AnimatePresence mode="wait">
            {game.gamePhase === 'playing' ? (
              <PoetryCompositionPlayingView
                round={game.round}
                score={game.score}
                totalRounds={game.totalRounds}
                template={game.template}
                parsedLines={game.parsedLines}
                allWordOptions={game.allWordOptions}
                selectedBlank={game.selectedBlank}
                filledBlanks={game.filledBlanks}
                usedWords={game.usedWords}
                allBlanksFilled={game.allBlanksFilled}
                liveAnnouncement={game.liveAnnouncement}
                reducedMotion={game.reducedMotion}
                handleBlankClick={game.handleBlankClick}
                handleWordClick={game.handleWordClick}
                handleFinishRound={game.handleFinishRound}
              />
            ) : (
              <PoetryCompositionResultsView
                score={game.score}
                roundScores={game.roundScores}
                rewards={game.rewards}
                qualityRating={game.qualityRating}
                reducedMotion={game.reducedMotion}
                handleClaimRewards={game.handleClaimRewards}
              />
            )}
          </AnimatePresence>
        </div>

        <div
          className="px-5 py-2 border-t flex items-center justify-center"
          style={{ borderColor: `rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.1)` }}
        >
          <button
            type="button"
            onClick={game.handleClose}
            className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500/40 tracking-wide hover:text-slate-300 transition-colors"
            aria-label={POETRY_COMPOSITION_LABELS.closeEsc}
          >
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
            <span aria-hidden="true">выйти</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function PoetryCompositionGame(props: PoetryCompositionGameProps) {
  return (
    <ErrorBoundary name="PoetryCompositionGame" fallback={null}>
      <PoetryCompositionGameInner {...props} />
    </ErrorBoundary>
  );
}
