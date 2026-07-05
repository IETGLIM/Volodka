export { getCombinedGameState, invalidateCombinedGameStateCache } from './storeBindings';
export { applyCombinedPatch } from './patchState';
import type { StoreApi } from 'zustand';
import { usePlayerStore } from './stores/playerStore';
import { useExplorationStore } from './stores/explorationStore';
import { useWorldStore } from './stores/worldStore';
import { useUIStore } from './stores/uiStore';
import { useCutsceneStore } from './stores/cutsceneStore';
import { useSaveStore } from './stores/saveStore';
const SLICE_STORES: Array<StoreApi<unknown>> = [usePlayerStore, useExplorationStore, useWorldStore, useUIStore, useCutsceneStore, useSaveStore];

let sliceMutationFrameId: number | null = null;
let sliceMutationMicrotaskScheduled = false;

/** Coalesce post-mutation work across macrotasks into one frame (or one microtask fallback). */
export function scheduleAfterSliceStoresSettle(callback: () => void): void {
  const run = (): void => {
    sliceMutationFrameId = null;
    sliceMutationMicrotaskScheduled = false;
    callback();
  };

  if (typeof requestAnimationFrame === 'function') {
    if (sliceMutationFrameId != null) return;
    sliceMutationFrameId = requestAnimationFrame(run);
    return;
  }

  if (sliceMutationMicrotaskScheduled) return;
  sliceMutationMicrotaskScheduled = true;
  queueMicrotask(run);
}

/** Test harness — reset deferred slice-mutation scheduling between cases. */
export function resetSliceMutationSchedulerForTests(): void {
  sliceMutationFrameId = null;
  sliceMutationMicrotaskScheduled = false;
}

export function subscribeAllStores(listener: () => void): () => void {
  let scheduled = false;
  const batchedListener = (): void => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      listener();
    });
  };
  const unsubs = SLICE_STORES.map((store) => store.subscribe(batchedListener));
  return () => { for (const unsub of unsubs) unsub(); };
}
