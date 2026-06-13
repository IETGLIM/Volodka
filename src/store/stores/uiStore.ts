import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createUISlice, type UISlice } from '../slices/uiSlice';
import { bindSliceCreator } from './bindSliceCreator';
export const useUIStore = create<UISlice>()(subscribeWithSelector(bindSliceCreator(createUISlice)));
export function getUIStoreState(): UISlice { return useUIStore.getState(); }
