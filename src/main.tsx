import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from '@/components/ui/sonner';
import '@/app/globals.css';
import { markAppStart } from '@/engine/performance/LoadingTimeline';
import { preloadBootGameData } from '@/data/gameDataLoader';
import { applyVisualSettings } from '@/engine/visualSettings';

markAppStart();
applyVisualSettings();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

function showBootError(message: string) {
  root!.innerHTML = `
    <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#000;color:#f87171;font-family:monospace;padding:24px;text-align:center">
      <div>
        <div style="font-size:24px;margin-bottom:12px">⚠</div>
        <div style="margin-bottom:8px">Не удалось загрузить данные игры</div>
        <div style="font-size:12px;color:#94a3b8;max-width:420px">${message}</div>
      </div>
    </div>`;
}

async function boot() {
  await preloadBootGameData();

  const { GamePage } = await import('@/components/game/GamePage');

  createRoot(root!).render(
    <StrictMode>
      <GamePage />
      <Toaster position="top-right" richColors />
    </StrictMode>,
  );
}

root.innerHTML = `
  <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#000;color:rgb(var(--cyber-cyan-rgb) / 0.7);font-family:monospace;letter-spacing:0.2em;font-size:14px">
    ЗАГРУЗКА...
  </div>`;

void boot().catch((error: unknown) => {
  console.error('[boot] preloadGameData failed:', error);
  const message = error instanceof Error ? error.message : String(error);
  showBootError(message);
});
