import { lazy, Suspense } from 'react';
import { GameErrorBoundary } from '@/components/game/GameErrorBoundary';

const GameOrchestrator = lazy(() =>
  import('./GameOrchestrator').then((m) => ({ default: m.GameOrchestrator })),
);

export function GamePage() {
  return (
    <GameErrorBoundary>
      <Suspense
        fallback={
          <div className="fixed inset-0 flex items-center justify-center bg-black">
            <span className="font-mono text-sm text-cyan-500/60 tracking-widest">ЗАГРУЗКА...</span>
          </div>
        }
      >
        <GameOrchestrator />
      </Suspense>
    </GameErrorBoundary>
  );
}
