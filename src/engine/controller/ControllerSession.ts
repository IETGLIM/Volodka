/**
 * Generation-guarded session for controller classes and orchestrator hooks.
 * Async callbacks capture generation at schedule time and no-op when stale/disposed.
 */
export class ControllerSession {
  private generation = 0;
  private disposed = false;
  private timers = new Set<ReturnType<typeof setTimeout>>();

  /** Invalidate pending async work and start a fresh generation. */
  begin(): number {
    this.clearTimers();
    this.disposed = false;
    this.generation += 1;
    return this.generation;
  }

  /**
   * Cancel pending timers and invalidate the current generation without tearing
   * down the session — use when abandoning one operation but keeping the hook alive.
   */
  cancel(): void {
    this.clearTimers();
    this.generation += 1;
  }

  /** Tear down — bumps generation so in-flight callbacks become no-ops. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.clearTimers();
    this.generation += 1;
  }

  isDisposed(): boolean {
    return this.disposed;
  }

  getGeneration(): number {
    return this.generation;
  }

  isCurrent(generation: number): boolean {
    return !this.disposed && generation === this.generation;
  }

  schedule(fn: () => void, ms: number): void {
    const generation = this.generation;
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (!this.isCurrent(generation)) return;
      fn();
    }, ms);
    this.timers.add(timer);
  }

  clearTimers(): void {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}
