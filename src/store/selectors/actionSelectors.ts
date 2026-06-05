/* ─── Volodka RPG – stable store action hooks ─── */
/* Zustand actions are referentially stable — plain useGameStore is fine. */

import { useGameStore } from '../gameStore';
import { useGameSelector } from './hooks';

/* ── UI actions ── */

export function useSetMode() {
  return useGameStore((s) => s.setMode);
}

export function useSetShowStoryOverlay() {
  return useGameStore((s) => s.setShowStoryOverlay);
}

export function useSetCurrentNodeId() {
  return useGameStore((s) => s.setCurrentNodeId);
}

export function useSetJournalOpen() {
  return useGameStore((s) => s.setJournalOpen);
}

export function useSetJournalTab() {
  return useGameStore((s) => s.setJournalTab);
}

export function useToggleJournal() {
  return useGameStore((s) => s.toggleJournal);
}

export function useAddLoreEntry() {
  return useGameStore((s) => s.addLoreEntry);
}

export function useVisitNode() {
  return useGameStore((s) => s.visitNode);
}

/* ── Player actions ── */

export function useEquipItem() {
  return useGameStore((s) => s.equipItem);
}

export function useUnequipItem() {
  return useGameStore((s) => s.unequipItem);
}

export function useConsumableActions() {
  return useGameSelector((s) => ({
    removeItem: s.removeItem,
    addEnergy: s.addEnergy,
    addStress: s.addStress,
    addKarma: s.addKarma,
    addSkill: s.addSkill,
  }));
}

/* ── Save actions ── */

export function useSaveGame() {
  return useGameStore((s) => s.saveGame);
}

export function useLoadGame() {
  return useGameStore((s) => s.loadGame);
}

export function useResetGame() {
  return useGameStore((s) => s.resetGame);
}
