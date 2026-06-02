import { GameErrorBoundary } from '@/components/game/GameErrorBoundary';
import { GameOrchestrator } from '@/components/game/GameOrchestrator';

export function GamePage() {
  return (
    <GameErrorBoundary>
      <GameOrchestrator />
    </GameErrorBoundary>
  );
}
