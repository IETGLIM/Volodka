import { createRoot } from 'react-dom/client';
import { Toaster } from '@/components/ui/sonner';
import { BootScreen } from '@/app/BootScreen';
import '@/app/globals.css';
import { markAppStart } from '@/engine/performance/LoadingTimeline';
import { preloadBootGameData } from '@/data/gameDataLoader';
import { applyVisualSettings } from '@/engine/visualSettings';
import { initAccessibilitySettings } from '@/engine/accessibility/accessibilitySettings';
import { initVoiceLineRegistry } from '@/engine/audio/VoiceLineRegistry';
import { clearChunkReloadFlag, installChunkLoadRecovery } from '@/engine/chunkLoadRecovery';
import { loadingPipeline } from '@/engine/loading/LoadingPipeline';

installChunkLoadRecovery();
markAppStart();
applyVisualSettings();
initAccessibilitySettings();
initVoiceLineRegistry();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

const reactRoot = createRoot(root);

function handleBootError(error: unknown) {
  console.error('[boot] preloadGameData failed:', error);
  loadingPipeline.reportError(error);
}

async function boot() {
  loadingPipeline.reset();
  loadingPipeline.reportStage('boot_start');
  await preloadBootGameData();
  loadingPipeline.reportStage('game_page');

  const { GamePage } = await import('@/components/game/GamePage');
  clearChunkReloadFlag();

  reactRoot.render(
    <>
      <GamePage />
      <Toaster position="top-right" richColors />
    </>,
  );
}

function retryBoot() {
  loadingPipeline.reset();
  reactRoot.render(<BootScreen onRetry={retryBoot} />);
  void boot().catch(handleBootError);
}

reactRoot.render(<BootScreen onRetry={retryBoot} />);
void boot().catch(handleBootError);
