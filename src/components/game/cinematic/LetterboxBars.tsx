/* ─── Volodka RPG – Cinematic Letterbox Bars ───
 * Two black bars (top and bottom) that animate in/out.
 * Height: ~10% of viewport each.
 * Used during cutscenes and important dialogues.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

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
          {/* Top bar — FIX: сырой zIndex 100 совпадал с UI_LAYERS.LOADING;
              теперь канонический CINEMATIC_TRANSITION (95): бары накрывают
              HUD/диалоги/панели, но не перекрывают экран загрузки. */}
          <motion.div
            key="letterbox-top"
            className="fixed top-0 left-0 right-0 bg-black pointer-events-none"
            style={{ height: barHeight, zIndex: UI_LAYERS.CINEMATIC_TRANSITION }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
            aria-hidden="true"
          />
          {/* Bottom bar — UI_LAYERS.CINEMATIC_TRANSITION (см. комментарий выше) */}
          <motion.div
            key="letterbox-bottom"
            className="fixed bottom-0 left-0 right-0 bg-black pointer-events-none"
            style={{ height: barHeight, zIndex: UI_LAYERS.CINEMATIC_TRANSITION }}
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
