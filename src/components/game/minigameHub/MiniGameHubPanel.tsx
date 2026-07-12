import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MiniGameHubContent } from '@/components/game/minigameHub/MiniGameHubContent';
import { audioEngine } from '@/engine/AudioEngine';
import { safePlayHubSfx } from '@/engine/minigame/hub/minigameHubPresentation';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

export type MiniGameHubProps = {
  open: boolean;
  onClose: () => void;
};

function MiniGameHubPanelInner({ open, onClose }: MiniGameHubProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const wasOpenRef = useRef(false);

  const handleClose = useCallback(() => {
    safePlayHubSfx(audioEngine.playSfx.bind(audioEngine), 'ui_close');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      safePlayHubSfx(audioEngine.playSfx.bind(audioEngine), 'ui_open');
    }
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      handleClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  const backdropMotion = reducedMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.25 },
      };

  const shellMotion = reducedMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.25 },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center font-mono"
          style={{ zIndex: UI_LAYERS.MENU }}
          data-testid="minigame-hub"
          {...shellMotion}
        >
          <motion.div
            className="absolute inset-0 backdrop-blur-md"
            style={{
              background:
                'linear-gradient(180deg, rgba(0, 0, 0, 0.88) 0%, rgba(5, 8, 18, 0.92) 100%)',
            }}
            onClick={handleClose}
            aria-hidden="true"
            {...backdropMotion}
          />

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.04) 2px, rgba(0, 0, 0, 0.04) 4px)',
            }}
            aria-hidden="true"
          />

          <MiniGameHubContent onClose={handleClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MiniGameHubPanel(props: MiniGameHubProps) {
  return (
    <ErrorBoundary name="MiniGameHub">
      <MiniGameHubPanelInner {...props} />
    </ErrorBoundary>
  );
}
