'use client';

/* ─── Volodka RPG – Hacking Minigame "Network Intrusion" ───
 * Client-only: grid generation uses Math.random at game start, not during SSR. */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useHackingGame } from '@/components/game/hacking/useHackingGame';
import { useHackingRewards } from '@/components/game/hacking/useHackingRewards';
import { HackingGameSetup } from '@/components/game/hacking/HackingGameSetup';
import { HackingGamePlaying } from '@/components/game/hacking/HackingGamePlaying';
import { HackingGameResults } from '@/components/game/hacking/HackingGameResults';
import {
  HACKING_ACCENT_COLOR,
  HACKING_ACCENT_RGB,
  HACKING_CYAN_COLOR,
  HACKING_CYAN_RGB,
} from '@/components/game/hacking/hackingGamePresentation';

interface HackingGameProps {
  onClose: () => void;
}

export function HackingGame({ onClose }: HackingGameProps) {
  const {
    state,
    setDifficulty,
    startGame,
    movePlayer,
    movePlayerByKey,
    backToSetup,
    scannerPositions,
    reachableNodes,
    pathSet,
  } = useHackingGame();

  const winRewards = useHackingRewards(
    { phase: state.phase, dataCollected: state.dataCollected, bandwidth: state.bandwidth },
    onClose,
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (state.phase !== 'playing') return;

      if (movePlayerByKey(e.key)) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayerByKey, onClose, state.phase]);

  const phaseAnnouncement =
    state.phase === 'won'
      ? 'Взлом завершён'
      : state.phase === 'lost'
        ? 'Обнаружен сканером'
        : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: UI_LAYERS.MINIGAME }}
      data-testid="hacking-game"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hacking-game-title"
        className="relative z-10 w-full max-w-lg mx-4 rounded-lg border overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(5, 8, 15, 0.97), rgba(18, 8, 12, 0.97))',
          borderColor: `rgba(${HACKING_ACCENT_RGB}, 0.25)`,
          boxShadow: `0 0 30px rgba(${HACKING_ACCENT_RGB}, 0.08), inset 0 0 30px rgba(${HACKING_ACCENT_RGB}, 0.02)`,
        }}
      >
        {phaseAnnouncement && (
          <div className="sr-only" role="status" aria-live="polite">
            {phaseAnnouncement}
          </div>
        )}

        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{
            borderBottom: `1px solid rgba(${HACKING_ACCENT_RGB}, 0.15)`,
            background: `rgba(${HACKING_ACCENT_RGB}, 0.03)`,
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: HACKING_ACCENT_COLOR, fontSize: '18px' }} aria-hidden="true">🔓</span>
            <h2
              id="hacking-game-title"
              className="text-sm font-bold tracking-widest uppercase"
              style={{ color: HACKING_ACCENT_COLOR, fontFamily: 'monospace' }}
            >
              СЕТЕВОЙ ВЗЛОМ
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {state.phase === 'playing' && (
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
                  Ходов:
                </span>
                <motion.span
                  key={state.turn}
                  initial={{ scale: 1.3, color: HACKING_CYAN_COLOR }}
                  animate={{ scale: 1, color: `rgba(${HACKING_CYAN_RGB}, 0.9)` }}
                  transition={{ duration: 0.3 }}
                  className="text-sm font-bold font-mono"
                >
                  {state.turn}
                </motion.span>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors text-lg font-mono"
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>
        </div>

        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(${HACKING_ACCENT_RGB}, 0.015) 2px, rgba(${HACKING_ACCENT_RGB}, 0.015) 4px)`,
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 p-5 max-h-[75vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <AnimatePresence mode="wait">
            {state.phase === 'setup' && (
              <HackingGameSetup
                key="setup"
                difficulty={state.difficulty}
                onSelectDifficulty={setDifficulty}
                onStart={() => startGame(state.difficulty)}
              />
            )}
            {state.phase === 'playing' && (
              <HackingGamePlaying
                key="playing"
                state={state}
                scannerPositions={scannerPositions}
                reachableNodes={reachableNodes}
                pathSet={pathSet}
                onMove={movePlayer}
              />
            )}
            {(state.phase === 'won' || state.phase === 'lost') && (
              <HackingGameResults
                key="results"
                phase={state.phase}
                rewards={state.phase === 'won' ? winRewards.rewards : null}
                onClaimRewards={winRewards.claimRewards}
                onRetry={() => startGame(state.difficulty)}
                onBackToSetup={backToSetup}
              />
            )}
          </AnimatePresence>
        </div>

        <div
          className="px-5 py-2 border-t flex items-center justify-center"
          style={{ borderColor: `rgba(${HACKING_ACCENT_RGB}, 0.1)` }}
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
    </motion.div>
  );
}
