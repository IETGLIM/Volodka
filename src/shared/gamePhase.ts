/**
 * Single runtime mode (`exploration`) with overlay phases as flags.
 * `getGamePhase` maps flags → legacy phase names for UI/system branching.
 */

export type GamePhase = 'menu' | 'intro' | 'exploration' | 'cutscene' | 'combat';

export type GamePhaseState = {
  mainMenuOpen: boolean;
  introActive: boolean;
  combatActive: boolean;
  activeCutsceneId: string | null;
};

/** Cold-boot phase flags — matrix poem intro before main menu (uiSlice + resetGame). */
export const BOOT_PHASE_FLAGS = {
  mainMenuOpen: false,
  introActive: true,
  combatActive: false,
} as const satisfies Pick<GamePhaseState, 'mainMenuOpen' | 'introActive' | 'combatActive'>;

export function getGamePhase(state: GamePhaseState): GamePhase {
  if (state.mainMenuOpen) return 'menu';
  if (state.introActive) return 'intro';
  if (state.combatActive) return 'combat';
  if (state.activeCutsceneId) return 'cutscene';
  return 'exploration';
}

/** Read computed phase from live store snapshot (non-React paths). */
export function readGamePhase(store: GamePhaseState): GamePhase {
  return getGamePhase(store);
}

/** Map legacy save `mode` field into phase flags (exploration-only runtime). */
export function phaseFlagsFromLegacyMode(
  legacyMode: string | undefined,
): Pick<GamePhaseState, 'mainMenuOpen' | 'introActive' | 'combatActive'> {
  switch (legacyMode) {
    case 'menu':
      return { mainMenuOpen: true, introActive: false, combatActive: false };
    case 'intro':
      return { mainMenuOpen: false, introActive: true, combatActive: false };
    case 'combat':
      return { mainMenuOpen: false, introActive: false, combatActive: true };
    case 'cutscene':
    case 'exploration':
    default:
      return { mainMenuOpen: false, introActive: false, combatActive: false };
  }
}

export function isGameplayPhase(phase: GamePhase): boolean {
  return phase === 'exploration' || phase === 'cutscene' || phase === 'combat';
}

export function blocksPanelShortcuts(phase: GamePhase): boolean {
  return phase === 'menu' || phase === 'intro' || phase === 'cutscene';
}

/** Clear menu/intro/combat flags. Cutscene phase uses activeCutsceneId separately. */
export function clearGameplayPhaseFlags(actions: {
  setMainMenuOpen: (open: boolean) => void;
  setIntroActive: (active: boolean) => void;
  setCombatActive: (active: boolean) => void;
}): void {
  actions.setMainMenuOpen(false);
  actions.setIntroActive(false);
  actions.setCombatActive(false);
}
