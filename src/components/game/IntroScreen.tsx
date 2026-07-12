/* ─── Volodka RPG – Cinematic intro ───
 * One unified opening: the second poem «Смерть есть лишь начало» materialises
 * out of the Matrix rain (with a typewriter sound), then we hand off to the
 * main menu. No separate prose / title / "press any key" screens — it is all
 * woven into a single poem scene as requested.
 */

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { FilmGrain, Vignette, CinematicBars } from '@/components/game/cinematic';
import { MatrixRainBackdrop } from '@/components/game/intro/MatrixRainBackdrop';
import { MatrixPoemAssembly } from '@/components/game/intro/MatrixPoemAssembly';
import { useIntroScreen } from '@/components/game/intro/useIntroScreen';
import { useIntroSkipInput } from '@/components/game/intro/useIntroSkipInput';
import { INTRO_LEAD, INTRO_POEM_ID } from '@/engine/intro/introConfig';
import { shouldUseHeavyIntroFx, useDeviceTier } from '@/hooks/useDeviceTier';

export interface IntroScreenProps {
  poemId?: string;
}

const SkipButton = memo(function SkipButton({ onSkip }: { onSkip: () => void }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 1 }}
      onClick={onSkip}
      className="fixed top-8 right-8 z-[70] px-4 py-2 font-mono text-xs tracking-[0.2em] uppercase
                 text-white/30 hover:text-white/70 border border-white/10 hover:border-white/30
                 bg-black/40 backdrop-blur-sm rounded transition-all duration-300
                 touch-manipulation select-none active:bg-white/10 active:scale-95"
      style={{ willChange: 'opacity, transform' }}
      aria-label="Пропустить вступление"
    >
      Пропустить ▸▸
    </motion.button>
  );
});

/** Single-screen cinematic intro — poem assembled from the Matrix rain. */
export function IntroScreen({ poemId = INTRO_POEM_ID }: IntroScreenProps) {
  const reduceMotion = useReducedMotion();
  const deviceTier = useDeviceTier();
  const fx = shouldUseHeavyIntroFx(deviceTier);
  const { introPoem, done, handlePoemComplete, handleSkip } = useIntroScreen(poemId);

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

      <div className="absolute inset-0 flex flex-col items-center justify-center z-[30] px-6">
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

      {!done && <SkipButton onSkip={handleSkip} />}
    </div>
  );
}
