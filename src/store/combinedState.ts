export { getCombinedGameState } from './storeBindings';
export { applyCombinedPatch } from './patchState';
import type { StoreApi } from 'zustand';
import { usePlayerStore } from './stores/playerStore';
import { useExplorationStore } from './stores/explorationStore';
import { useWorldStore } from './stores/worldStore';
import { useUIStore } from './stores/uiStore';
import { useCutsceneStore } from './stores/cutsceneStore';
import { useSaveStore } from './stores/saveStore';
const SLICE_STORES: Array<StoreApi<unknown>> = [usePlayerStore, useExplorationStore, useWorldStore, useUIStore, useCutsceneStore, useSaveStore];
export function subscribeAllStores(listener: () => void): () => void {
  const unsubs = SLICE_STORES.map((store) => store.subscribe(() => listener()));
  return () => { for (const unsub of unsubs) unsub(); };
}
