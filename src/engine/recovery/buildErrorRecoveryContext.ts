/* ─── Volodka RPG – diagnostic snapshot for error recovery ─── */

import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import type { ErrorRecoveryContext } from './errorRecoveryTypes';

const SESSION_STARTED_AT =
  typeof performance !== 'undefined' ? performance.now() : 0;

export function buildErrorCode(error: Error): string {
  const stamp = Date.now().toString(36).slice(-5).toUpperCase();
  const digest = Math.abs(
    error.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) +
      error.message.length,
  )
    .toString(36)
    .slice(-3)
    .toUpperCase();
  return `VK-${stamp}-${digest}`;
}

export function buildErrorRecoveryContext(error?: Error | null): ErrorRecoveryContext {
  const context: ErrorRecoveryContext = {
    sessionUptimeMs:
      typeof performance !== 'undefined'
        ? Math.round(performance.now() - SESSION_STARTED_AT)
        : undefined,
    gameVersion: '4.2.2',
  };

  if (error) {
    context.errorCode = buildErrorCode(error);
  }

  try {
    const snapshot = getGameSnapshot();
    context.sceneId = snapshot.exploration.currentSceneId;
    context.gameMode = snapshot.mode;
    context.playerLevel = snapshot.playerState.progression.level;
  } catch {
    // Store may be unavailable during catastrophic failures.
  }

  return context;
}
