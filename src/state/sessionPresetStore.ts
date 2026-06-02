'use client';

import { create } from 'zustand';
import type { SessionGamePreset } from '@/config/gameModePresets';

interface SessionPresetState {
  preset: SessionGamePreset;
  setPreset: (preset: SessionGamePreset) => void;
}

export const useSessionPresetStore = create<SessionPresetState>((set) => ({
  preset: 'fullStory',
  setPreset: (preset) => set({ preset }),
}));

export function getActiveSessionPreset(): SessionGamePreset {
  return useSessionPresetStore.getState().preset;
}
