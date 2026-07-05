/* ─── Volodka RPG – Matrix poem assembly ───
 * The opening poem materialises out of the digital rain: each letter first
 * tumbles in as a scrambling green glyph, then "stands up" and locks into the
 * real character with a typewriter keystroke. Lines resolve left-to-right.
 *
 * The poem text itself is the work of Владимир Лебедев and is never altered —
 * only the way it is revealed is animated here. The whole poem is sized to fit
 * the viewport so the final lines are always visible (no scrolling).
 */

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Poem } from '@/shared/types/game';
import { playTypewriterKey, playTypewriterReturn } from '@/engine/audio/typewriterSfx';

const SCRAMBLE = 'アイウエオカキクケコサシスセソ0123456789{}[]<>/\\|#$@=+*ДЖЗИЛПФ';
const WINDOW = 6; // how many upcoming letters scramble ahead of the lock point

interface Slot {
  ch: string;
  gi: number; // global lock index for printable chars; -1 for spaces
}

interface MatrixPoemAssemblyProps {
  poem: Poem;
  onComplete: () => void;
  reduceMotion: boolean;
}

export const MatrixPoemAssembly = memo(function MatrixPoemAssembly({
  poem,
  onComplete,
  reduceMotion,
}: MatrixPoemAssemblyProps) {
  const { renderLines, totalChars, charByGi, lineStartGis } = useMemo(() => {
    const lines: Slot[][] = [];
    const chars: string[] = [];
    const starts = new Set<number>();
    let gi = 0;
    let firstPrintableLine = true;

    for (const raw of poem.lines) {
      const slots: Slot[] = [];
      let lineHasPrintable = false;
      for (const ch of raw) {
        if (ch === ' ') {
          slots.push({ ch, gi: -1 });
        } else {
          if (!lineHasPrintable && !firstPrintableLine) starts.add(gi);
          lineHasPrintable = true;
          slots.push({ ch, gi });
          chars[gi] = ch;
          gi += 1;
        }
      }
      if (lineHasPrintable) firstPrintableLine = false;
      lines.push(slots);
    }

    return { renderLines: lines, totalChars: gi, charByGi: chars, lineStartGis: starts };
  }, [poem.lines]);

  // Viewport-scaled font so all lines fit (no scroll, final lines always visible).
  const bodyFontSize = useMemo(() => {
    const visualLines = poem.lines.length || 1;
    const vh = Math.max(0.9, Math.min(1.9, 70 / (visualLines * 1.4)));
    return `clamp(0.55rem, ${vh.toFixed(2)}vh, 1.05rem)`;
  }, [poem.lines.length]);

  const [revealed, setRevealed] = useState(reduceMotion ? totalChars : 0);
  const [scrambleSeed, setScrambleSeed] = useState(0);
  const doneRef = useRef(false);

  // ── Lock characters with variable cadence + sparse keystroke sound ──
  useEffect(() => {
    if (reduceMotion) return;
    if (revealed >= totalChars) return;

    const nextChar = charByGi[revealed] ?? '';
    let delay = 22;
    if ('.!?'.includes(nextChar)) delay = 150;
    else if (',;:—–'.includes(nextChar)) delay = 95;
    if (lineStartGis.has(revealed)) delay += 110; // breath at each new line

    const timer = setTimeout(() => {
      if (lineStartGis.has(revealed)) playTypewriterReturn();
      else if (revealed % 2 === 0) playTypewriterKey(); // sparse, not machine-gun
      setRevealed((r) => r + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [revealed, totalChars, reduceMotion, charByGi, lineStartGis]);

  // ── Scramble re-roll for the active look-ahead window ──
  useEffect(() => {
    if (reduceMotion || revealed >= totalChars) return;
    const id = setInterval(() => setScrambleSeed((s) => s + 1), 55);
    return () => clearInterval(id);
  }, [reduceMotion, revealed, totalChars]);

  // ── Completion: short dwell to absorb the final lines, then continue ──
  useEffect(() => {
    if (doneRef.current) return;
    if (revealed < totalChars) return;
    doneRef.current = true;
    const timer = setTimeout(onComplete, reduceMotion ? 1800 : 2800);
    return () => clearTimeout(timer);
  }, [revealed, totalChars, reduceMotion, onComplete]);

  return (
    <motion.div
      className="relative z-[35] flex w-full max-w-xl flex-col items-center px-4 sm:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      style={{ willChange: 'opacity' }}
    >
      {/* Soft glow behind poem */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0, 230, 160, 0.10) 0%, transparent 65%)',
          filter: 'blur(34px)',
        }}
      />

      {/* Title + author */}
      <motion.div
        className="text-center mb-2 sm:mb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
        style={{ willChange: 'opacity, transform' }}
      >
        <h2
          className="text-lg sm:text-xl md:text-2xl font-semibold tracking-wide mb-1"
          style={{
            fontFamily: '"Courier New", "Consolas", monospace',
            color: 'rgba(190, 255, 225, 0.95)',
            textShadow: '0 0 22px rgba(0, 230, 160, 0.35)',
          }}
        >
          {poem.title}
        </h2>
        <p
          className="text-[10px] sm:text-xs tracking-[0.2em] uppercase"
          style={{
            fontFamily: '"Courier New", "Consolas", monospace',
            color: 'rgba(120, 200, 170, 0.6)',
          }}
        >
          — {poem.author}
        </p>
        <div
          className="mt-2 mx-auto w-20 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(0, 230, 160, 0.5), transparent)',
          }}
        />
      </motion.div>

      {/* Assembling poem body — fits the viewport, no scrolling */}
      <div
        className="w-full text-center"
        style={{ fontFamily: '"Courier New", "Consolas", monospace', fontSize: bodyFontSize }}
      >
        {renderLines.map((slots, li) => {
          if (slots.length === 0) {
            return <div key={`gap-${li}`} style={{ height: '0.5em' }} aria-hidden />;
          }
          return (
            <p key={`line-${li}`} style={{ margin: 0, lineHeight: 1.38 }}>
              {slots.map((slot, ci) => {
                const key = `c-${li}-${ci}`;
                if (slot.gi < 0) {
                  return (
                    <span key={key} style={{ whiteSpace: 'pre' }}>
                      {' '}
                    </span>
                  );
                }

                const locked = reduceMotion || slot.gi < revealed;
                const scrambling = !locked && slot.gi < revealed + WINDOW;

                if (locked) {
                  return (
                    <span
                      key={key}
                      style={{
                        color: 'rgba(225, 255, 240, 0.95)',
                        textShadow:
                          '0 0 12px rgba(0, 230, 160, 0.45), 0 0 24px rgba(0, 200, 140, 0.18)',
                        transform: 'translateY(0)',
                        opacity: 1,
                        display: 'inline-block',
                        transition:
                          'transform 180ms ease-out, opacity 180ms ease-out, color 180ms',
                      }}
                    >
                      {slot.ch}
                    </span>
                  );
                }

                if (scrambling) {
                  const glyph =
                    SCRAMBLE[(slot.gi * 7 + scrambleSeed * 13) % SCRAMBLE.length];
                  return (
                    <span
                      key={key}
                      style={{
                        color: 'rgba(0, 235, 150, 0.8)',
                        textShadow: '0 0 10px rgba(0, 230, 150, 0.5)',
                        transform: 'translateY(-0.34em)',
                        opacity: 0.6,
                        display: 'inline-block',
                      }}
                    >
                      {glyph}
                    </span>
                  );
                }

                return (
                  <span key={key} style={{ opacity: 0, display: 'inline-block' }} aria-hidden>
                    {slot.ch}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    </motion.div>
  );
});
