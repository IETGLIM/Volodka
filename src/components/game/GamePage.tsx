import { lazy, Suspense } from 'react';
import { GameErrorBoundary } from '@/components/game/GameErrorBoundary';

const GameOrchestrator = lazy(() =>
  import('./GameOrchestrator').then((m) => ({ default: m.GameOrchestrator })),
);

interface GamePageProps {
  /** When true, boot overlay is still visible — skip duplicate Suspense fallback. */
  suppressBootOverlay?: boolean;
}

/** Lightweight Suspense fallback while the orchestrator chunk loads. */
export function GamePageSuspenseFallback() {
  return (
    <div
      data-testid="game-page-suspense-fallback"
      className="fixed inset-0 bg-black flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Загрузка игры"
    >
      <p className="text-cyan-400 font-mono animate-pulse">Загрузка...</p>
    </div>
  );
}

export function GamePage({ suppressBootOverlay = false }: GamePageProps) {
  return (
    <GameErrorBoundary>
      <Suspense fallback={suppressBootOverlay ? null : <GamePageSuspenseFallback />}>
        <GameOrchestrator />
      </Suspense>
    </GameErrorBoundary>
  );
}
