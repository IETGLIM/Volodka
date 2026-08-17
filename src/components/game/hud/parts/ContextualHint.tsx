/* ─── Volodka RPG – Contextual Hint (floating bottom hint) ───
   Filmic caption — no emoji chrome, no glowing tutorial cards.
*/

import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import type { ContextualHintData, HintCategory } from '@/hooks/useContextualHints';

interface ContextualHintProps {
  hint: ContextualHintData | null;
  onDismiss: () => void;
}

const CATEGORY_RULE: Record<HintCategory, string> = {
  combat: 'rgba(252,165,165,0.45)',
  quest: 'rgba(196,181,160,0.5)',
  interaction: 'rgba(168,180,188,0.4)',
  low_stats: 'rgba(252,165,165,0.4)',
  scene: 'rgba(168,162,158,0.35)',
  tutorial: 'rgba(120,113,108,0.3)',
};

export function ContextualHint({ hint, onDismiss }: ContextualHintProps) {
  return (
    <AnimatePresence mode="wait">
      {hint && (
        <motion.div
          key={hint.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed left-1/2 -translate-x-1/2 pointer-events-auto cursor-pointer"
          style={{
            bottom: 'clamp(72px, 11vh, 128px)',
            zIndex: UI_LAYERS.HUD + 3,
          }}
          onClick={onDismiss}
          role="status"
          aria-live="polite"
        >
          <div className="hud-filmic-caption hud-filmic-hint-attention max-w-[88vw] sm:max-w-md px-3">
            <div
              className="h-px w-16"
              style={{ background: `linear-gradient(90deg, transparent, ${CATEGORY_RULE[hint.category]}, transparent)` }}
              aria-hidden
            />
            <p className="hud-filmic-body text-[12px] sm:text-[13px]">
              {hint.text}
            </p>
            <div
              className="h-px w-10 opacity-60"
              style={{ background: `linear-gradient(90deg, transparent, ${CATEGORY_RULE[hint.category]}, transparent)` }}
              aria-hidden
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
