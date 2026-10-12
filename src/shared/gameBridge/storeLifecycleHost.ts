/**
 * Engine→Store lifecycle callbacks (shared layer).
 * Used when engine teardown must reset store module state without importing @/store.
 */

import type { GamePhase } from '@/shared/gamePhase';

/** Снимок стор-флагов для watchдога локомоции (v4.48): движок не может
 * импортировать @/store — поставщик привязывается в bootstrap
 * (bindApplicationLayers), где импорт стора разрешён. */
export interface LocomotionGateSnapshot {
  phase: GamePhase;
  showStoryOverlay: boolean;
  diegeticNarrative: boolean;
  activeCutscene: boolean;
}

export interface StoreLifecycleHost {
  resetPlayerXpBatch(): void;
  /** v4.48: источник флагов для locomotionFailsafe (опционально —
   * старые биндинги в тестах не обязаны его предоставлять). */
  readLocomotionGateSnapshot?(): LocomotionGateSnapshot | null;
}

let host: StoreLifecycleHost | null = null;

export function bindStoreLifecycleHost(next: StoreLifecycleHost): void {
  host = next;
}

export function resetPlayerXpBatchFromEngine(): void {
  host?.resetPlayerXpBatch();
}

/** v4.48: доступ движка к стор-флагам локомоции без импорта @/store. */
export function readLocomotionGateSnapshotFromEngine(): LocomotionGateSnapshot | null {
  try {
    return host?.readLocomotionGateSnapshot?.() ?? null;
  } catch {
    return null; // HMR/teardown — стор недоступен
  }
}

/** Test helper */
export function resetStoreLifecycleHostForTests(): void {
  host = null;
}
