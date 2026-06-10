/* ─── Volodka RPG – Cinematic intro ───
 * One unified opening: the second poem «Смерть есть лишь начало» materialises
 * out of the Matrix rain (with a typewriter sound), then we hand off to the
 * main menu. No separate prose / title / "press any key" screens — it is all
 * woven into a single poem scene as requested.
 */

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { POEMS } from '@/data/poems';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { FilmGrain, Vignette, CinematicBars } from '@/components/game/cinematic';
import { MatrixRainBackdrop } from '@/components/game/intro/MatrixRainBackdrop';
import { MatrixPoemAssembly } from '@/components/game/intro/MatrixPoemAssembly';

const INTRO_LEAD =
  'История про Володьку — уставшего инженера, что искал стихи, спрятанные в коде.';

const SkipButton = memo(function SkipButton({ onSkip }: { onSkip: () => void }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 1 }}
      onClick={onSkip}
      onTouchStart={(e) => {
        e.preventDefault();
        onSkip();
      }}
      className="fixed top-8 right-8 z-[70] px-4 py-2 font-mono text-xs tracking-[0.2em] uppercase
                 text-white/30 hover:text-white/70 border border-white/10 hover:border-white/30
                 bg-black/40 backdrop-blur-sm rounded transition-all duration-300
                 touch-manipulation select-none active:bg-white/10 active:scale-95"
      aria-label="Пропустить вступление"
    >
      Пропустить ▸▸
    </motion.button>
  );
});

/** Single-screen cinematic intro — poem assembled from the Matrix rain. */
export function IntroScreen() {
  const collectPoem = useGameStore((s) => s.collectPoem);
  const setIntroSeen = useGameStore((s) => s.setIntroSeen);
  const setMainMenuOpen = useGameStore((s) => s.setMainMenuOpen);
  const setShowStoryOverlay = useGameStore((s) => s.setShowStoryOverlay);
  const reduceMotion = useReducedMotion();

  const introPoem = useMemo(() => POEMS.find((p) => p.id === 'poem_2'), []);
  const [done, setDone] = useState(false);

  // Poem finished (or skipped) → open the main menu.
  const finish = useCallback(() => {
    setDone((wasDone) => {
      if (wasDone) return true;
      collectPoem('poem_2');
      setShowStoryOverlay(false);
      setIntroSeen(true);
      setMainMenuOpen(true);
      return true;
    });
  }, [collectPoem, setShowStoryOverlay, setIntroSeen, setMainMenuOpen]);

  // Safety: if the poem can't load, still hand off to the menu.
  useEffect(() => {
    if (introPoem) return;
    const t = setTimeout(finish, 500);
    return () => clearTimeout(t);
  }, [introPoem, finish]);

  return (
    <div
      className="game-critical-motion fixed inset-0 h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-black"
      style={{ zIndex: UI_LAYERS.LOADING }}
    >
      <MatrixRainBackdrop opacity={0.22} reduceMotion={!!reduceMotion} zIndex={3} />
      <Vignette intensity={0.7} zIndex={55} />
      <FilmGrain opacity={0.045} zIndex={60} />
      <CinematicBars variant="intro" />

      <div className="absolute inset-0 flex flex-col items-center justify-center z-[30] px-6">
        {/* Intro words — woven into the same poem screen */}
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ duration: 1.6, delay: 0.4 }}
          className="mb-4 max-w-md text-center text-xs sm:text-sm italic"
          style={{ fontFamily: '"Georgia", "Times New Roman", serif', color: 'rgba(180, 220, 205, 0.55)' }}
        >
          {INTRO_LEAD}
        </motion.p>

        {introPoem && (
          <MatrixPoemAssembly
            poem={introPoem}
            onComplete={finish}
            reduceMotion={!!reduceMotion}
          />
        )}
      </div>

      {!done && <SkipButton onSkip={finish} />}
    </div>
  );
}
