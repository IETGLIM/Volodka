/* ═══════════════════════════════════════════════════════════════
   Volodka RPG – Cyberpunk Poem Cutscene Overlay
   
   Cinematic poem display with:
   ─ CRT scanlines / vignette / noise grain
   ─ Glitch text effects on title
   ─ Terminal typewriter reveal
   ─ Matrix rain background (optional)
   ─ Theme-based color palettes
   ─ Skip (Space/Enter/Escape) support
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Poem } from '@/shared/types/game';
import { eventBus } from '@/engine/EventBus';
import { MatrixRain } from '@/components/3d/MatrixRain';
import '@/styles/cyberpunk-poem.css';

interface CyberpunkPoemOverlayProps {
  open: boolean;
  poem: Poem | null;
  onComplete: () => void;
  /** Show Matrix rain in background */
  showMatrix?: boolean;
}

/** Derive theme class from poem themes */
function getThemeClass(themes: string[]): string {
  const t = themes.map(s => s.toLowerCase());
  if (t.some(s => s.includes('смерт') || s.includes('death'))) return 'cp-theme-death';
  if (t.some(s => s.includes('любов') || s.includes('love'))) return 'cp-theme-love';
  if (t.some(s => s.includes('надежд') || s.includes('hope'))) return 'cp-theme-hope';
  if (t.some(s => s.includes('отчаян') || s.includes('despair'))) return 'cp-theme-despair';
  if (t.some(s => s.includes('город') || s.includes('ночь') || s.includes('noir'))) return 'cp-theme-noir';
  if (t.some(s => s.includes('технологи') || s.includes('код') || s.includes('tech'))) return 'cp-theme-tech';
  if (t.some(s => s.includes('ссср') || s.includes('совет') || s.includes('ussr'))) return 'cp-theme-ussr';
  return '';
}

/** Cyberpunk Poem Cutscene — internal implementation */
const CyberpunkPoemCutscene = memo(function CyberpunkPoemCutscene({
  poem,
  onComplete,
  showMatrix = true,
}: {
  poem: Poem;
  onComplete: () => void;
  showMatrix?: boolean;
}) {
  const [revealedLines, setRevealedLines] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const rafRef = useRef<number>(0);
  const stateRef = useRef({ line: 0, char: 0, complete: false });

  const lines = poem.lines;
  const themeClass = getThemeClass(poem.themes);

  // ─── Typewriter reveal via rAF ───
  useEffect(() => {
    if (!lines.length) return;

    const state = stateRef.current;
    let lastTs = 0;
    const charDelay = 40; // ms per character
    const linePause = 200; // ms pause between lines

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
        // Empty line — advance immediately
        state.line++;
        state.char = 0;
        setRevealedLines(state.line);
      } else if (state.char >= line.length) {
        // Line complete — pause then advance
        state.line++;
        state.char = 0;
        setRevealedLines(state.line);
        lastTs = ts + linePause - charDelay;
      } else {
        // Mid-line — update current line chars
        setRevealedLines(state.line + 1); // trigger re-render
      }

      if (state.line >= lines.length) {
        state.complete = true;
        setTimeout(() => setShowPrompt(true), 500);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [lines]);

  // ─── Keyboard ───
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        const state = stateRef.current;
        if (!state.complete) {
          // Skip to end
          state.complete = true;
          state.line = lines.length;
          state.char = 0;
          cancelAnimationFrame(rafRef.current);
          setRevealedLines(lines.length);
          setTimeout(() => setShowPrompt(true), 300);
        } else {
          onComplete();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lines.length, onComplete]);

  // ─── Render revealed lines ───
  const renderLines = () => {
    const result: React.ReactNode[] = [];
    const state = stateRef.current;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isRevealed = i < state.line || (i === state.line && !state.complete);
      
      if (!isRevealed) break;

      const isCurrentLine = i === state.line;
      const displayedText = isCurrentLine
        ? line.slice(0, state.char)
        : line;

      if (line === '') {
        result.push(<div key={i} className="cp-poem-line cp-poem-line--empty cp-line-reveal">&nbsp;</div>);
      } else {
        result.push(
          <div key={i} className="cp-poem-line cp-line-reveal">
            {displayedText}
            {isCurrentLine && <span className="cp-cursor" />}
          </div>
        );
      }
    }
    return result;
  };

  return (
    <motion.div
      className="cp-poem-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(4px)' }}
      transition={{ duration: 0.5 }}
    >
      {/* CRT overlay */}
      <div className="cp-crt-overlay" />
      {/* Noise grain */}
      <div className="cp-noise-overlay" />
      {/* Vignette */}
      <div className="cp-vignette" />
      {/* Scanline sweep */}
      <div className="cp-scanline-bar" />

      {/* Matrix rain (optional) */}
      {showMatrix && (
        <MatrixRain />
      )}

      {/* Poem content */}
      <div className={`cp-poem-inner ${themeClass}`}>
        {/* Terminal header */}
        <div className="cp-terminal-header">
          <div className="cp-terminal-dots">
            <span className="cp-terminal-dot cp-terminal-dot--red" />
            <span className="cp-terminal-dot cp-terminal-dot--yellow" />
            <span className="cp-terminal-dot cp-terminal-dot--green" />
          </div>
          <span>poetry://{poem.id}</span>
          <span>{poem.author}</span>
        </div>

        {/* Title with glitch */}
        <div className="cp-glitch-text cp-poem-title" data-text={poem.title}>
          {poem.title}
        </div>
        <div className="cp-poem-author">{poem.author}</div>

        {/* Poem lines */}
        <div className="cp-poem-body">
          {renderLines()}
        </div>

        {/* Skip prompt */}
        <AnimatePresence>
          {showPrompt && (
            <motion.div
              className="cp-poem-prompt"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Нажми <kbd>ПРОБЕЛ</kbd> чтобы продолжить
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

/** Public API — wraps cutscene in AnimatePresence */
export function CyberpunkPoemOverlay({
  open,
  poem,
  onComplete,
  showMatrix = true,
}: CyberpunkPoemOverlayProps) {
  return (
    <AnimatePresence>
      {open && poem && (
        <CyberpunkPoemCutscene
          poem={poem}
          onComplete={onComplete}
          showMatrix={showMatrix}
        />
      )}
    </AnimatePresence>
  );
}
