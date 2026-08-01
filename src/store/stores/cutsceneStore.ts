import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createCutsceneSlice, type CutsceneSlice } from '../slices/cutsceneSlice';
import { bindSliceCreator } from './bindSliceCreator';

export const useCutsceneStore = create<CutsceneSlice>()(
  subscribeWithSelector(bindSliceCreator(createCutsceneSlice)),
);
export function getCutsceneStoreState(): CutsceneSlice { return useCutsceneStore.getState(); }

/** Live cutscene id — prefer over `getGameStore().activeCutsceneId` (facade can lag one rAF). */
export function getActiveCutsceneId(): string | null {
  return useCutsceneStore.getState().activeCutsceneId;
}
