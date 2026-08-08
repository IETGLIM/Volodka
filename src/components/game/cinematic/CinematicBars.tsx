import { memo } from 'react';
import { motion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

export type CinematicBarsVariant = 'menu' | 'intro';

export interface CinematicBarsProps {
  variant?: CinematicBarsVariant;
}

// WS2: Letterbox bars now animate scaleY 0→1 on entry (and 1→0 on exit when
// wrapped in an AnimatePresence), matching the pattern of CinematicLetterboxBars
// in CinematicShell.tsx. Previously a plain <div> that popped in/out — a
// hard-snap mid-cinematic (e.g. ProloguePerfectionOverlay phase→'title').
const BAR_TRANSITION = { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const };

/** Letterbox bars — menu (styled) and intro (solid black) variants. */
export const CinematicBars = memo(function CinematicBars({ variant = 'menu' }: CinematicBarsProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const initial = reducedMotion ? { scaleY: 1 } : { scaleY: 0 };
  const animate = { scaleY: 1 };
  const exit = reducedMotion ? { scaleY: 1 } : { scaleY: 0 };
  const transition = reducedMotion ? { duration: 0 } : BAR_TRANSITION;

  if (variant === 'intro') {
    return (
      <>
        <motion.div
          className="absolute top-0 left-0 right-0 h-[7dvh] min-h-[28px] bg-black pointer-events-none"
          style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION, transformOrigin: 'top' }}
          initial={initial}
          animate={animate}
          exit={exit}
          transition={transition}
        />
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[7dvh] min-h-[28px] bg-black pointer-events-none"
          style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION, transformOrigin: 'bottom' }}
          initial={initial}
          animate={animate}
          exit={exit}
          transition={transition}
        />
      </>
    );
  }

  return (
    <>
      <motion.div
        className="absolute top-0 left-0 right-0 h-[6vh] min-h-[24px] menu-cinematic-bar menu-cinematic-bar-top pointer-events-none"
        style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION, transformOrigin: 'top' }}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[6vh] min-h-[24px] menu-cinematic-bar menu-cinematic-bar-bottom pointer-events-none"
        style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION, transformOrigin: 'bottom' }}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
      />
    </>
  );
});
