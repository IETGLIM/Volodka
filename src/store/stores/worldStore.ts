import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createWorldSlice, type WorldSlice } from '../slices/worldSlice';
import { bindSliceCreator } from './bindSliceCreator';
export const useWorldStore = create<WorldSlice>()(subscribeWithSelector(bindSliceCreator(createWorldSlice)));
export function getWorldStoreState(): WorldSlice { return useWorldStore.getState(); }
