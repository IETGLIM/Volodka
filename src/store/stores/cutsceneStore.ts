import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createCutsceneSlice, type CutsceneSlice } from '../slices/cutsceneSlice';
import { bindSliceCreator } from './bindSliceCreator';

export const useCutsceneStore = create<CutsceneSlice>()(
  subscribeWithSelector(bindSliceCreator(createCutsceneSlice)),
);
export function getCutsceneStoreState(): CutsceneSlice { return useCutsceneStore.getState(); }
