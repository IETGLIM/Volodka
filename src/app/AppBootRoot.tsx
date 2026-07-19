import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { BootScreen } from '@/app/BootScreen';
import { isBootGameDataLoaded, preloadBootGameData } from '@/data/gameDataLoader';
import { clearChunkReloadFlag } from '@/shared/chunk/chunkLoadRecovery';
import { loadingPipeline } from '@/engine/loading/LoadingPipeline';
import { eventBus } from '@/engine/EventBus';
import { BOOT_FIRST_FRAME_FALLBACK_MS } from '@/shared/constants/transitionTimings';

const LazyGamePage = lazy(() =>
  import('@/components/game/GamePage').then((m) => ({ default: m.GamePage })),
);

// Note: installChunkLoadRecovery() is now called in main.tsx BEFORE
// createRoot().render() — this ensures the vite:preloadError handler is
// installed before any lazy chunk preload attempt.

function handleBootError(error: unknown): void {
  console.error('[boot] preloadGameData failed:', error);
  // reportError() already sets stage='error', emits the snapshot, and fires
  // the 'boot:failed' event — no separate reportStage() call is needed.
  // ('boot_error' is not a valid LoadingStageId; the terminal failure stage
  // is 'error', which reportError() sets internally.)
  loadingPipeline.reportError(error);
}

async function runBootSequence(forcePipelineReset = false): Promise<void> {
  const e2eBootFail =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('e2e_boot_fail') === '1';

  if (e2eBootFail) {
    loadingPipeline.reset();
    loadingPipeline.reportStage('boot_start');
    throw new Error('E2E simulated boot failure');
  }

  if (forcePipelineReset || !isBootGameDataLoaded()) {
    loadingPipeline.reset();
    loadingPipeline.reportStage('boot_start');
  }

  if (!isBootGameDataLoaded()) {
    await preloadBootGameData();
  }

  loadingPipeline.reportStage('game_page');
  clearChunkReloadFlag();
}

/**
 * Boot shell — keeps a single loading overlay until the pipeline dismisses,
 * while mounting GamePage underneath (no hard swap / duplicate overlays).
 */
export function AppBootRoot() {
  const [gameMounted, setGameMounted] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [bootAttempt, setBootAttempt] = useState(0);
  const bootRunIdRef = useRef(0);
  const menuBootSynthesizedRef = useRef(false);

  useEffect(() => {
    menuBootSynthesizedRef.current = false;
  }, [bootAttempt]);

  useEffect(() => {
    const runId = ++bootRunIdRef.current;
    const forceReset = bootAttempt > 0;
    void runBootSequence(forceReset)
      .then(() => {
        if (bootRunIdRef.current === runId) setGameMounted(true);
      })
      .catch((error) => {
        if (bootRunIdRef.current === runId) handleBootError(error);
      });
  }, [bootAttempt]);

  const retryBoot = useCallback(() => {
    setGameMounted(false);
    setOverlayVisible(true);
    setBootAttempt((n) => n + 1);
  }, []);

  const handleGoToMenu = useCallback(() => {
    clearChunkReloadFlag();
    setGameMounted(true);
    setOverlayVisible(false);
  }, []);

  const handleOverlayComplete = useCallback(() => {
    setOverlayVisible(false);
  }, []);

  /** Menu boot may finish before real first-frame; synthesize or retry once data/canvas are ready. */
  useEffect(() => {
    if (!gameMounted || !overlayVisible) return;

    const synthesizeCanvasFirstFrame = (): void => {
      loadingPipeline.reportStage('canvas_init');
      eventBus.emit('canvas:first-frame', { generation: Date.now() });
    };

    const tryCompleteMenuBoot = (): boolean => {
      const snap = loadingPipeline.getSnapshot();
      if (snap.stage === 'playable' || snap.stage === 'complete' || snap.stage === 'error') {
        menuBootSynthesizedRef.current = true;
        return true;
      }

      // Retry when canvas_init was reported without a matching first-frame (82% hang).
      if (snap.stage === 'canvas_init') {
        menuBootSynthesizedRef.current = true;
        eventBus.emit('canvas:first-frame', { generation: Date.now() });
        return true;
      }

      if (menuBootSynthesizedRef.current) return true;

      if (snap.pct >= 68) {
        menuBootSynthesizedRef.current = true;
        synthesizeCanvasFirstFrame();
        return true;
      }
      return false;
    };

    if (tryCompleteMenuBoot()) return;

    const unsub = loadingPipeline.subscribe(() => {
      tryCompleteMenuBoot();
    });

    const timer = setTimeout(() => {
      tryCompleteMenuBoot();
    }, BOOT_FIRST_FRAME_FALLBACK_MS);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [gameMounted, overlayVisible]);

  return (
    <>
      {gameMounted && (
        <Suspense fallback={null}>
          <LazyGamePage suppressBootOverlay={overlayVisible} />
        </Suspense>
      )}
      {overlayVisible && (
        <BootScreen
          onRetry={retryBoot}
          onGoToMenu={handleGoToMenu}
          onComplete={handleOverlayComplete}
        />
      )}
      <Toaster position="top-right" richColors />
    </>
  );
}
