'use client';

import { useEffect, useState } from 'react';
import { OrchestratorContent } from './orchestrator/OrchestratorContent';

/** Thin client coordinator — waits for browser APIs, then mounts orchestrator layers. */
export function GameOrchestrator() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div data-testid="game-orchestrator">
      <OrchestratorContent />
    </div>
  );
}
