import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createCutsceneSlice, type CutsceneSlice } from '../slices/cutsceneSlice';
export const useCutsceneStore = create<CutsceneSlice>()(subscribeWithSelector((...args) => ({ ...createCutsceneSlice(...args) })));
export function getCutsceneStoreState(): CutsceneSlice { return useCutsceneStore.getState(); }
