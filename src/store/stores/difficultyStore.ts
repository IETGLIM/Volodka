import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createDifficultySlice, type DifficultySlice } from '../slices/difficultySlice';
import { bindSliceCreator } from './bindSliceCreator';

export const useDifficultyStore = create<DifficultySlice>()(
  subscribeWithSelector(bindSliceCreator(createDifficultySlice)),
);

export function getDifficultyStoreState(): DifficultySlice {
  return useDifficultyStore.getState();
}
