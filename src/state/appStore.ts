'use client';

import { create } from 'zustand';

export type AppPhase = 'loading' | 'intro' | 'menu' | 'game';

interface AppState {
  phase: AppPhase;
  revealedPoemId: string | null;
  setPhase: (phase: AppPhase) => void;
  setRevealedPoemId: (poemId: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  phase: 'loading',
  revealedPoemId: null,
  setPhase: (phase) => set({ phase }),
  setRevealedPoemId: (revealedPoemId) => set({ revealedPoemId }),
}));
