'use client';

import { create } from 'zustand';

export type ExplorationRackConsoleSession = {
  headline: string;
  lines: readonly string[];
  proceedLabel: string;
  dismissLabel: string;
  onProceed: () => void;
};

type ExplorationRackConsoleState = {
  session: ExplorationRackConsoleSession | null;
  openSession: (s: ExplorationRackConsoleSession) => void;
  closeSession: () => void;
  /** Закрыть оверлей и запустить цепочку (обычно открытие wire-hack). */
  proceedSession: () => void;
};

/**
 * Полноэкранная «консоль стойки» в обходе перед `HackingWireMinigameOverlay`.
 */
export const useExplorationRackConsoleStore = create<ExplorationRackConsoleState>((set, get) => ({
  session: null,
  openSession: (s) => set({ session: s }),
  closeSession: () => set({ session: null }),
  proceedSession: () => {
    const s = get().session;
    if (!s) return;
    set({ session: null });
    queueMicrotask(() => s.onProceed());
  },
}));
