'use client';

import { create } from 'zustand';

interface ArcadeScoreState {
  score: number;
  combo: number;
  maxCombo: number;
  addScore: (points: number, reason?: string) => void;
  missCombo: () => void;
  reset: () => void;
}

export const useArcadeScoreStore = create<ArcadeScoreState>((set, get) => ({
  score: 0,
  combo: 0,
  maxCombo: 0,
  addScore: (points) => {
    const combo = get().combo + 1;
    const bonus = Math.min(combo * 5, 50);
    set((s) => ({
      combo,
      maxCombo: Math.max(s.maxCombo, combo),
      score: s.score + points + bonus,
    }));
  },
  missCombo: () => set({ combo: 0 }),
  reset: () => set({ score: 0, combo: 0, maxCombo: 0 }),
}));

export function computeArcadeRank(score: number): 'S' | 'A' | 'B' | 'C' {
  if (score >= 400) return 'S';
  if (score >= 250) return 'A';
  if (score >= 120) return 'B';
  return 'C';
}
