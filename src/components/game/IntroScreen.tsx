/* ─── Volodka RPG – Cinematic intro ───
 * One unified opening: the poem «Смерть есть лишь начало» materialises
 * out of the Matrix rain, then we hand off to the main menu. No separate
 * prose / title / "press any key" screens — it is all woven into a single
 * poem scene as requested.
 *
 * v4.48.4 «Ночная тетрадь — разворот»: стих переписывается из кода в тетрадь.
 * Лист тетради с шапкой-меткой, разворот на две страницы (lg+): слева —
 * вводная строка, титул и автор; справа — тело стиха с полями под чернила.
 * После сборки стиха на полях проявляется карандашная заметка Володьки
 * (src/data/poemMargins.ts, догеймплейный контекст). Тексты стихов и имена
 * не изменяются — меняется только подача.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { FilmGrain, Vignette, CinematicBars } from '@/components/game/cinematic';
import { MatrixRainBackdrop } from '@/components/game/intro/MatrixRainBackdrop';
import { MatrixPoemAssembly } from '@/components/game/intro/MatrixPoemAssembly';
import { IntroMarginNote } from '@/components/game/intro/IntroMarginNote';
import { useIntroScreen } from '@/components/game/intro/useIntroScreen';
import { useIntroSkipInput } from '@/components/game/intro/useIntroSkipInput';
import { toRoman } from '@/components/game/intro/introNotebookMeta';
import { INTRO_LEAD, INTRO_MAX_DURATION_MS, INTRO_POEM_ID } from '@/engine/intro/introConfig';
import { getPoemMargin } from '@/data/poemMargins';
import { shouldUseHeavyIntroFx, useDeviceTier } from '@/hooks/useDeviceTier';
import { useIsMobileVisual } from '@/hooks/use-mobile';

export interface IntroScreenProps {
  poemId?: string;
}

const COUNTDOWN_TOTAL_S = Math.ceil(INTRO_MAX_DURATION_MS / 1000);

/** Сколько читателю даётся на заметку «на полях» до ухода в меню. */
const MARGIN_NOTE_DWELL_MS = 5200;

/** Нейтральный догеймплейный контекст: кармы/флагов до игры ещё нет. */
const INTRO_MARGIN_CONTEXT = { karma: 0, flags: {}, currentAct: 1 } as const;

