export { getCombinedGameState, invalidateCombinedGameStateCache, invalidateCombinedGameStateCacheIfStale } from './storeBindings';
export { applyCombinedPatch } from './patchState';
import type { StoreApi } from 'zustand';
import { usePlayerStore } from './stores/playerStore';
import { useExplorationStore } from './stores/explorationStore';
import { useWorldStore } from './stores/worldStore';
import { useUIStore } from './stores/uiStore';
import { useCutsceneStore } from './stores/cutsceneStore';
import { useSaveStore } from './stores/saveStore';
import { useDialogueHistoryStore } from './stores/dialogueHistoryStore';
import { useAchievementStore } from './stores/achievementStore';
import { useDifficultyStore } from './stores/difficultyStore';
// FIX (P1): the difficulty store was missing from SLICE_STORES, so mutations
// of useDifficultyStore (e.g. setGameDifficulty in SettingsPanel) did not
// mark the facade dirty nor flush useGameStore — React UI kept rendering a
// stale difficulty until some unrelated store changed.
const SLICE_STORES: Array<StoreApi<unknown>> = [usePlayerStore, useExplorationStore, useWorldStore, useUIStore, useCutsceneStore, useSaveStore, useDialogueHistoryStore, useAchievementStore, useDifficultyStore];

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

export function subscribeAllStores(
  listener: (sourceStore: StoreApi<unknown>) => void,
): () => void {
  let active = true;
  let scheduled = false;
  let scheduledSource: StoreApi<unknown> | null = null;
  const batchedListener = (sourceStore: StoreApi<unknown>): void => {
    if (!active) return;
    // Z4 (v4.40, этап 29): источник запоминается; при изменениях нескольких
    // слайсов за батч приоритет у фазового (ui/cutscene) — он форсит
    // синхронный flush фасада в gameStore.
    if (scheduled && scheduledSource !== sourceStore) {
      if (isPhaseSyncSlice(sourceStore)) scheduledSource = sourceStore;
    }
    if (scheduled) return;
    scheduled = true;
    scheduledSource = sourceStore;
    queueMicrotask(() => {
      scheduled = false;
      const source = scheduledSource;
      scheduledSource = null;
      if (!active) return;
      listener(source ?? sourceStore);
    });
  };
  const unsubs = SLICE_STORES.map((store) => store.subscribe(() => batchedListener(store)));
  return () => {
    active = false;
    for (const unsub of unsubs) unsub();
  };
}

/**
 * Z4 (v4.40, этап 29): фазовые слайсы (меню/интро/бой, катсцены) — их
 * изменения прокидываются в фасад синхронно, без rAF-ожидания.
 * Здесь — единственный источник истины по составу, gameStore читает
 * через этот предикат (без циклического импорта сторов).
 */
const PHASE_SYNC_SLICE_IDS: ReadonlySet<StoreApi<unknown>> = new Set([useUIStore, useCutsceneStore]);

export function isPhaseSyncSlice(store: StoreApi<unknown>): boolean {
  return PHASE_SYNC_SLICE_IDS.has(store);
}
