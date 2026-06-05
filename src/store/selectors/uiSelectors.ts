/* ─── Volodka RPG – UI / cutscene slice selectors ─── */

import type { GameMode } from '@/shared/types/game';
import type { TutorialFlags } from '../shared';
import { getGameStore } from '../gameStore';
import { useGameSelector, useGamePrimitive } from './hooks';

/* ─── Plain getters ─── */

export const selectGameMode = (s = getGameStore()): GameMode => s.mode;

export const selectTutorialFlags = (s = getGameStore()): TutorialFlags => s.tutorialFlags;

/* ─── React hooks ─── */

export function useGameMode() {
  return useGamePrimitive((s) => s.mode);
}

export function useTutorialFlags() {
  return useGameSelector((s) => s.tutorialFlags);
}

export function useCutsceneWaypoints() {
  return useGameSelector((s) => s.cutsceneWaypoints);
}

export function useActiveCutsceneId() {
  return useGamePrimitive((s) => s.activeCutsceneId);
}

export function useCurrentNodeId() {
  return useGamePrimitive((s) => s.currentNodeId);
}

export function useNoirMode() {
  return useGamePrimitive((s) => s.noirMode);
}

export function useIntroSeen() {
  return useGamePrimitive((s) => s.introSeen);
}

export function useShowStoryOverlay() {
  return useGamePrimitive((s) => s.showStoryOverlay);
}

export function useJournalOpen() {
  return useGamePrimitive((s) => s.journalOpen);
}

export function useJournalTab() {
  return useGamePrimitive((s) => s.journalTab);
}

export function useLoreEntries() {
  return useGameSelector((s) => s.loreEntries);
}
