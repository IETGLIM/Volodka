import { Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { MOTION_EASE } from '@/shared/constants/transitionTimings';
import { PipelineLoadingOverlay } from '../PipelineLoadingOverlay';
import { loadingPipeline } from '@/engine/loading/LoadingPipeline';
import { IntroAutoSkip } from './IntroAutoSkip';
import { RPGGameCanvas, LazyMenuScreen, LazyIntroScreen, LazyMatrixRainQuote } from './lazyPanels';
import type { MatrixQuoteState } from './types';
import type { GamePhase } from '@/shared/gamePhase';

type Props = {
  mode: GamePhase;
  introSeen: boolean;
  gameDataReady: boolean;
  canvasMounted: boolean;
  canvasReady: boolean;
  isTransitioning: boolean;
  fadeOutMs: number;
  matrixQuote: MatrixQuoteState;
  onDismissMatrixQuote: () => void;
};

/** Menu, intro, canvas shell, mode-transition overlay. */
export function OrchestratorCanvasLayer({
  mode,
  introSeen,
  gameDataReady,
  canvasMounted,
  canvasReady,
  isTransitioning,
  fadeOutMs,
  matrixQuote,
  onDismissMatrixQuote,
}: Props) {
  const [menuLoadingDismissed, setMenuLoadingDismissed] = useState(false);

  useEffect(() => {
    if (canvasMounted && !canvasReady && mode === 'menu') {
      loadingPipeline.reportStage('canvas_init');
    }
  }, [canvasMounted, canvasReady, mode]);

  return (
    <>
      {mode !== 'menu' && !gameDataReady && (
        <PipelineLoadingOverlay showTitle message="Загрузка данных..." />
      )}

      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            key="mode-transition"
            className="fixed inset-0 bg-black pointer-events-none"
            style={{ zIndex: UI_LAYERS.LOADING }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: fadeOutMs / 1000, ease: MOTION_EASE.cinematicOut }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.85) 100%)',
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                background:
                  'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,238,0.15) 2px, rgba(0,255,238,0.15) 4px)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {mode === 'menu' && (
        <Suspense fallback={null}>
          <LazyMenuScreen />
        </Suspense>
      )}

      {mode === 'menu' && canvasMounted && !menuLoadingDismissed && (
        <PipelineLoadingOverlay
          showTitle
          message="Инициализация..."
          onComplete={() => setMenuLoadingDismissed(true)}
        />
      )}

      {mode === 'intro' && !introSeen && (
        <Suspense fallback={null}>
          <LazyIntroScreen />
        </Suspense>
      )}
      {mode === 'intro' && introSeen && (
        <div className="fixed inset-0 bg-black" style={{ zIndex: UI_LAYERS.LOADING }} />
      )}
      <IntroAutoSkip />

      {canvasMounted && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: UI_LAYERS.CANVAS,
            visibility:
              mode === 'exploration' || mode === 'cutscene' || mode === 'combat' || mode === 'intro'
                ? 'visible'
                : 'hidden',
            pointerEvents: mode === 'exploration' || mode === 'cutscene' || mode === 'combat' ? 'auto' : 'none',
          }}
        >
          <Suspense fallback={<div className="fixed inset-0 bg-black" style={{ zIndex: UI_LAYERS.LOADING }} />}>
            <RPGGameCanvas />
          </Suspense>
        </div>
      )}

      <AnimatePresence>
        {matrixQuote && (
          <Suspense fallback={null}>
            <LazyMatrixRainQuote
              text={matrixQuote.text}
              actNumber={matrixQuote.actNumber}
              onDismiss={onDismissMatrixQuote}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
}
