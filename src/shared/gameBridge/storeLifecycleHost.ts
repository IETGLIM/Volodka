/**
 * Engine→Store lifecycle callbacks (shared layer).
 * Used when engine teardown must reset store module state without importing @/store.
 */

export interface StoreLifecycleHost {
  resetPlayerXpBatch(): void;
}

let host: StoreLifecycleHost | null = null;

export function bindStoreLifecycleHost(next: StoreLifecycleHost): void {
  host = next;
}

export function resetPlayerXpBatchFromEngine(): void {
  host?.resetPlayerXpBatch();
}

/** Test helper */
export function resetStoreLifecycleHostForTests(): void {
  host = null;
}
