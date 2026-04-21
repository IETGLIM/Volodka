'use client';

import { create } from 'zustand';

/**
 * Режим игры в обходе: обычный геймплей или вводная кат-сцена.
 * Кат-сцена блокирует ввод игрока (`PhysicsPlayer` `isLocked`) и может отключать орбиту `FollowCamera`.
 */
export type ExplorationGamePhase = 'gameplay' | 'intro_cutscene';

type GamePhaseState = {
  phase: ExplorationGamePhase;
  setExplorationPhase: (phase: ExplorationGamePhase) => void;
  completeIntroCutscene: () => void;
};

export const useGamePhaseStore = create<GamePhaseState>((set) => ({
  phase: 'gameplay',
  setExplorationPhase: (phase) => set({ phase }),
  completeIntroCutscene: () => set({ phase: 'gameplay' }),
}));