const SkipButton = memo(function SkipButton({
  onSkip,
  countdown,
}: {
  onSkip: () => void;
  countdown: number;
}) {
  const RING_R = 15.5;
  const RING_C = 2 * Math.PI * RING_R;
  const ringOffset = RING_C * (1 - Math.max(0, countdown) / COUNTDOWN_TOTAL_S);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.8 }}
      className="fixed bottom-5 right-5 flex flex-col items-end gap-2"
      style={{
        zIndex: UI_LAYERS.CINEMATIC_TRANSITION,
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <motion.button
        type="button"
        onClick={onSkip}
        animate={{ borderColor: ['rgba(157,179,200,0.28)', 'rgba(226,168,75,0.55)', 'rgba(157,179,200,0.28)'] }}
        transition={{ borderColor: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } }}
        className="flex items-center gap-3 px-5 py-3 font-mono text-xs sm:text-sm tracking-[0.2em] uppercase
                   text-[#eae4d6]/90 hover:text-white border border-[#9db3c8]/30
                   bg-[#0b0e15]/80 backdrop-blur-md rounded-sm
                   shadow-[0_10px_30px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(234,228,214,0.06)]
                   transition-colors duration-200
                   touch-manipulation select-none active:bg-[#e2a84b]/10 active:scale-95"
        style={{ willChange: 'opacity, transform' }}
        aria-label="Пропустить вступление"
      >
        {/* Кольцо автопропуска — истекает вместе с фейлсейвом интро */}
        <svg width="18" height="18" viewBox="0 0 36 36" aria-hidden className="shrink-0">
          <circle cx="18" cy="18" r={RING_R} fill="none" stroke="rgba(157,179,200,0.18)" strokeWidth="2.5" />
          <circle
            cx="18"
            cy="18"
            r={RING_R}
            fill="none"
            stroke="rgba(226,168,75,0.85)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={RING_C.toFixed(2)}
            strokeDashoffset={ringOffset.toFixed(2)}
            transform="rotate(-90 18 18)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        Пропустить ▸▸
      </motion.button>
      <span
        className="font-mono text-[11px] tracking-wider text-[#6e7f90]"
        aria-live="polite"
      >
        автопропуск {countdown}с
      </span>
    </motion.div>
  );
});

/** Single-screen cinematic intro — poem rewritten from the code into the notebook. */
export function IntroScreen({ poemId = INTRO_POEM_ID }: IntroScreenProps) {
  const reduceMotion = useReducedMotion();
  const deviceTier = useDeviceTier();
  const fx = shouldUseHeavyIntroFx(deviceTier);
  const isCompactViewport = useIsMobileVisual();
  // На узких вьюпортах разворота нет — стих занимает старый бюджет (70vh).
  // На десктопе хром разворота (поля/заметка) съедает вертикаль — 52vh.
  const poemHeightBudgetVh = isCompactViewport ? 70 : 52;
  const { introPoem, done, handlePoemComplete: finishComplete, handleSkip } = useIntroScreen(poemId);

  // Заметка «на полях»: пока стих собирается — скрыта, после сборки читается,
  // затем (MARGIN_NOTE_DWELL_MS) экран уходит в меню. Пропуск работает всегда.
  const marginNote = useMemo(
    () => (introPoem ? getPoemMargin(introPoem.id, INTRO_MARGIN_CONTEXT) : undefined),
    [introPoem],
  );
  const [noteVisible, setNoteVisible] = useState(false);
  const noteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearNoteTimer = useCallback(() => {
    if (noteTimerRef.current) {
      clearTimeout(noteTimerRef.current);
      noteTimerRef.current = null;
    }
  }, []);

  const handlePoemComplete = useCallback(() => {
    if (!marginNote) {
      finishComplete();
      return;
    }
    setNoteVisible(true);
    clearNoteTimer();
    noteTimerRef.current = setTimeout(
      finishComplete,
      reduceMotion ? 1600 : MARGIN_NOTE_DWELL_MS,
    );
  }, [marginNote, finishComplete, reduceMotion, clearNoteTimer]);

  useEffect(() => clearNoteTimer, [clearNoteTimer]);

  // Countdown timer for the failsafe auto-skip
  const [countdown, setCountdown] = useState(COUNTDOWN_TOTAL_S);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (done) return;
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [done]);

  const skipNow = useCallback(() => {
    clearNoteTimer();
    handleSkip();
  }, [clearNoteTimer, handleSkip]);

  useIntroSkipInput(!done, skipNow);

  return (
    <div
      className="game-critical-motion vk-intro-night fixed inset-0 h-[100dvh] min-h-[100dvh] w-full overflow-hidden"
      style={{ zIndex: UI_LAYERS.LOADING }}
      data-testid="intro-screen"
    >
      {fx.matrixRain && (
        <MatrixRainBackdrop opacity={0.18} reduceMotion={!!reduceMotion} zIndex={3} />
      )}
      {fx.vignette && <Vignette intensity={0.7} zIndex={55} />}
      {fx.filmGrain && <FilmGrain opacity={0.045} zIndex={60} />}
      {fx.cinematicBars && <CinematicBars variant="intro" />}

      {/* Тёплый отсвет фонаря позади листа */}
      <div className="vk-intro-lantern" aria-hidden style={{ zIndex: 8 }} />

      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-3 py-[7dvh] sm:px-6"
        style={{ zIndex: UI_LAYERS.DIALOGUE }}
      >
        {/* ── Лист тетради ── */}
        <motion.section
          className="vk-intro-sheet"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          aria-label={`Ночная тетрадь. Стих «${introPoem?.title ?? ''}»`}
          data-testid="intro-sheet"
          style={{ willChange: 'opacity, transform' }}
        >
          {/* Шапка листа */}
          <div className="vk-intro-sheethead" aria-hidden>
            <span className="vk-intro-sheetlabel">ночная тетрадь</span>
            <span className="vk-intro-sheetlabel">
              лист {toRoman(introPoem?.order ?? 1)}
            </span>
          </div>

          {/* Разворот: левая страница — вводная и титул; правая — стих */}
          <div className="vk-intro-spread flex-1">
            <div className="vk-intro-page vk-intro-page--left">
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 0.62, y: 0 }}
                transition={{ duration: 1.6, delay: 0.4 }}
                className="mb-5 max-w-sm text-center text-xs sm:text-sm italic leading-relaxed"
                style={{
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  color: '#eae4d6',
                  willChange: 'opacity, transform',
                }}
              >
                {INTRO_LEAD}
              </motion.p>

              {introPoem && (
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, delay: 0.2 }}
                  style={{ willChange: 'opacity, transform' }}
                >
                  <h2
                    className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-wide mb-1.5"
                    style={{
                      fontFamily: '"Georgia", "Times New Roman", serif',
                      color: 'rgba(234, 228, 214, 0.95)',
                      textShadow: '0 0 18px rgba(226, 168, 75, 0.22)',
                    }}
                  >
                    {introPoem.title}
                  </h2>
                  <p
                    className="text-[10px] sm:text-xs tracking-[0.22em] uppercase"
                    style={{
                      fontFamily: '"Courier New", "Consolas", monospace',
                      color: 'rgba(226, 168, 75, 0.62)',
                    }}
                  >
                    — {introPoem.author}
                  </p>
                  <div
                    className="mt-3 mx-auto w-24 h-px"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(226, 168, 75, 0.45), transparent)',
                    }}
                  />
                </motion.div>
              )}
            </div>

            {/* Корешок */}
            <div className="vk-intro-spine" aria-hidden />

            {/* Правая страница: тело стиха, собираемое из кода */}
            <div className="vk-intro-page vk-intro-page--right">
              <div className="vk-intro-marginline" aria-hidden />
              {introPoem && (
                <MatrixPoemAssembly
                  poem={introPoem}
                  onComplete={handlePoemComplete}
                  reduceMotion={!!reduceMotion}
                  showHeader={false}
                  heightBudgetVh={poemHeightBudgetVh}
                />
              )}
            </div>

            {/* Заметка «на полях» — четвёртый элемент grid: мобайл — под стихом,
                lg+ — под левой страницей (grid-column/row в intro-notebook.css) */}
            <div className="vk-intro-note-row">
              <IntroMarginNote
                margin={marginNote}
                visible={noteVisible}
                reduceMotion={!!reduceMotion}
              />
            </div>
          </div>
        </motion.section>
      </div>

      {!done && <SkipButton onSkip={skipNow} countdown={countdown} />}
    </div>
  );
}
