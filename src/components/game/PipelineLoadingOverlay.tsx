import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LoadingScreen } from '@/components/game/LoadingScreen';
import { loadingPipeline } from '@/engine/loading/LoadingPipeline';
import { useAnimatedLoadingProgress, useLoadingPipelineMeta } from '@/hooks/useLoadingPipeline';
import { useLoadingShellTransition } from '@/components/game/loadingShellMotion';
import { LOADING_PLAYABLE_DISMISS_MS } from '@/shared/constants/transitionTimings';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

interface PipelineLoadingOverlayProps {
  showTitle?: boolean;
  message?: string;
  /** Called when pipeline reaches `playable`. */
  onPlayable?: () => void;
  /** Called after exit animation finishes and overlay unmounts. */
  onComplete?: () => void;
  /** When true, show «Начать» at `playable` and wait for user confirmation. */
  requireStartConfirm?: boolean;
}

function isDismissStage(stage: string): boolean {
  return stage === 'playable' || stage === 'complete';
}

/**
 * Loading overlay bound to the boot pipeline.
 * Reacts to `playable` (auto-dismiss or start confirm) and fades out on dismiss.
 */
export function PipelineLoadingOverlay({
  showTitle = false,
  message,
  onPlayable,
  onComplete,
  requireStartConfirm = false,
}: PipelineLoadingOverlayProps) {
  const { stage, message: pipelineMessage } = useLoadingPipelineMeta();
  const progress = useAnimatedLoadingProgress();
  const { duration, ease } = useLoadingShellTransition();
  const [dismissRequested, setDismissRequested] = useState(false);
  const [playableNotified, setPlayableNotified] = useState(false);

  const requestDismiss = useCallback(() => {
    setDismissRequested(true);
  }, []);

  useEffect(() => {
    if (!isDismissStage(stage)) {
      setDismissRequested(false);
      setPlayableNotified(false);
    }
  }, [stage]);

  useEffect(() => {
    if (stage !== 'playable' || playableNotified) return;
    setPlayableNotified(true);
    onPlayable?.();
  }, [stage, playableNotified, onPlayable]);

  useEffect(() => {
    if (requireStartConfirm) {
      if (stage === 'complete') requestDismiss();
      return;
    }
    if (stage !== 'playable') return;
    const timer = setTimeout(requestDismiss, LOADING_PLAYABLE_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [stage, requireStartConfirm, requestDismiss]);

  const handleStart = () => {
    if (stage === 'playable') {
      loadingPipeline.reportStage('complete');
    }
    requestDismiss();
  };

  const displayMessage = message ?? pipelineMessage;
  const showStartButton =
    requireStartConfirm && stage === 'playable' && !dismissRequested;

  return (
    <AnimatePresence
      onExitComplete={() => {
        if (dismissRequested) onComplete?.();
      }}
    >
      {!dismissRequested && (
        <motion.div
          key="pipeline-loading"
          className="fixed inset-0"
          style={{
            zIndex: UI_LAYERS.LOADING,
            pointerEvents: showStartButton ? 'auto' : dismissRequested ? 'none' : 'auto',
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration, ease }}
        >
          <LoadingScreen showTitle={showTitle} progress={progress} message={displayMessage} />
          <AnimatePresence>
            {showStartButton && (
              <motion.div
                key="playable-start"
                className="absolute inset-x-0 bottom-[16dvh] z-10 flex justify-center"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration, ease }}
              >
                <button
                  type="button"
                  onClick={handleStart}
                  className="border border-cyan-400/50 bg-black/60 px-8 py-3 font-mono text-sm tracking-[0.25em] uppercase text-cyan-300/90 backdrop-blur-sm transition-colors hover:border-cyan-300 hover:text-cyan-200"
                >
                  Начать
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {stage === 'playable' && !requireStartConfirm && (
            <span className="sr-only" aria-live="polite">
              Игра готова
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
