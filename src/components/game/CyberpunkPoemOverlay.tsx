/* ═══════════════════════════════════════════════════════════════
   Volodka RPG – Poem cinematic overlay (AAA unified)
   Full-screen letterbox beat — same language as story/cutscenes.
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, memo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Poem } from '@/shared/types/game';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { MatrixRain } from '@/components/3d/MatrixRain';
import {
  CinematicShell,
  CinematicTitleCard,
  resolvePoemPresentation,
} from '@/components/game/cinematic';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

interface CyberpunkPoemOverlayProps {
  open: boolean;
  poem: Poem | null;
  onComplete: () => void;
  showMatrix?: boolean;
}

const CyberpunkPoemCutscene = memo(function CyberpunkPoemCutscene({
  poem,
  onComplete,
  showMatrix = true,
}: {
  poem: Poem;
  onComplete: () => void;
  showMatrix?: boolean;
}) {
  const reducedMotion = useEffectiveReducedMotion();
  const [revealedLines, setRevealedLines] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const rafRef = useRef<number>(0);
  const stateRef = useRef({ line: 0, char: 0, complete: false });

  const lines = poem.lines;
  const presentation = resolvePoemPresentation('#66ffaa');

  useEffect(() => {
    if (!lines.length) return;

    const state = stateRef.current;
    state.line = 0;
    state.char = 0;
    state.complete = false;
    setRevealedLines(0);
    setShowPrompt(false);

    let lastTs = 0;
    const charDelay = 38;
    const linePause = 180;

    const tick = (ts: number) => {
      if (state.complete) return;
      if (ts - lastTs < charDelay) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastTs = ts;

      const line = lines[state.line];
      state.char++;

      if (!line || line === '') {
        state.line++;
        state.char = 0;
        setRevealedLines(state.line);
      } else if (state.char >= line.length) {
        state.line++;
        state.char = 0;
        setRevealedLines(state.line);
        lastTs = ts + linePause - charDelay;
      } else {
        setRevealedLines(state.line + 1);
      }

      if (state.line >= lines.length) {
        state.complete = true;
        setTimeout(() => setShowPrompt(true), 400);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [lines, poem.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter' && e.key !== 'Escape') return;
      e.preventDefault();
      const state = stateRef.current;
      if (!state.complete) {
        state.complete = true;
        state.line = lines.length;
        state.char = 0;
        cancelAnimationFrame(rafRef.current);
        setRevealedLines(lines.length);
        setTimeout(() => setShowPrompt(true), 200);
      } else {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lines.length, onComplete]);

  const renderLines = () => {
    const result: ReactNode[] = [];
    const state = stateRef.current;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isRevealed = i < state.line || (i === state.line && !state.complete);
      if (!isRevealed) break;

      const isCurrentLine = i === state.line;
      const displayedText = isCurrentLine ? line.slice(0, state.char) : line;

      result.push(
        <div
          key={i}
          className={`text-center ${line === '' ? 'h-4' : 'mb-1.5'}`}
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            color: 'rgba(220, 235, 225, 0.88)',
            textShadow: `0 0 16px ${presentation.accentColor}18`,
          }}
        >
          {displayedText}
          {isCurrentLine && !state.complete && (
            <span
              className="inline-block w-0.5 h-[1em] ml-1 align-middle"
              style={{
                background: presentation.accentColor,
                animation: 'cursor-blink 0.8s step-end infinite',
              }}
            />
          )}
        </div>,
      );
    }
    return result;
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: UI_LAYERS.DIALOGUE }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.5 }}
    >
      {showMatrix && (
        <div className="absolute inset-0 opacity-35 pointer-events-none">
          <MatrixRain />
        </div>
      )}

      <CinematicShell presentation={presentation}>
        <div className="relative z-20 flex flex-col items-center w-full max-w-3xl px-6 pointer-events-auto">
          <CinematicTitleCard
            title={poem.title}
            subtitle={poem.author}
            accentColor={presentation.accentColor}
            type="revelation"
            reducedMotion={reducedMotion}
          />

          <div
            className="mt-6 w-full max-h-[38dvh] overflow-y-auto custom-scrollbar text-base sm:text-lg leading-relaxed px-2"
            key={revealedLines}
          >
            {renderLines()}
          </div>

          <AnimatePresence>
            {showPrompt && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-sm tracking-wide text-center"
                style={{
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  color: `${presentation.accentColor}99`,
                }}
              >
                Пробел — продолжить
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </CinematicShell>
    </motion.div>
  );
});

export function CyberpunkPoemOverlay({
  open,
  poem,
  onComplete,
  showMatrix = true,
}: CyberpunkPoemOverlayProps) {
  return (
    <AnimatePresence>
      {open && poem && (
        <CyberpunkPoemCutscene poem={poem} onComplete={onComplete} showMatrix={showMatrix} />
      )}
    </AnimatePresence>
  );
}
