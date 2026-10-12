/* ─── Volodka RPG – Matrix poem assembly ───
 * The opening poem materialises out of the digital rain: each letter first
 * tumbles in as a scrambling green glyph, then "stands up" and locks into the
 * real character with a typewriter keystroke. Lines resolve left-to-right.
 *
 * v4.48.4 «Ночная тетрадь»: собранные буквы больше не фосфорные — они
 * ЧЕРНИЛЬНЫЕ (тёплая бумага на тёмном листе, см. intro-notebook.css).
 * Драматургия: буквы рождаются зелёным кодом и при фиксации «высыхают»
 * в чернила — стих переписывается из кода в тетрадь.
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
  /** v4.48.4: шапку (титул/автор) можно вынести на левую страницу разворота —
   *  тогда компонент рисует только тело стиха. По умолчанию рисует сам. */
  showHeader?: boolean;
  /** v4.48.4: вертикальный бюджет стиха в vh. На развороте тетради хром
   *  (шапка/поля/заметка) съедает высоту — родитель передаёт меньший бюджет
   *  (напр. 52 на десктопном развороте, 70 — прежнее поведение — на мобайл). */
  heightBudgetVh?: number;
}

export const MatrixPoemAssembly = memo(function MatrixPoemAssembly({
  poem,
  onComplete,
  reduceMotion,
  showHeader = true,
  heightBudgetVh = 70,
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
  // heightBudgetVh: сколько вертикали в vh можно отдать телу стиха.
  const bodyFontSize = useMemo(() => {
    const visualLines = poem.lines.length || 1;
    const vh = Math.max(0.9, Math.min(1.9, heightBudgetVh / (visualLines * 1.4)));
    return `clamp(0.55rem, ${vh.toFixed(2)}vh, 1.05rem)`;
  }, [poem.lines.length, heightBudgetVh]);

  const [revealed, setRevealed] = useState(reduceMotion ? totalChars : 0);
  const [scrambleSeed, setScrambleSeed] = useState(0);
  const doneRef = useRef(false);

  // ── Lock characters with variable cadence + sparse keystroke sound ──
  useEffect(() => {
    if (reduceMotion) return;
    if (revealed >= totalChars) return;

    const nextChar = charByGi[revealed] ?? '';
    let delay = 9;
    if ('.!?'.includes(nextChar)) delay = 60;
    else if (',;:—–'.includes(nextChar)) delay = 38;
    if (lineStartGis.has(revealed)) delay += 44; // breath at each new line

    const timer = setTimeout(() => {
      if (lineStartGis.has(revealed)) playTypewriterReturn();
      else if (revealed % 2 === 0) playTypewriterKey(); // sparse, not machine-gun
      setRevealed((r) => r + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [revealed, totalChars, reduceMotion, charByGi, lineStartGis]);

  // ── Scramble re-roll for the active look-ahead window ──
  // FIX (perf v4.22): был setInterval(22мс) ≈ 45 ре-рендеров/сек компонента
  // поэмы — на слабых устройствах это джанкило самый дорогой первый экран.
  // Теперь rAF с капом ~45Гц: пауза в скрытой вкладке бесплатно (браузер
  // не вызывает rAF), выравнивание с кадрами отрисовки.
  useEffect(() => {
    if (reduceMotion || revealed >= totalChars) return;
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      if (t - last >= 22) {
        last = t;
        setScrambleSeed((s) => s + 1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, revealed, totalChars]);

  // ── Completion: short dwell to absorb the final lines, then continue ──
  useEffect(() => {
    if (doneRef.current) return;
    if (revealed < totalChars) return;
    doneRef.current = true;
    const timer = setTimeout(onComplete, reduceMotion ? 800 : 1200);
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
      {/* Warm lantern glow behind the poem page (Ночная тетрадь) */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(226, 168, 75, 0.09) 0%, transparent 66%)',
          filter: 'blur(34px)',
        }}
      />

      {/* Title + author — v4.48.4: можно вынести на левую страницу разворота */}
      {showHeader && (
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
              fontFamily: '"Georgia", "Times New Roman", serif',
              color: 'rgba(234, 228, 214, 0.95)',
              textShadow: '0 0 18px rgba(226, 168, 75, 0.22)',
            }}
          >
            {poem.title}
          </h2>
          <p
            className="text-[10px] sm:text-xs tracking-[0.2em] uppercase"
            style={{
              fontFamily: '"Courier New", "Consolas", monospace',
              color: 'rgba(226, 168, 75, 0.62)',
            }}
          >
            — {poem.author}
          </p>
          <div
            className="mt-2 mx-auto w-20 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(226, 168, 75, 0.45), transparent)',
            }}
          />
        </motion.div>
      )}

      {/* Assembling poem body — fits the viewport, no scrolling.
          A11y: текст стиха целиком отдаётся в aria-label фигуры,
          визуальные глифы (включая катакану-скрамбл) скрыты от SR. */}
      <div
        role="figure"
        aria-label={`${poem.title}. ${poem.author}. ${poem.lines.join('\n')}`}
        className="w-full text-center"
        style={{ fontFamily: '"Courier New", "Consolas", monospace', fontSize: bodyFontSize }}
      >
        {renderLines.map((slots, li) => {
          if (slots.length === 0) {
            return <div key={`gap-${li}`} style={{ height: '0.5em' }} aria-hidden />;
          }
          return (
            <p key={`line-${li}`} style={{ margin: 0, lineHeight: 1.38 }} aria-hidden>
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
                        color: 'rgba(234, 228, 214, 0.95)',
                        textShadow:
                          '0 0 1px rgba(234, 228, 214, 0.3), 0 0 14px rgba(226, 168, 75, 0.16)',
                        transform: 'translateY(0)',
                        opacity: 1,
                        display: 'inline-block',
                        transition:
                          'transform 180ms ease-out, opacity 180ms ease-out, color 260ms ease-out, text-shadow 260ms ease-out',
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
                        color: 'rgba(70, 185, 110, 0.8)',
                        textShadow: '0 0 10px rgba(70, 185, 110, 0.5)',
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
