/* ─── Volodka RPG – Combat slice (Zustand mirror of CombatManager) ─── */
/* UI reads combatSession via selectors; CombatSystem remains authoritative. */

import type { StateCreator } from 'zustand';
import type { CombatState } from '@/shared/types/game';
import type { GameStoreState } from '../types';
import { getCombatState, subscribeToCombat } from '@/engine/CombatSystem';

/** Lightweight session phase mirrored from CombatManager syncCombatSlice. */
export type CombatSessionStatus = 'idle' | 'active' | 'resolving';

export interface CombatSliceState {
  /** Snapshot synced from CombatManager — null when no active session. */
  combatSession: CombatState | null;
}

export interface CombatSlice extends CombatSliceState {
  setCombatSession: (state: CombatState | null) => void;
  syncCombatSessionFromEngine: () => void;
}

let bridgeInstalled = false;

/** Subscribe CombatManager → store; call once at orchestrator mount. */
export function installCombatStoreBridge(
  setSession: (state: CombatState | null) => void,
): () => void {
  if (bridgeInstalled) {
    setSession(getCombatState());
    return () => {};
  }
  bridgeInstalled = true;
  setSession(getCombatState());
  return subscribeToCombat(setSession);
}

export const createCombatSlice: StateCreator<GameStoreState, [], [], CombatSlice> = (set) => ({
  combatSession: null,
  setCombatSession: (combatSession) => set({ combatSession }),
  syncCombatSessionFromEngine: () => set({ combatSession: getCombatState() }),
});
