'use client';

import { create } from 'zustand';

export type WireHackOverlayRequest = {
  title: string;
  /** Индексы узлов 0..3 — порядок кликов для успеха. */
  sequence: readonly number[];
  onFinished: (success: boolean) => void;
};

type WireHackOverlayState = {
  active: WireHackOverlayRequest | null;
  openWireHack: (req: WireHackOverlayRequest) => void;
  closeWireHack: () => void;
};

/**
 * Полноэкранная мини-игра «взлом» (матрица узлов) поверх обхода.
 * Закрытие и колбэк — из UI (`HackingWireMinigameOverlay`).
 */
export const useWireHackOverlayStore = create<WireHackOverlayState>((set) => ({
  active: null,
  openWireHack: (req) => set({ active: req }),
  closeWireHack: () => set({ active: null }),
}));
