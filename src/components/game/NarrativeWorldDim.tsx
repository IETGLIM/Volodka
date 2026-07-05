import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrchestratorNarrativeOverlay, useOrchestratorShell } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/** Cinematic dim over the 3D world while story/dialogue beats play (letterbox-friendly). */
export const NarrativeWorldDim = memo(function NarrativeWorldDim() {
  const { mode } = useOrchestratorShell();
  const { showStoryOverlay, diegeticNarrative } = useOrchestratorNarrativeOverlay();
  const reducedMotion = useEffectiveReducedMotion();
  const isDiegeticOnly = diegeticNarrative != null && !showStoryOverlay;
  const visible = mode === 'exploration' && (showStoryOverlay || isDiegeticOnly);

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
          transition={{ duration: reducedMotion ? 0 : 0.45 }}
          aria-hidden
        >
          <div
            className="absolute inset-0"
            style={{
              background: isDiegeticOnly
                ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.45) 88%)'
                : 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.72) 88%)',
            }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});
