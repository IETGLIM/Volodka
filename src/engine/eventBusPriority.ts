/* ─── EventBus listener priority tiers ─── */
/*
 * Lower number runs first. Same tier runs in registration order (stable FIFO).
 *
 * combat:turn example:
 *   Engine      — sync authoritative combat state
 *   Orchestrator — quests, achievements, save hooks
 *   UI          — CombatUI overlays, toasts
 *   FX          — camera shake, floating damage, audio
 *   Debug       — DevPanel onAny logger (always last)
 */

export const EventBusPriority = {
  Engine: 0,
  Orchestrator: 100,
  UI: 200,
  FX: 300,
  Debug: 1000,
  /** Default when priority is omitted on eventBus.on() */
  Normal: 200,
} as const;

export type EventBusPriorityValue = (typeof EventBusPriority)[keyof typeof EventBusPriority];

export interface PrioritizedListener<T = unknown> {
  handler: T;
  priority: number;
  /** Monotonic registration sequence — tie-breaker within the same priority tier */
  order: number;
}

export function compareListeners<T>(
  a: PrioritizedListener<T>,
  b: PrioritizedListener<T>,
): number {
  if (a.priority !== b.priority) {
    return a.priority - b.priority;
  }
  return a.order - b.order;
}

export function snapshotListeners<T>(listeners: readonly PrioritizedListener<T>[]): PrioritizedListener<T>[] {
  return [...listeners].sort(compareListeners);
}
