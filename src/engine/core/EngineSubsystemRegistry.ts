/**
 * [roadmap:ARCH-02] Engine subsystem registration API.
 *
 * Replaces the hand-maintained dispose/revive list in `disposeGameEngine.ts`.
 * Each subsystem registers its dispose + revive callbacks at module import
 * time. `disposeGameEngine()` / `reviveGameEngine()` iterate the registry in
 * priority order — no manual list to keep in sync.
 *
 * Priority semantics:
 * - Dispose: HIGH → LOW (input first, EventBus last)
 * - Revive: LOW → HIGH (EventBus first, input last)
 *
 * Existing subsystems register via `registerEngineSubsystem()` at the bottom
 * of their module file. The registry is append-only — items can be registered
 * multiple times (last registration wins, enabling HMR re-registration).
 */

export interface EngineSubsystem {
  /** Unique id for diagnostics (e.g. 'combat', 'quest-tracker'). */
  id: string;
  /** Teardown callback (called on disposeGameEngine). Optional — some subsystems only revive. */
  dispose?: () => void;
  /** Re-arm callback (called on reviveGameEngine). Optional — some subsystems only dispose. */
  revive?: () => void;
  /**
   * Dispose priority — higher = called earlier.
   * Convention: 100=input, 90=runtime-state, 80=subsystems, 70=audio,
   * 60=gpu, 50=bridges, 10=EventBus.
   */
  disposePriority?: number;
  /**
   * Revive priority — lower = called earlier.
   * Convention: 10=EventBus, 50=bridges, 70=audio, 80=subsystems,
   * 90=runtime-state, 100=input.
   */
  revivePriority?: number;
}

interface RegisteredSubsystem {
  id: string;
  dispose?: () => void;
  revive?: () => void;
  disposePriority: number;
  revivePriority: number;
}

/** Default priorities — mirrors the hand-maintained order in disposeGameEngine.ts. */
export const ENGINE_SUBSYSTEM_PRIORITIES = {
  input: { dispose: 100, revive: 100 },
  runtimeState: { dispose: 90, revive: 90 },
  subsystem: { dispose: 80, revive: 80 },
  audio: { dispose: 70, revive: 70 },
  gpu: { dispose: 60, revive: 60 },
  bridge: { dispose: 50, revive: 50 },
  eventBus: { dispose: 10, revive: 10 },
} as const;

const registry = new Map<string, RegisteredSubsystem>();

/**
 * Register (or re-register) an engine subsystem.
 * Call at module import time. Safe to call multiple times — last wins (HMR-safe).
 */
export function registerEngineSubsystem(subsystem: EngineSubsystem): void {
  const disposePriority = subsystem.disposePriority ?? ENGINE_SUBSYSTEM_PRIORITIES.subsystem.dispose;
  const revivePriority = subsystem.revivePriority ?? ENGINE_SUBSYSTEM_PRIORITIES.subsystem.revive;
  registry.set(subsystem.id, {
    id: subsystem.id,
    dispose: subsystem.dispose,
    revive: subsystem.revive,
    disposePriority,
    revivePriority,
  });
}

/** Remove a subsystem from the registry (test-only). */
export function unregisterEngineSubsystem(id: string): void {
  registry.delete(id);
}

/** Dispose all registered subsystems in priority order (HIGH → LOW). Errors logged, never thrown. */
export function disposeAllEngineSubsystems(): void {
  const entries = [...registry.values()].sort(
    (a, b) => b.disposePriority - a.disposePriority,
  );
  for (const entry of entries) {
    if (!entry.dispose) continue;
    try {
      entry.dispose();
    } catch (err) {
      console.error(`[EngineSubsystemRegistry] dispose failed for '${entry.id}':`, err);
    }
  }
}

/** Revive all registered subsystems in priority order (LOW → HIGH). Errors logged, never thrown. */
export function reviveAllEngineSubsystems(): void {
  const entries = [...registry.values()].sort(
    (a, b) => a.revivePriority - b.revivePriority,
  );
  for (const entry of entries) {
    if (!entry.revive) continue;
    try {
      entry.revive();
    } catch (err) {
      console.error(`[EngineSubsystemRegistry] revive failed for '${entry.id}':`, err);
    }
  }
}

/** Test/diagnostics — count of registered subsystems. */
export function getEngineSubsystemCount(): number {
  return registry.size;
}

/** Test/diagnostics — list registered subsystem ids. */
export function getEngineSubsystemIds(): string[] {
  return [...registry.keys()];
}

/** Test-only — clear the registry. */
export function resetEngineSubsystemRegistry(): void {
  registry.clear();
}
