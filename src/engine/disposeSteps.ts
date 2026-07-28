/**
 * Lightweight dispose-step registry so store modules can register teardown
 * without importing disposeGameEngine (avoids heavy / circular imports).
 */

const disposeSteps: Array<() => void> = [];

/** Register a step to run during disposeGameEngine (e.g. clearAutoCloseTimers). */
export function registerGameEngineDisposeStep(step: () => void): () => void {
  disposeSteps.push(step);
  return () => {
    const idx = disposeSteps.indexOf(step);
    if (idx !== -1) disposeSteps.splice(idx, 1);
  };
}

/** Run all registered steps (called from disposeGameEngine). */
export function runGameEngineDisposeSteps(): void {
  for (const step of disposeSteps) {
    try {
      step();
    } catch (err) {
      console.error('[disposeGameEngine] dispose step error:', err);
    }
  }
}
