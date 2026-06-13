import { lazy, Suspense } from 'react';
import { GameErrorBoundary } from '@/components/game/GameErrorBoundary';

const GameOrchestrator = lazy(() =>
  import('./GameOrchestrator').then((m) => ({ default: m.GameOrchestrator })),
);

interface GamePageProps {
  /** When true, boot overlay is still visible — skip duplicate Suspense fallback. */
  suppressBootOverlay?: boolean;
}

export function GamePage({ suppressBootOverlay = false }: GamePageProps) {
  return (
    <GameErrorBoundary>
      <Suspense fallback={suppressBootOverlay ? null : undefined}>
        <GameOrchestrator />
      </Suspense>
    </GameErrorBoundary>
  );
}
