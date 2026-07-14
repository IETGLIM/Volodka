import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LoadingScreen } from '@/components/game/LoadingScreen';
import { loadingPipeline } from '@/engine/loading/LoadingPipeline';
import { PIPELINE_LOADING_OVERLAY_LABELS } from '@/engine/loading/pipelineLoadingOverlayConstants';
import { useAnimatedLoadingProgress, useLoadingPipelineMeta } from '@/hooks/useLoadingPipeline';
import { useLoadingShellTransition } from '@/components/game/loadingShellMotion';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
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
  /** Override auto-dismiss delay after `playable` (ms). */
  playableDismissMs?: number;
}

function isDismissStage(stage: string): boolean {
  return stage === 'playable' || stage === 'complete';
}

function isPlayableReachedStage(stage: string): boolean {
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
  playableDismissMs = LOADING_PLAYABLE_DISMISS_MS,
}: PipelineLoadingOverlayProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const { stage, message: pipelineMessage } = useLoadingPipelineMeta();
  const progress = useAnimatedLoadingProgress();
  const { duration, ease } = useLoadingShellTransition();
  const [dismissRequested, setDismissRequested] = useState(false);
  const [playableNotified, setPlayableNotified] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);

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
    if (playableNotified || !isPlayableReachedStage(stage)) return;
    setPlayableNotified(true);
    onPlayable?.();
  }, [stage, playableNotified, onPlayable]);

  useEffect(() => {
    if (requireStartConfirm) {
      if (stage === 'complete') requestDismiss();
      return;
    }
    if (stage !== 'playable') return;
    const timer = setTimeout(requestDismiss, playableDismissMs);
    return () => clearTimeout(timer);
  }, [stage, requireStartConfirm, requestDismiss, playableDismissMs]);

  const displayMessage = message ?? pipelineMessage;
  const showStartButton =
    requireStartConfirm && stage === 'playable' && !dismissRequested;
  const motionDuration = reducedMotion ? 0 : duration;

  useEffect(() => {
    if (!showStartButton) return;
    startButtonRef.current?.focus();
  }, [showStartButton]);

  const handleStart = () => {
    if (stage === 'playable') {
      loadingPipeline.reportStage('complete');
    }
    requestDismiss();
  };

  return (
    <AnimatePresence
      onExitComplete={() => {
        if (dismissRequested) onComplete?.();
      }}
    >
      {!dismissRequested && (
        <motion.div
          key="pipeline-loading"
          role="dialog"
          aria-modal="true"
          aria-label={displayMessage}
          className="fixed inset-0"
          style={{
            zIndex: UI_LAYERS.LOADING,
            pointerEvents: showStartButton ? 'auto' : dismissRequested ? 'none' : 'auto',
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionDuration, ease }}
        >
          <LoadingScreen showTitle={showTitle} progress={progress} message={displayMessage} />
          <AnimatePresence>
            {showStartButton && (
              <motion.div
                key="playable-start"
                className="absolute inset-x-0 bottom-[16dvh] z-10 flex justify-center"
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: motionDuration, ease }}
              >
                <button
                  ref={startButtonRef}
                  type="button"
                  aria-label={PIPELINE_LOADING_OVERLAY_LABELS.startAria}
                  onClick={handleStart}
                  className="border border-cyan-400/50 bg-black/60 px-8 py-3 font-mono text-sm tracking-[0.25em] uppercase text-cyan-300/90 backdrop-blur-sm boot-start-btn"
                >
                  {PIPELINE_LOADING_OVERLAY_LABELS.startButton}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {showStartButton && (
            <span className="sr-only" aria-live="polite">
              {PIPELINE_LOADING_OVERLAY_LABELS.readyPrompt}
            </span>
          )}
          {stage === 'playable' && !requireStartConfirm && (
            <span className="sr-only" aria-live="polite">
              {PIPELINE_LOADING_OVERLAY_LABELS.ready}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
