import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from '@/components/ui/sonner';
import { BootScreen } from '@/app/BootScreen';
import '@/app/globals.css';
import { markAppStart } from '@/engine/performance/LoadingTimeline';
import { preloadBootGameData } from '@/data/gameDataLoader';
import { applyVisualSettings } from '@/engine/visualSettings';
import { clearChunkReloadFlag, installChunkLoadRecovery } from '@/engine/chunkLoadRecovery';

installChunkLoadRecovery();
markAppStart();
applyVisualSettings();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

const reactRoot = createRoot(root);

function handleBootError(error: unknown) {
  console.error('[boot] preloadGameData failed:', error);
  const message = error instanceof Error ? error.message : String(error);
  reactRoot.render(<BootScreen error={message} onRetry={retryBoot} />);
}

async function boot() {
  await preloadBootGameData();

  const { GamePage } = await import('@/components/game/GamePage');
  clearChunkReloadFlag();

  reactRoot.render(
    <StrictMode>
      <GamePage />
      <Toaster position="top-right" richColors />
    </StrictMode>,
  );
}

function retryBoot() {
  reactRoot.render(<BootScreen />);
  void boot().catch(handleBootError);
}

reactRoot.render(<BootScreen />);
void boot().catch(handleBootError);
