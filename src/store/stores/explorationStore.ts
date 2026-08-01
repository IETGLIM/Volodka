import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createExplorationSlice, type ExplorationSlice } from '../slices/explorationSlice';
import { bindSliceCreator } from './bindSliceCreator';
export const useExplorationStore = create<ExplorationSlice>()(subscribeWithSelector(bindSliceCreator(createExplorationSlice)));
export function getExplorationStoreState(): ExplorationSlice { return useExplorationStore.getState(); }

/** Live player position — prefer over `getGameStore().exploration.playerPosition` (facade lag). */
export function getLivePlayerPosition(): [number, number, number] {
  return useExplorationStore.getState().exploration.playerPosition;
}

/** Live scene id from the exploration slice. */
export function getLiveCurrentSceneId() {
  return useExplorationStore.getState().exploration.currentSceneId;
}
