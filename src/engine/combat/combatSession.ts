/* ─── Combat session manager — generation tokens, timers, return stack ─── */

import type { CombatState } from './types';

/** Max nested story→combat returns; excess oldest entries are dropped with a warn. */
const MAX_RETURN_STACK_DEPTH = 8;

/**
 * Instance-scoped combat session manager with generation tokens.
 * Async callbacks capture the generation at schedule time and no-op if
 * a newer combat session has started or the current one was torn down.
 */
export class CombatManager {
  private _state: CombatState | null = null;
  private listeners = new Set<(state: CombatState) => void>();
  /** G12: Stack of storyNode IDs to return to after combat ends */
  private returnStack: string[] = [];
  private generation = 0;
  private timers = new Set<ReturnType<typeof setTimeout>>();

  getState(): CombatState | null {
    return this._state;
  }

  setState(next: CombatState | null): void {
    this._state = next;
  }

  notifyListeners(): void {
    const state = this._state;
    if (state) {
      this.listeners.forEach((fn) => fn(state));
    }
  }

  subscribe(listener: (state: CombatState) => void): () => void {
    this.listeners.add(listener);
    if (this._state) listener(this._state);
    return () => this.listeners.delete(listener);
  }

  /** Start a new combat session — invalidates pending async work from prior sessions. */
  beginSession(): void {
    this.clearTimers();
    this.generation += 1;
  }

  /** Tear down the active session — invalidates in-flight async callbacks. */
  endSession(): void {
    this.clearTimers();
    this.generation += 1;
    this._state = null;
  }

  /** Cancel timers and drop listener refs (unmount / HMR). */
  dispose(): void {
    this.endSession();
    this.listeners.clear();
    this.returnStack.length = 0;
  }

  pushReturnNode(nodeId: string): void {
    if (this.returnStack.length >= MAX_RETURN_STACK_DEPTH) {
      const dropped = this.returnStack.shift();
      console.warn(
        `[CombatSystem] returnStack capped at ${MAX_RETURN_STACK_DEPTH}; dropped oldest entry "${dropped}"`,
      );
    }
    this.returnStack.push(nodeId);
  }

  popReturnNode(): string | undefined {
    return this.returnStack.pop();
  }

  /** Pop the return entry for a combat session that is being replaced without a normal exit. */
  discardOrphanedReturnNode(): void {
    const orphaned = this.popReturnNode();
    if (orphaned) {
      console.warn(`[CombatSystem] Discarded orphaned return node "${orphaned}" from interrupted combat`);
    }
  }

  private clearTimers(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
  }

  /** Schedule combat work that is cancelled when the session generation changes. */
  schedule(delayMs: number, fn: () => void): void {
    const capturedGeneration = this.generation;
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (capturedGeneration !== this.generation) return;
      fn();
    }, delayMs);
    this.timers.add(timer);
  }
}

/** Shared combat session singleton used by player/turn/outcome modules. */
export const combatSession = new CombatManager();
