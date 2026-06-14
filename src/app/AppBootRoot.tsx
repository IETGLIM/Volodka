import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { BootScreen } from '@/app/BootScreen';
import { isBootGameDataLoaded, preloadBootGameData } from '@/data/gameDataLoader';
import { clearChunkReloadFlag, installChunkLoadRecovery } from '@/engine/chunkLoadRecovery';
import { loadingPipeline } from '@/engine/loading/LoadingPipeline';
import { eventBus } from '@/engine/EventBus';
import { BOOT_FIRST_FRAME_FALLBACK_MS } from '@/shared/constants/transitionTimings';

const LazyGamePage = lazy(() =>
  import('@/components/game/GamePage').then((m) => ({ default: m.GamePage })),
);

installChunkLoadRecovery();

function handleBootError(error: unknown): void {
  console.error('[boot] preloadGameData failed:', error);
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

  /** Degraded boot path — headless CI / slow WebGL may never emit first-frame. */
  useEffect(() => {
    if (!gameMounted || !overlayVisible) return;
    const timer = setTimeout(() => {
      const snap = loadingPipeline.getSnapshot();
      if (snap.stage === 'playable' || snap.stage === 'complete' || snap.stage === 'error') {
        return;
      }
      if (snap.pct >= 68) {
        // Menu boot ends at combat_ui (68%) without Rapier; synthesize first-frame for playable.
        loadingPipeline.reportStage('canvas_init');
        eventBus.emit('canvas:first-frame', { generation: Date.now() });
      }
    }, BOOT_FIRST_FRAME_FALLBACK_MS);
    return () => clearTimeout(timer);
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
