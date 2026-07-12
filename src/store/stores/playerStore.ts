import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createPlayerSlice, type PlayerSlice } from '../slices/playerSlice';
import { bindSliceCreator } from './bindSliceCreator';
export const usePlayerStore = create<PlayerSlice>()(subscribeWithSelector(bindSliceCreator(createPlayerSlice)));
export function getPlayerStoreState(): PlayerSlice { return usePlayerStore.getState(); }
