'use client';

import { create } from 'zustand';

interface InteractionHintState {
  visible: boolean;
  text: string;
  show: (text: string) => void;
  hide: () => void;
}

export const useInteractionHintStore = create<InteractionHintState>((set) => ({
  visible: false,
  text: 'E',
  show: (text) => set({ visible: true, text }),
  hide: () => set({ visible: false }),
}));
