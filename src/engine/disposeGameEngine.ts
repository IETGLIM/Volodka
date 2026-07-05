/**
 * [roadmap:ARCH-02] Ordered teardown/revive of engine subsystems.
 *
 * Previously hand-maintained list of ~20 subsystems — adding a new subsystem
 * required editing BOTH disposeGameEngine() AND reviveGameEngine(). No
 * compile-time guarantee they stayed in sync.
 *
 * Now uses `EngineSubsystemRegistry` — subsystems register via
 * `registerEngineSubsystem()` in `engineSubsystemRegistrations.ts`. This
 * file is a thin wrapper that imports the registrations (side-effect) and
 * delegates to the registry.
 *
 * To add a new subsystem:
 * 1. Add `dispose()` + `revive()` exports to its module
 * 2. Add a `registerEngineSubsystem(...)` call in `engineSubsystemRegistrations.ts`
 * 3. Done — no need to edit this file.
 *
 * Idempotent — safe when child hook cleanups and this central dispose overlap.
 * EventBus is cleared last (priority 10) so scoped listener disposes can run.
 */

// Import registrations (side-effect: populates EngineSubsystemRegistry)
import '@/engine/core/engineSubsystemRegistrations';

import {
  disposeAllEngineSubsystems,
  reviveAllEngineSubsystems,
} from '@/engine/core/EngineSubsystemRegistry';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

let engineDisposed = false;

export function isGameEngineDisposed(): boolean {
  return engineDisposed;
}

/** Tear down all engine singletons. Safe to call multiple times. */
export function disposeGameEngine(): void {
  if (engineDisposed) return;
  engineDisposed = true;

  try {
    disposeAllEngineSubsystems();
  } catch (err) {
    console.error('[disposeGameEngine] teardown error:', err);
  }
}

/**
 * Re-arm singletons after dispose so React StrictMode remount works.
 * Call at GameOrchestrator mount before sub-orchestrator hooks run.
 */
export function reviveGameEngine(): void {
  engineDisposed = false;
  reviveAllEngineSubsystems();
}

registerHmrDispose(disposeGameEngine);
