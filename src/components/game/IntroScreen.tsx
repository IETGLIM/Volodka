/* ─── Volodka RPG – Cinematic intro ───
 * One unified opening: the second poem «Смерть есть лишь начало» materialises
 * out of the Matrix rain (with a typewriter sound), then we hand off to the
 * main menu. No separate prose / title / "press any key" screens — it is all
 * woven into a single poem scene as requested.
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { FilmGrain, Vignette, CinematicBars } from '@/components/game/cinematic';
import { MatrixRainBackdrop } from '@/components/game/intro/MatrixRainBackdrop';
import { MatrixPoemAssembly } from '@/components/game/intro/MatrixPoemAssembly';
import { useIntroScreen } from '@/components/game/intro/useIntroScreen';
import { useIntroSkipInput } from '@/components/game/intro/useIntroSkipInput';
import { INTRO_LEAD, INTRO_MAX_DURATION_MS, INTRO_POEM_ID } from '@/engine/intro/introConfig';
import { shouldUseHeavyIntroFx, useDeviceTier } from '@/hooks/useDeviceTier';

export interface IntroScreenProps {
  poemId?: string;
}

const COUNTDOWN_TOTAL_S = Math.ceil(INTRO_MAX_DURATION_MS / 1000);

const SkipButton = memo(function SkipButton({
  onSkip,
  countdown,
}: {
  onSkip: () => void;
  countdown: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.8 }}
      className="fixed top-8 right-8 flex flex-col items-end gap-2"
      style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }}
    >
      <motion.button
        type="button"
        onClick={onSkip}
        animate={{
          scale: [1, 1.06, 1],
          borderColor: ['rgba(0,220,180,0.3)', 'rgba(0,220,180,0.7)', 'rgba(0,220,180,0.3)'],
        }}
        transition={{
          scale: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
          borderColor: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="px-6 py-3 font-mono text-sm tracking-[0.2em] uppercase
                   text-cyan-200/90 hover:text-white border-2 border-cyan-400/50
                   bg-black/60 backdrop-blur-md rounded
                   shadow-[0_0_18px_rgba(0,220,180,0.25),0_0_40px_rgba(0,220,180,0.1)]
                   transition-colors duration-200
                   touch-manipulation select-none active:bg-cyan-400/20 active:scale-95"
        style={{ willChange: 'opacity, transform' }}
        aria-label="Пропустить вступление"
      >
        Пропустить ▸▸
      </motion.button>
      <span
        className="font-mono text-[11px] tracking-wider text-cyan-400/50"
        aria-live="polite"
      >
        автопропуск {countdown}с
      </span>
    </motion.div>
  );
});

/** Single-screen cinematic intro — poem assembled from the Matrix rain. */
export function IntroScreen({ poemId = INTRO_POEM_ID }: IntroScreenProps) {
  const reduceMotion = useReducedMotion();
  const deviceTier = useDeviceTier();
  const fx = shouldUseHeavyIntroFx(deviceTier);
  const { introPoem, done, handlePoemComplete, handleSkip } = useIntroScreen(poemId);

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

  useIntroSkipInput(!done, handleSkip);

  return (
    <div
      className="game-critical-motion fixed inset-0 h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-black"
      style={{ zIndex: UI_LAYERS.LOADING }}
      data-testid="intro-screen"
    >
      {fx.matrixRain && (
        <MatrixRainBackdrop opacity={0.22} reduceMotion={!!reduceMotion} zIndex={3} />
      )}
      {fx.vignette && <Vignette intensity={0.7} zIndex={55} />}
      {fx.filmGrain && <FilmGrain opacity={0.045} zIndex={60} />}
      {fx.cinematicBars && <CinematicBars variant="intro" />}

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6" style={{ zIndex: UI_LAYERS.DIALOGUE }}>
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ duration: 1.6, delay: 0.4 }}
          className="mb-4 max-w-md text-center text-xs sm:text-sm italic"
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            color: 'rgba(180, 220, 205, 0.55)',
            willChange: 'opacity, transform',
          }}
        >
          {INTRO_LEAD}
        </motion.p>

        {introPoem && (
          <MatrixPoemAssembly
            poem={introPoem}
            onComplete={handlePoemComplete}
            reduceMotion={!!reduceMotion}
          />
        )}
      </div>

      {!done && <SkipButton onSkip={handleSkip} countdown={countdown} />}
    </div>
  );
}