import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createSaveSlice, type SaveSlice } from '../slices/saveSlice';
import { bindSliceCreator } from './bindSliceCreator';
export const useSaveStore = create<SaveSlice>()(subscribeWithSelector(bindSliceCreator(createSaveSlice)));
export function getSaveStoreState(): SaveSlice { return useSaveStore.getState(); }
