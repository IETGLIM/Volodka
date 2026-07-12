import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createExplorationSlice, type ExplorationSlice } from '../slices/explorationSlice';
import { bindSliceCreator } from './bindSliceCreator';
export const useExplorationStore = create<ExplorationSlice>()(subscribeWithSelector(bindSliceCreator(createExplorationSlice)));
export function getExplorationStoreState(): ExplorationSlice { return useExplorationStore.getState(); }
