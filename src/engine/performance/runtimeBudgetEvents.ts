/**
 * Runtime budget violation events for adaptive quality degradation.
 */

import type { BudgetViolation } from './RuntimeBudgetMonitor';

type Listener = (violations: BudgetViolation[]) => void;

const listeners = new Set<Listener>();

export function emitRuntimeBudgetViolations(violations: BudgetViolation[]): void {
  if (violations.length === 0) return;
  for (const fn of listeners) fn(violations);
}

export function subscribeRuntimeBudgetViolations(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
