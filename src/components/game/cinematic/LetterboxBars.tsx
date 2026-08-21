/* ─── Volodka RPG – Cinematic Letterbox Bars ───
 * Two black bars (top and bottom) that animate in/out.
 * Height: ~10% of viewport each.
 * Used during cutscenes and important dialogues.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface LetterboxProps {
  /** Whether letterbox bars are active (visible) */
  active: boolean;
  /** Custom bar height as a CSS value (default: 10dvh) */
  barHeight?: string;
}

/** Cinematic letterbox overlay — top and bottom black bars. */
export const Letterbox = memo(function Letterbox({
  active,
  barHeight = '10dvh',
}: LetterboxProps) {
  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Top bar */}
          <motion.div
            key="letterbox-top"
            className="fixed top-0 left-0 right-0 bg-black pointer-events-none"
            style={{ height: barHeight, zIndex: 100 }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
            aria-hidden="true"
          />
          {/* Bottom bar */}
          <motion.div
            key="letterbox-bottom"
            className="fixed bottom-0 left-0 right-0 bg-black pointer-events-none"
            style={{ height: barHeight, zIndex: 100 }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
            aria-hidden="true"
          />
        </>
      )}
    </AnimatePresence>
  );
});
