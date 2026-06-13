import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrchestratorNarrativeOverlay, useOrchestratorShell } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/** Cinematic dim over the 3D world while story/dialogue overlays are open. */
export const NarrativeWorldDim = memo(function NarrativeWorldDim() {
  const { mode } = useOrchestratorShell();
  const { showStoryOverlay } = useOrchestratorNarrativeOverlay();
  const reducedMotion = useEffectiveReducedMotion();
  const visible = mode === 'exploration' && showStoryOverlay;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="narrative-world-dim"
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: UI_LAYERS.DIALOGUE - 1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.35 }}
          aria-hidden
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 85% 70% at 50% 45%, transparent 0%, rgba(0,0,0,0.35) 100%)',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-[45dvh] bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});
