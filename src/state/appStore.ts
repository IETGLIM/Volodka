'use client';

import { create } from 'zustand';

export type AppPhase = 'loading' | 'intro' | 'menu' | 'game';

interface AppState {
  phase: AppPhase;
  setPhase: (phase: AppPhase) => void;
}

export const useAppStore = create<AppState>((set) => ({
  phase: 'loading',
  setPhase: (phase) => set({ phase }),
}));
