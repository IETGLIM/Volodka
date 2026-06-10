/* ─── Volodka RPG – combat / panel hot-path selectors ─── */

import { useGameSelector } from './hooks';

/** CombatUI + HUD — shallow subscription to Zustand combat mirror. */
export function useCombatShellState() {
  return useGameSelector((s) => ({
    combatActive: s.combatActive,
    combatSession: s.combatSession,
  }));
}

/** Panel stack consumers that hide during combat. */
export function useCombatPanelGateState() {
  return useGameSelector((s) => ({
    combatActive: s.combatActive,
    mainMenuOpen: s.mainMenuOpen,
    showStoryOverlay: s.showStoryOverlay,
  }));
}
