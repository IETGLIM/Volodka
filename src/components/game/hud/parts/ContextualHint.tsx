/* ─── Volodka RPG – Contextual Hint (floating bottom hint) ───
   Shows a small floating hint near the bottom of the screen.
   Framer Motion animation: slide up, fade in, then fade out.
   Hints are queued one-at-a-time by useContextualHints.
*/

import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import type { ContextualHintData, HintCategory } from '@/hooks/useContextualHints';

interface ContextualHintProps {
  hint: ContextualHintData | null;
  onDismiss: () => void;
}

/* ── Category icon / accent ── */
const CATEGORY_ACCENT: Record<HintCategory, { border: string; glow: string; icon: string }> = {
  combat: {
    border: 'rgba(244,63,94,0.5)',
    glow: '0 0 16px rgba(244,63,94,0.25), 0 4px 20px rgba(0,0,0,0.5)',
    icon: '⚔',
  },
  quest: {
    border: 'rgba(251,191,36,0.45)',
    glow: '0 0 16px rgba(251,191,36,0.2), 0 4px 20px rgba(0,0,0,0.5)',
    icon: '📜',
  },
  interaction: {
    border: 'rgb(var(--cyber-cyan-rgb) / 0.4)',
    glow: '0 0 16px rgb(var(--cyber-cyan-rgb) / 0.2), 0 4px 20px rgba(0,0,0,0.5)',
    icon: '👆',
  },
  low_stats: {
    border: 'rgba(251,113,133,0.4)',
    glow: '0 0 16px rgba(251,113,133,0.2), 0 4px 20px rgba(0,0,0,0.5)',
    icon: '⚠',
  },
  scene: {
    border: 'rgb(var(--cyber-cyan-rgb) / 0.25)',
    glow: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.1), 0 4px 16px rgba(0,0,0,0.4)',
    icon: '📍',
  },
  tutorial: {
    border: 'rgba(100,116,139,0.3)',
    glow: '0 0 12px rgba(100,116,139,0.15), 0 4px 16px rgba(0,0,0,0.4)',
    icon: '💡',
  },
};

export function ContextualHint({ hint, onDismiss }: ContextualHintProps) {
  return (
    <AnimatePresence mode="wait">
      {hint && (
        <motion.div
          key={hint.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed left-1/2 -translate-x-1/2 pointer-events-auto cursor-pointer"
          style={{
            bottom: 'clamp(80px, 12vh, 140px)',
            zIndex: UI_LAYERS.HUD + 3,
          }}
          onClick={onDismiss}
          role="status"
          aria-live="polite"
        >
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border backdrop-blur-xl max-w-[90vw] sm:max-w-md hint-breathe-glow"
            style={{
              background: 'linear-gradient(135deg, rgba(2,6,23,0.92) 0%, rgba(15,23,42,0.88) 50%, rgba(0,0,0,0.85) 100%)',
              borderColor: CATEGORY_ACCENT[hint.category].border,
            }}
          >
            <span className="text-base shrink-0" aria-hidden="true">
              {CATEGORY_ACCENT[hint.category].icon}
            </span>
            <span className="text-xs sm:text-sm text-slate-200 font-medium leading-snug">
              {hint.text}
            </span>
            {/* Subtle dismiss indicator */}
            <span className="text-[9px] text-slate-500 font-mono shrink-0 ml-1 hidden sm:inline">
              [×]
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
