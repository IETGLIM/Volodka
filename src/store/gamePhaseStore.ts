'use client';

import { create } from 'zustand';

/**
 * Режим игры в обходе: обычный геймплей или вводная кат-сцена.
 * Кат-сцена блокирует ввод игрока (`PhysicsPlayer` `isLocked`) и отключает орбиту `FollowCamera` (`cutsceneActive`).
 */
export type ExplorationGamePhase = 'gameplay' | 'intro_cutscene';

type GamePhaseState = {
  phase: ExplorationGamePhase;
  /** Подпись внизу экрана (кинематограф). */
  introCaption: string | null;
  /** Полноэкранный оверлей «лифт 10 → 3». */
  introElevatorOverlay: boolean;
  setExplorationPhase: (phase: ExplorationGamePhase) => void;
  setIntroCaption: (caption: string | null) => void;
  setIntroElevatorOverlay: (open: boolean) => void;
  /**
   * После текстового IntroScreen: игрок уже у стола в `volodka_room`, включается 3D-интро.
   * Не вызывать при «Продолжить» из сохранения.
   */
  beginOpeningCutsceneAfterTextIntro: () => void;
  completeIntroCutscene: () => void;
};

export const useGamePhaseStore = create<GamePhaseState>((set) => ({
  phase: 'gameplay',
  introCaption: null,
  introElevatorOverlay: false,
  setExplorationPhase: (phase) => set({ phase }),
  setIntroCaption: (introCaption) => set({ introCaption }),
  setIntroElevatorOverlay: (introElevatorOverlay) => set({ introElevatorOverlay }),
  beginOpeningCutsceneAfterTextIntro: () =>
    set({
      phase: 'intro_cutscene',
      introCaption: null,
      introElevatorOverlay: false,
    }),
  completeIntroCutscene: () =>
    set({
      phase: 'gameplay',
      introCaption: null,
      introElevatorOverlay: false,
    }),
}));
