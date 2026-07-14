/* ─── Volodka RPG – UI / cutscene slice selectors ─── */

import type { GameMode } from '@/shared/types/game';
import type { TutorialFlags } from '../shared';
import { getGamePhase, type GamePhase } from '@/shared/gamePhase';
import { getGameStore } from '../gameStore';
import { useGameSelector, useGamePrimitive } from './hooks';
import { useTutorialReady } from './tutorialSelectors';

function selectPhaseSlice(s = getGameStore()) {
  return {
    mainMenuOpen: s.mainMenuOpen,
    introActive: s.introActive,
    combatActive: s.combatActive,
    activeCutsceneId: s.activeCutsceneId,
  };
}

/* ─── Plain getters ─── */

/** Stored mode — always `'exploration'`. */
export const selectStoredGameMode = (s = getGameStore()): GameMode => s.mode;

/** @deprecated Alias — use selectGamePhase. */
export const selectGameMode = (s = getGameStore()): GamePhase => selectGamePhase(s);

export const selectGamePhase = (s = getGameStore()): GamePhase =>
  getGamePhase(selectPhaseSlice(s));

export const selectTutorialFlags = (s = getGameStore()): TutorialFlags => s.tutorialFlags;

/* ─── React hooks ─── */

/** Computed UI phase for branching (menu / intro / combat / cutscene / exploration). */
export function useGamePhase() {
  return useGamePrimitive(selectGamePhase);
}

/** @deprecated Alias — use useGamePhase(). */
export function useGameMode() {
  return useGamePhase();
}

export function useTutorialFlags() {
  return useGameSelector((s) => s.tutorialFlags);
}

/** True when the FirstPlayTutorial overlay is actively showing (not completed,
 *  not disabled, tutorial-ready, no story overlay / cutscene blocking it).
 *  Used by StoryGuidanceHUD and other HUD elements to avoid stacking on top
 *  of the tutorial card during the first 10 minutes. */
export function useTutorialActive(): boolean {
  const tutorialReady = useTutorialReady();
  const tutorialFlags = useTutorialFlags();
  const showStoryOverlay = useGamePrimitive((s) => s.showStoryOverlay);
  const activeCutsceneId = useGamePrimitive((s) => s.activeCutsceneId);
  return (
    tutorialReady
    && !tutorialFlags.tutorialsCompleted
    && !tutorialFlags.tutorialsDisabled
    && !showStoryOverlay
    && !activeCutsceneId
  );
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

export function useNarrativeKind() {
  return useGamePrimitive((s) => s.narrativeKind);
}

export function useDevToolsArmed() {
  return useGamePrimitive((s) => s.devToolsArmed);
}

export function useMusicEnabled() {
  return useGamePrimitive((s) => s.musicEnabled);
}

export function useGlobalWeatherControls() {
  return useGameSelector((s) => ({
    weatherEnabled: s.weatherEnabled,
    rainIntensity: s.rainIntensity,
  }));
}

export function usePoemPowers() {
  return useGameSelector((s) => s.poemPowers);
}

export function useConversationLog() {
  return useGameSelector((s) => s.conversationLog);
}

export function useThoughtHistory() {
  return useGameSelector((s) => s.thoughtHistory);
}
