/* ─── Act I — «Первое чтение» AAA celebration (single overlay) ───
 * Replaces stacked matrix quote + quest-complete dialog for the wake poem beat. */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  prepareFirstReadingCelebrationContent,
  type FirstReadingCelebrationContent,
} from '@/engine/quest/firstReadingCelebrationContent';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

type Phase = 'quote' | 'complete';

type ViewProps = FirstReadingCelebrationContent & {
  onDismiss: () => void;
};

const EXIT_DURATION_S = 0.45;
const TYPEWRITER_MS_PER_CHAR = 32;
const AUTO_ADVANCE_PADDING_MS = 1500;
const AUTO_ADVANCE_MAX_MS = 5000;
const THEME_COLOR = '#00ffee';

export function FirstReadingCelebrationView({
  quoteText,
  poemData,
  rewardSummary,
  bonusXp,
  bonusCredits,
  onDismiss,
}: ViewProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const [phase, setPhase] = useState<Phase>('quote');
  const [visible, setVisible] = useState(true);
  const continueRef = useRef<HTMLButtonElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const typeSpeed = reducedMotion ? 0 : TYPEWRITER_MS_PER_CHAR;
  const { displayed, done, skip } = useTypewriter(quoteText, typeSpeed);

  const advanceFromQuote = useCallback(() => {
    if (phaseRef.current !== 'quote') return;
    skip();
    setPhase('complete');
  }, [skip]);

  const finish = useCallback(() => {
    setVisible(false);
  }, []);

  const callbacksRef = useRef({ advanceFromQuote, finish });

  useLayoutEffect(() => {
    callbacksRef.current = { advanceFromQuote, finish };
  }, [advanceFromQuote, finish]);

  useEffect(() => {
    if (reducedMotion && quoteText) skip();
  }, [reducedMotion, quoteText, skip]);

  useEffect(() => {
    if (phase !== 'quote' || !done || reducedMotion) return;
    const delay = Math.min(
      displayed.length * typeSpeed + AUTO_ADVANCE_PADDING_MS,
      AUTO_ADVANCE_MAX_MS,
    );
    const timer = setTimeout(advanceFromQuote, delay);
    return () => clearTimeout(timer);
  }, [phase, done, reducedMotion, advanceFromQuote, displayed.length, typeSpeed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onKeyDown = (event: KeyboardEvent) => {
      const currentPhase = phaseRef.current;

      if (event.key === 'Escape' && currentPhase === 'complete') {
        event.preventDefault();
        callbacksRef.current.finish();
        return;
      }

      if (event.key !== 'Enter' && event.key !== ' ') return;

      if (currentPhase === 'complete' && document.activeElement === continueRef.current) {
        return;
      }

      event.preventDefault();

      if (currentPhase === 'quote') {
        callbacksRef.current.advanceFromQuote();
      } else {
        callbacksRef.current.finish();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleCompleteAnimationComplete = useCallback(() => {
    if (phaseRef.current !== 'complete') return;
    continueRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (phase !== 'complete' || !reducedMotion) return;
    continueRef.current?.focus({ preventScroll: true });
  }, [phase, reducedMotion]);

  const handleExitComplete = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const poemLines = useMemo(
    () => poemData?.lines.slice(0, 3) ?? [],
    [poemData],
  );

  const exitDuration = reducedMotion ? 0 : EXIT_DURATION_S;

  return (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {visible && (
        <motion.div
          data-testid="first-reading-celebration"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: exitDuration }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION, background: 'rgba(0,0,0,0.9)' }}
          onClick={phase === 'quote' ? advanceFromQuote : undefined}
          role="dialog"
          aria-modal="true"
          aria-label="Первое чтение — задание выполнено"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,238,0.08) 2px, rgba(0,255,238,0.08) 4px)',
            }}
          />

          <AnimatePresence mode="wait">
            {phase === 'quote' ? (
              <motion.div
                key="quote"
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                className="relative z-10 max-w-2xl px-8 text-center cursor-pointer"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <p
                  className="mb-3 text-xs font-mono tracking-[0.35em] uppercase"
                  style={{ color: `${THEME_COLOR}aa` }}
                >
                  Акт I · Первое чтение
                </p>
                <p
                  className="text-xl md:text-2xl font-mono leading-relaxed"
                  style={{
                    color: THEME_COLOR,
                    textShadow: `0 0 24px ${THEME_COLOR}55`,
                  }}
                >
                  {displayed}
                  {!done && !reducedMotion ? (
                    // Blink animation defined globally in enhancements.css
                    <span className="typewriter-cursor" aria-hidden>
                      |
                    </span>
                  ) : null}
                </p>
                {done ? (
                  <p className="mt-6 text-[10px] font-mono tracking-widest text-slate-500">
                    нажмите, чтобы увидеть награды
                  </p>
                ) : null}
              </motion.div>
            ) : (
              <motion.div
                key="complete"
                initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reducedMotion ? undefined : { opacity: 0, scale: 0.98 }}
                onAnimationComplete={handleCompleteAnimationComplete}
                className="relative z-10 w-[min(92vw,520px)] px-6 py-7 rounded-xl border backdrop-blur-md pointer-events-auto"
                style={{
                  background:
                    'linear-gradient(145deg, rgba(0,24,18,0.96) 0%, rgba(0,12,8,0.94) 55%, rgba(20,12,0,0.92) 100%)',
                  borderColor: 'rgba(0,255,170,0.35)',
                  boxShadow: '0 0 40px rgba(0,255,170,0.12), 0 24px 64px rgba(0,0,0,0.55)',
                }}
                onClick={(e) => e.stopPropagation()}
                aria-label="Награда за задание Первое чтение"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg" aria-hidden>
                    ✓
                  </span>
                  <span
                    className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase"
                    style={{ color: '#66ffaa' }}
                  >
                    Задание выполнено
                  </span>
                </div>
                <h2 className="text-xl font-bold font-mono text-emerald-50 mb-4">Первое чтение</h2>

                {poemData && poemLines.length > 0 ? (
                  <div
                    className="mb-4 rounded-lg border px-4 py-3"
                    style={{
                      borderColor: 'rgba(251,191,36,0.35)',
                      background: 'rgba(120,60,10,0.18)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base" aria-hidden>
                        📖
                      </span>
                      <span className="text-sm font-semibold text-amber-200">{poemData.title}</span>
                      <span className="text-[10px] font-mono text-amber-400/70 ml-auto">в сборнике</span>
                    </div>
                    <div className="space-y-1">
                      {poemLines.map((line) => (
                        <p key={line} className="text-sm font-mono italic text-amber-100/90 leading-snug">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mb-4 text-xs font-mono text-amber-200/90">
                    Новый стих сохранён в сборнике — откройте 📖 справа в HUD.
                  </p>
                )}

                <div className="mb-5 space-y-1.5">
                  <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">Награды</p>
                  <p className="text-xs font-mono text-slate-200 leading-relaxed">{rewardSummary}</p>
                  <p className="text-[11px] font-mono text-cyan-300/80">
                    +{bonusXp} XP за задание · +{bonusCredits} кредитов
                  </p>
                </div>

                <button
                  ref={continueRef}
                  type="button"
                  data-testid="first-reading-celebration-continue"
                  onClick={finish}
                  className="w-full py-3 rounded-lg font-mono font-bold text-sm tracking-wide transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                  style={{
                    background: 'linear-gradient(90deg, rgba(0,180,120,0.85), rgba(0,255,170,0.75))',
                    color: '#041510',
                    boxShadow: '0 0 20px rgba(0,255,170,0.25)',
                  }}
                >
                  Продолжить исследование
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type ContainerProps = {
  onDismiss: () => void;
};

/** Loads celebration copy/rewards once, then renders the presentational overlay. */
export function FirstReadingCelebration({ onDismiss }: ContainerProps) {
  const content = useMemo(() => {
    try {
      return prepareFirstReadingCelebrationContent();
    } catch (error) {
      console.error('[FirstReadingCelebration] Failed to prepare content:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!content) onDismiss();
  }, [content, onDismiss]);

  if (!content) return null;

  return <FirstReadingCelebrationView {...content} onDismiss={onDismiss} />;
}
