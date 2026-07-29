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
  combat: 'rgba(244,120,120,0.55)',
  quest: 'rgba(220,190,120,0.5)',
  interaction: 'rgba(160,210,220,0.45)',
  low_stats: 'rgba(240,150,150,0.45)',
  scene: 'rgba(160,190,210,0.35)',
  tutorial: 'rgba(150,160,175,0.3)',
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
          <div className="flex flex-col items-center gap-2 max-w-[88vw] sm:max-w-md px-3">
            <div
              className="w-16 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${CATEGORY_RULE[hint.category]}, transparent)` }}
            />
            <p
              className="text-center font-serif text-[12px] sm:text-[13px] leading-relaxed tracking-wide italic"
              style={{ color: 'rgba(210,220,230,0.82)', textShadow: '0 1px 8px rgba(0,0,0,0.65)' }}
            >
              {hint.text}
            </p>
            <div
              className="w-10 h-px opacity-60"
              style={{ background: `linear-gradient(90deg, transparent, ${CATEGORY_RULE[hint.category]}, transparent)` }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
