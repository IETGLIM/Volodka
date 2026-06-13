import { lazy, Suspense } from 'react';
import { GameErrorBoundary } from '@/components/game/GameErrorBoundary';
import { PipelineLoadingOverlay } from '@/components/game/PipelineLoadingOverlay';

const GameOrchestrator = lazy(() =>
  import('./GameOrchestrator').then((m) => ({ default: m.GameOrchestrator })),
);

function GamePageSuspenseFallback() {
  return (
    <PipelineLoadingOverlay
      showTitle
      message="Подключение оркестратора..."
    />
  );
}

export function GamePage() {
  return (
    <GameErrorBoundary>
      <Suspense fallback={<GamePageSuspenseFallback />}>
        <GameOrchestrator />
      </Suspense>
    </GameErrorBoundary>
  );
}
