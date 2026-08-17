import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createAchievementSlice, type AchievementSlice } from '../slices/achievementSlice';
import { bindSliceCreator } from './bindSliceCreator';
export const useAchievementStore = create<AchievementSlice>()(subscribeWithSelector(bindSliceCreator(createAchievementSlice)));
export function getAchievementStoreState(): AchievementSlice { return useAchievementStore.getState(); }
