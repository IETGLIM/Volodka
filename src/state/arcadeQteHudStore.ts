'use client';

import { create } from 'zustand';

interface ArcadeQteHudState {
  active: boolean;
  label: string;
  handler: (() => void) | null;
  bind: (handler: () => void, label?: string) => void;
  unbind: () => void;
  fire: () => void;
}

export const useArcadeQteHudStore = create<ArcadeQteHudState>((set, get) => ({
  active: false,
  label: 'СЕЙЧАС',
  handler: null,
  bind: (handler, label = 'СЕЙЧАС') => set({ active: true, label, handler }),
  unbind: () => set({ active: false, label: 'СЕЙЧАС', handler: null }),
  fire: () => {
    const { active, handler } = get();
    if (active && handler) handler();
  },
}));
